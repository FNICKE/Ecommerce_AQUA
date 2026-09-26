// controllers/productController.js
import pool from '../config/db.js';
import multer from 'multer';
import path from 'path';
import slugify from 'slugify';

// ─── Multer Setup for Image Upload ──────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/products/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpg, jpeg, png, webp) are allowed!'));
  }
});

// ─── Helper: safely parse JSON field ─────────────────────────────────────
function parseJsonField(val) {
  if (Array.isArray(val)) return val;
  if (!val || val === 'null') return [];
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseCsv(csvText) {
  const normalized = csvText.replace(/^\uFEFF/, '').replace(/\r/g, '').trim();
  if (!normalized) return { headers: [], rows: [] };

  const lines = normalized.split('\n').filter((line) => line.trim().length > 0);
  if (!lines.length) return { headers: [], rows: [] };

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const rows = lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = (cols[idx] ?? '').trim();
    });
    return row;
  });

  return { headers, rows };
}

function intOrDefault(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

// ─── GET ALL PRODUCTS ────────────────────────────────────────────────────
// Used by frontend /products page
export const getAllProducts = async (req, res) => {
  try {
    const { category_id, search, page = 1, limit = 50, admin, brand, weight, sort, on_offer, attribute_values } = req.query;
    const isAdmin = admin === 'true';
    const onOfferOnly = on_offer === 'true';

    let query = `
      SELECT 
        p.id,
        p.name,
        p.short_description,
        p.description,
        p.stock,
        p.image,
        p.slug,
        p.other_images,
        p.tags,
        p.brand,
        p.minimum_order_quantity,
        p.quantity_step_size,
        p.status,
        p.date_added,
        p.category_id,
        c.name AS category_name,
        p.tax,
        p.type,
        p.stock_type,
        p.indicator,
        p.cod_allowed,
        p.is_returnable,
        p.is_cancelable,
        pv.id AS default_variant_id,
        pv.price,
        pv.special_price,
        pv.stock AS variant_stock,
        pv.sku,
        p.asin,
        p.row_order
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv 
        ON pv.product_id = p.id 
        AND pv.status = 1
      WHERE 1=1
    `;

    // Only filter by status=1 for public-facing requests; admin can see all
    if (!isAdmin) {
      query += ' AND p.status = 1';
    }

    const params = [];

    let categoryIds = [];
    if (category_id) {
      const [subcats] = await pool.query('SELECT id FROM categories WHERE parent_id = ? OR id = ?', [category_id, category_id]);
      categoryIds = subcats.map(r => r.id);
    }

    if (category_id) {
      if (categoryIds.length > 0) {
        query += ` AND p.category_id IN (${categoryIds.map(() => '?').join(',')})`;
        params.push(...categoryIds);
      } else {
        query += ' AND p.category_id = ?';
        params.push(category_id);
      }
    }

    if (search) {
      const words = search.trim().split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        const searchClauses = words.map(() => '(p.name LIKE ? OR p.short_description LIKE ? OR p.tags LIKE ?)');
        query += ` AND (${searchClauses.join(' OR ')})`;
        words.forEach(word => {
          params.push(`%${word}%`, `%${word}%`, `%${word}%`);
        });
      }
    }

    if (brand) {
      const brandList = brand.split(',').map(b => b.trim()).filter(Boolean);
      if (brandList.length > 0) {
        query += ` AND p.brand IN (${brandList.map(() => '?').join(',')})`;
        params.push(...brandList);
      }
    }

    if (onOfferOnly) {
      query += ' AND pv.special_price IS NOT NULL AND pv.special_price > 0 AND pv.special_price < pv.price';
    }

    if (weight) {
      const weightList = weight.split(',').map(w => w.trim()).filter(Boolean);
      if (weightList.length > 0) {
        const clauses = [];
        weightList.forEach(w => {
          let wClause = '(pv.weight = ? OR pv.weight = ? OR pv.weight = ? OR pv.weight = ?';
          params.push(w, w.replace(/\s+/g, ''), `${w}s`, `%${w}%`);
          
          const numMatch = w.match(/\d+/);
          if (numMatch) {
            const num = numMatch[0];
            const isKg = w.toLowerCase().includes('kg');
            if (isKg) {
              wClause += ' OR pv.weight = ? OR pv.weight = ? OR pv.weight = ? OR pv.weight = ? OR pv.weight = ? OR pv.weight = ?';
              params.push(num, `${num}kg`, `${num} kg`, '1000', '1000 gm', '1000gm');
            } else {
              wClause += ' OR pv.weight = ? OR pv.weight = ? OR pv.weight = ? OR pv.weight = ?';
              params.push(num, `${num}gm`, `${num} gm`, `${num}g`);
            }
          }
          wClause += ' OR p.tags LIKE ?)';
          params.push(`%${w}%`);
          clauses.push(wClause);
        });
        query += ` AND (${clauses.join(' OR ')})`;
      }
    }

    if (attribute_values) {
      const valueIds = attribute_values.split(',').map(id => parseInt(id, 10)).filter(Boolean);
      if (valueIds.length > 0) {
        query += ` AND EXISTS (
          SELECT 1 FROM product_variants inner_pv 
          WHERE inner_pv.product_id = p.id AND inner_pv.status = 1 AND (
        `;
        const valueClauses = valueIds.map(() => `FIND_IN_SET(?, inner_pv.attribute_value_ids) > 0`);
        query += valueClauses.join(' OR ');
        query += ` ) )`;
        params.push(...valueIds);
      }
    }

    let orderBy = 'p.row_order ASC, p.id DESC';
    if (onOfferOnly && (sort === 'relevance' || !sort)) {
      orderBy = 'COALESCE(((pv.price - pv.special_price) / NULLIF(pv.price, 0)), 0) DESC';
    } else if (sort === 'price-low') {
      orderBy = 'COALESCE(NULLIF(pv.special_price, 0), pv.price) ASC';
    } else if (sort === 'price-high') {
      orderBy = 'COALESCE(NULLIF(pv.special_price, 0), pv.price) DESC';
    } else if (sort === 'name-az') {
      orderBy = 'p.name ASC';
    } else if (sort === 'newest') {
      orderBy = 'p.id DESC';
    }

    query += ` GROUP BY p.id ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const [products] = await pool.query(query, params);

    // Parse other_images JSON for each product
    products.forEach(p => {
      p.other_images = parseJsonField(p.other_images);
    });

    // Count query should respect the same filters
    const countCondition = isAdmin ? '1=1' : 'p.status = 1';
    let countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv 
        ON pv.product_id = p.id 
        AND pv.status = 1
      WHERE ${countCondition}
    `;
    const countParams = [];

    if (category_id) {
      if (categoryIds.length > 0) {
        countQuery += ` AND p.category_id IN (${categoryIds.map(() => '?').join(',')})`;
        countParams.push(...categoryIds);
      } else {
        countQuery += ' AND p.category_id = ?';
        countParams.push(category_id);
      }
    }

    if (search) {
      const words = search.trim().split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        const searchClauses = words.map(() => '(p.name LIKE ? OR p.short_description LIKE ? OR p.tags LIKE ?)');
        countQuery += ` AND (${searchClauses.join(' OR ')})`;
        words.forEach(word => {
          countParams.push(`%${word}%`, `%${word}%`, `%${word}%`);
        });
      }
    }

    if (brand) {
      const brandList = brand.split(',').map(b => b.trim()).filter(Boolean);
      if (brandList.length > 0) {
        countQuery += ` AND p.brand IN (${brandList.map(() => '?').join(',')})`;
        countParams.push(...brandList);
      }
    }

    if (onOfferOnly) {
      countQuery += ' AND pv.special_price IS NOT NULL AND pv.special_price > 0 AND pv.special_price < pv.price';
    }

    if (weight) {
      const weightList = weight.split(',').map(w => w.trim()).filter(Boolean);
      if (weightList.length > 0) {
        const clauses = [];
        weightList.forEach(w => {
          let wClause = '(pv.weight = ? OR pv.weight = ? OR pv.weight = ? OR pv.weight = ?';
          countParams.push(w, w.replace(/\s+/g, ''), `${w}s`, `%${w}%`);
          
          const numMatch = w.match(/\d+/);
          if (numMatch) {
            const num = numMatch[0];
            const isKg = w.toLowerCase().includes('kg');
            if (isKg) {
              wClause += ' OR pv.weight = ? OR pv.weight = ? OR pv.weight = ? OR pv.weight = ? OR pv.weight = ? OR pv.weight = ?';
              countParams.push(num, `${num}kg`, `${num} kg`, '1000', '1000 gm', '1000gm');
            } else {
              wClause += ' OR pv.weight = ? OR pv.weight = ? OR pv.weight = ? OR pv.weight = ?';
              countParams.push(num, `${num}gm`, `${num} gm`, `${num}g`);
            }
          }
          wClause += ' OR p.tags LIKE ?)';
          countParams.push(`%${w}%`);
          clauses.push(wClause);
        });
        countQuery += ` AND (${clauses.join(' OR ')})`;
      }
    }

    if (attribute_values) {
      const valueIds = attribute_values.split(',').map(id => parseInt(id, 10)).filter(Boolean);
      if (valueIds.length > 0) {
        countQuery += ` AND EXISTS (
          SELECT 1 FROM product_variants inner_pv 
          WHERE inner_pv.product_id = p.id AND inner_pv.status = 1 AND (
        `;
        const valueClauses = valueIds.map(() => `FIND_IN_SET(?, inner_pv.attribute_value_ids) > 0`);
        countQuery += valueClauses.join(' OR ');
        countQuery += ` ) )`;
        countParams.push(...valueIds);
      }
    }

    const [[{ total }]] = await pool.query(countQuery, countParams);

    // Dynamic active filters query to auto-generate filter sidebars
    const [filterRows] = await pool.query(`
      SELECT 
        a.id AS attribute_id,
        a.name AS attribute_name,
        av.id AS value_id,
        av.value AS value_name
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      JOIN attribute_values av ON FIND_IN_SET(av.id, pv.attribute_value_ids) > 0
      JOIN attributes a ON av.attribute_id = a.id
      WHERE p.status = 1 AND pv.status = 1 AND av.status = 1 AND a.status = 1
      GROUP BY a.id, av.id
      ORDER BY a.name ASC, av.value ASC
    `);

    const filterGroups = {};
    filterRows.forEach(row => {
      if (!filterGroups[row.attribute_name]) {
        filterGroups[row.attribute_name] = {
          id: row.attribute_id,
          name: row.attribute_name,
          values: []
        };
      }
      if (!filterGroups[row.attribute_name].values.some(v => v.id === row.value_id)) {
        filterGroups[row.attribute_name].values.push({
          id: row.value_id,
          name: row.value_name
        });
      }
    });
    const filters = Object.values(filterGroups);

    res.json({
      success: true,
      count: total,
      filters,
      products
    });
  } catch (err) {
    console.error('getAllProducts error:', err.message, err.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ─── CREATE PRODUCT ──────────────────────────────────────────────────────
// Used from admin AddProduct page
export const createProduct = [
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'other_images_files', maxCount: 10 }
  ]),
  async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const {
        name,
        category_id,
        identification = null,
        made_in = null,
        brand = null,
        tags = null,
        type = 'Physical Product',
        short_description = null,
        description = null,
        tax = null,
        is_prices_inclusive_tax = 0,
        indicator = '0',
        cod_allowed = 1,
        is_returnable = 0,
        is_cancelable = 0,
        minimum_order_quantity = 1,
        quantity_step_size = 1,
        total_allowed_quantity = null,
        warranty_period = null,
        guarantee_period = null,
        stock = 0,
        availability = 1,
        video_type = 'None',
        video = null,
        price,
        special_price,
        weight,
        asin = null
      } = req.body;

      if (!name?.trim() || !category_id) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'Name and category_id are required' });
      }

      // Map indicator string → tinyint (0=none, 1=veg, 2=non-veg)
      const indicatorMap = { 'None': 0, 'none': 0, '0': 0, 'Veg': 1, 'veg': 1, '1': 1, 'Non-Veg': 2, 'non-veg': 2, '2': 2 };
      const indicatorVal = indicatorMap[indicator] ?? 0;

      // ── Main image ────────────────────────────────────────────────────
      let finalImage = '';
      if (req.files?.image?.[0]) {
        finalImage = `/uploads/products/${req.files.image[0].filename}`;
      } else if (req.body.imagePath) {
        finalImage = req.body.imagePath;
      } else if (req.body.image) {
        finalImage = req.body.image;
      }

      // ── Other images ──────────────────────────────────────────────────
      let existingOtherImages = parseJsonField(req.body.existing_other_images);
      const newOtherFiles = (req.files?.other_images_files || []).map(
        f => `/uploads/products/${f.filename}`
      );
      const combinedOtherImages = [...existingOtherImages, ...newOtherFiles];

      // Generate unique slug
      let baseSlug = slugify(name.trim(), { lower: true, strict: true });
      const [existing] = await connection.query(
        'SELECT COUNT(*) as cnt FROM products WHERE slug LIKE ?', [`${baseSlug}%`]
      );
      const slug = existing[0].cnt > 0 ? `${baseSlug}-${Date.now()}` : baseSlug;

      const [result] = await connection.query(
        `INSERT INTO products (
          name, category_id, product_identity, made_in, brand, tags, type,
          short_description, description, tax, is_prices_inclusive_tax,
          indicator, cod_allowed, is_returnable, is_cancelable,
          minimum_order_quantity, quantity_step_size, total_allowed_quantity,
          warranty_period, guarantee_period, stock, availability,
          image, other_images, video_type, video, slug, status, date_added, row_order, asin
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), 0, ?)`,
        [
          name.trim(),
          Number(category_id),
          identification,
          made_in,
          brand,
          tags,
          type,
          short_description,
          description,
          tax,
          is_prices_inclusive_tax ? 1 : 0,
          indicatorVal,
          Number(cod_allowed),
          Number(is_returnable),
          Number(is_cancelable),
          Number(minimum_order_quantity) || 1,
          Number(quantity_step_size) || 1,
          total_allowed_quantity ? Number(total_allowed_quantity) : null,
          warranty_period || null,
          guarantee_period || null,
          Number(stock) || 0,
          Number(availability),
          finalImage,
          JSON.stringify(combinedOtherImages),
          video_type,
          video,
          slug,
          asin || null
        ]
      );

      const productId = result.insertId;

      // ── Cartesian or Default Variant Insertion ───────────────────────
      let reqVariants = [];
      if (req.body.variants) {
        try {
          reqVariants = typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants;
        } catch (e) {
          console.error('Failed to parse req.body.variants:', e);
          reqVariants = [];
        }
      }

      if (Array.isArray(reqVariants) && reqVariants.length > 0) {
        for (const v of reqVariants) {
          const vPrice = Number(v.price) || 0;
          const vSpecialPrice = v.special_price ? Number(v.special_price) : null;
          const vStock = Number(v.stock) || 0;
          const vSku = v.sku || null;
          const vWeight = v.weight || null;
          const vValueIds = v.attribute_value_ids || '';
          const vImage = v.image || null;
          const vOtherImages = v.other_images || null;

          await connection.query(
            `INSERT INTO product_variants (
              product_id, status, price, special_price, weight, stock, sku, attribute_value_ids, image, other_images, height, breadth, length, availability, date_added
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, NOW())`,
            [
              productId,
              1, // Active
              vPrice,
              vSpecialPrice,
              vWeight,
              vStock,
              vSku,
              vValueIds,
              vImage,
              vOtherImages ? (typeof vOtherImages === 'string' ? vOtherImages : JSON.stringify(vOtherImages)) : null,
              Number(availability)
            ]
          );
        }
      } else {
        // Create the default product variant using the provided pricing/weight
        const variantPrice = Number(price) || 0;
        const variantSpecialPrice = special_price ? Number(special_price) : null;
        const variantStock = Number(stock) || 0;

        await connection.query(
          `INSERT INTO product_variants (
            product_id, status, price, special_price, weight, stock, height, breadth, length, availability, date_added
          ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?, NOW())`,
          [
            productId,
            1,                    // Status = active
            variantPrice,
            variantSpecialPrice,
            weight || null,
            variantStock,
            Number(availability)
          ]
        );
      }

      await connection.commit();
      res.status(201).json({
        success: true,
        productId,
        message: 'Product created successfully'
      });
    } catch (err) {
      await connection.rollback();
      console.error('CREATE PRODUCT ERROR:', err.message, err.stack);
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to create product'
      });
    } finally {
      connection.release();
    }
  }
];

// ─── GET SINGLE PRODUCT ──────────────────────────────────────────────────
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const isNumeric = /^\d+$/.test(id);

    const [rows] = await pool.query(
      `SELECT 
         p.*,
         c.name AS category_name,
         pv.id AS default_variant_id,
         pv.price,
         pv.special_price,
         pv.stock AS variant_stock,
         pv.sku,
         pv.images AS variant_images,
         pv.weight AS weight
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN product_variants pv 
         ON pv.product_id = p.id 
         AND pv.status = 1
       WHERE ${isNumeric ? 'p.id = ?' : 'p.slug = ?'} AND p.status = 1
       LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const product = rows[0];

    // ── Parse other_images: stored as JSON string in DB ─────────────────
    // e.g. "[]" or "[\"uploads/products/img1.jpg\",\"uploads/products/img2.jpg\"]"
    product.other_images = parseJsonField(product.other_images);

    res.json({ success: true, product });
  } catch (err) {
    console.error('getProductById error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── UPDATE PRODUCT ──────────────────────────────────────────────────────
// Handles: main image (upload or media path), other_images (JSON array), all fields
export const updateProduct = [
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'other_images_files', maxCount: 10 }
  ]),
  async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { id } = req.params;
      const {
        name,
        category_id,
        identification,
        made_in,
        brand,
        tags,
        type,
        short_description,
        description,
        tax,
        is_prices_inclusive_tax,
        indicator,
        cod_allowed,
        is_returnable,
        is_cancelable,
        minimum_order_quantity,
        quantity_step_size,
        total_allowed_quantity,
        warranty_period,
        guarantee_period,
        stock,
        availability,
        video_type,
        video,
        price,
        special_price,
        weight,
        sku,
        asin
      } = req.body;

      if (!name?.trim() || !category_id) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'Name and category_id are required' });
      }

      const slug = slugify(name, { lower: true, strict: true });

      // ── Main image ──────────────────────────────────────────────────────
      let finalImage = null;
      if (req.files?.image?.[0]) {
        finalImage = `/uploads/products/${req.files.image[0].filename}`;
      } else if (req.body.imagePath) {
        finalImage = req.body.imagePath;
      } else if (req.body.image) {
        finalImage = req.body.image;
      }

      // ── Other images ────────────────────────────────────────────────────
      // Existing paths sent from frontend as JSON string or comma list
      let existingOtherImages = parseJsonField(req.body.existing_other_images);

      // Newly uploaded other image files
      const newOtherFiles = (req.files?.other_images_files || []).map(
        f => `/uploads/products/${f.filename}`
      );

      // Media-library paths sent as JSON array string
      const mediaOtherImages = parseJsonField(req.body.media_other_images);

      const allOtherImages = [...existingOtherImages, ...newOtherFiles, ...mediaOtherImages];
      const otherImagesJson = JSON.stringify(allOtherImages);

      // ── Boolean mappings ────────────────────────────────────────────────
      const inclusiveTax = ['true', true, '1', 1].includes(is_prices_inclusive_tax) ? 1 : 0;
      const indicatorVal = indicator === 'Veg' ? 1 : (indicator === 'Non-Veg' ? 2 : 0);
      const codVal = ['true', true, '1', 1].includes(cod_allowed) ? 1 : 0;
      const returnableVal = ['true', true, '1', 1].includes(is_returnable) ? 1 : 0;
      const cancelableVal = ['true', true, '1', 1].includes(is_cancelable) ? 1 : 0;

      // ── Update products table ───────────────────────────────────────────
      await connection.query(
        `UPDATE products SET 
          name = ?, category_id = ?, product_identity = ?, made_in = ?, brand = ?, tags = ?, type = ?,
          short_description = ?, description = ?, tax = ?, is_prices_inclusive_tax = ?,
          indicator = ?, cod_allowed = ?, is_returnable = ?, is_cancelable = ?,
          minimum_order_quantity = ?, quantity_step_size = ?, total_allowed_quantity = ?,
          warranty_period = ?, guarantee_period = ?, stock = ?, availability = ?,
          video_type = ?, video = ?, slug = ?, other_images = ?, asin = ?` +
          (finalImage !== null ? `, image = ?` : '') +
         ` WHERE id = ?`,
        [
          name.trim(),
          category_id,
          identification || null,
          made_in || null,
          brand || null,
          tags?.trim() || null,
          type || 'Physical Product',
          short_description?.trim() || null,
          description?.trim() || null,
          tax || null,
          inclusiveTax,
          indicatorVal,
          codVal,
          returnableVal,
          cancelableVal,
          parseInt(minimum_order_quantity, 10) || 1,
          parseInt(quantity_step_size, 10) || 1,
          parseInt(total_allowed_quantity, 10) || null,
          warranty_period || null,
          guarantee_period || null,
          parseInt(stock, 10) || 0,
          parseInt(availability, 10) || 1,
          video_type || 'None',
          video || null,
          slug,
          otherImagesJson,
          asin || null,
          ...(finalImage !== null ? [finalImage] : []),
          id
        ]
      );

      let reqVariants = [];
      if (req.body.variants) {
        try {
          reqVariants = typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants;
        } catch (e) {
          console.error('Failed to parse req.body.variants:', e);
          reqVariants = [];
        }
      }

      if (Array.isArray(reqVariants) && reqVariants.length > 0) {
        const activeIds = [];
        for (const v of reqVariants) {
          const vPrice = Number(v.price) || 0;
          const vSpecialPrice = v.special_price ? Number(v.special_price) : null;
          const vStock = Number(v.stock) || 0;
          const vSku = v.sku || null;
          const vWeight = v.weight || null;
          const vValueIds = v.attribute_value_ids || '';
          const vImage = v.image || null;
          const vOtherImages = v.other_images || null;

          if (v.id) {
            // Update existing variant
            await connection.query(
              `UPDATE product_variants SET 
                price = ?, special_price = ?, stock = ?, weight = ?, sku = ?, attribute_value_ids = ?, image = ?, other_images = ?, availability = ?, status = 1
               WHERE id = ? AND product_id = ?`,
              [
                vPrice,
                vSpecialPrice,
                vStock,
                vWeight,
                vSku,
                vValueIds,
                vImage,
                vOtherImages ? (typeof vOtherImages === 'string' ? vOtherImages : JSON.stringify(vOtherImages)) : null,
                parseInt(availability, 10) || 1,
                v.id,
                id
              ]
            );
            activeIds.push(v.id);
          } else {
            // Insert new variant
            const [insResult] = await connection.query(
              `INSERT INTO product_variants 
                (product_id, price, special_price, stock, weight, sku, attribute_value_ids, image, other_images, height, breadth, length, availability, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, 1)`,
              [
                id,
                vPrice,
                vSpecialPrice,
                vStock,
                vWeight,
                vSku,
                vValueIds,
                vImage,
                vOtherImages ? (typeof vOtherImages === 'string' ? vOtherImages : JSON.stringify(vOtherImages)) : null,
                parseInt(availability, 10) || 1
              ]
            );
            activeIds.push(insResult.insertId);
          }
        }

        // Deactivate variants not present in the new set
        if (activeIds.length > 0) {
          await connection.query(
            'UPDATE product_variants SET status = 0 WHERE product_id = ? AND id NOT IN (?)',
            [id, activeIds]
          );
        } else {
          await connection.query(
            'UPDATE product_variants SET status = 0 WHERE product_id = ?',
            [id]
          );
        }
      } else {
        // ── Update default variant (price/stock/weight) ─────────────────────
        const numPrice = parseFloat(price) || 0;
        const numSpecialPrice = parseFloat(special_price) || numPrice;
        const numStock = parseInt(stock, 10) || 0;

        const [existingVariants] = await connection.query(
          'SELECT id FROM product_variants WHERE product_id = ? AND status = 1 LIMIT 1',
          [id]
        );

        if (existingVariants.length > 0) {
          await connection.query(
            `UPDATE product_variants SET 
              price = ?, special_price = ?, stock = ?, weight = ?, sku = ?, availability = ?
             WHERE id = ?`,
            [
              numPrice,
              numSpecialPrice,
              numStock,
              weight || null,
              sku || null,
              parseInt(availability, 10) || 1,
              existingVariants[0].id
            ]
          );
        } else {
          await connection.query(
            `INSERT INTO product_variants 
              (product_id, price, special_price, stock, weight, sku, height, breadth, length, availability, status)
             VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?, 1)`,
            [id, numPrice, numSpecialPrice, numStock, weight || null, sku || null, parseInt(availability, 10) || 1]
          );
        }
      }

      await connection.commit();
      res.json({ success: true, message: 'Product updated successfully' });
    } catch (err) {
      await connection.rollback();
      console.error('updateProduct error:', err);
      res.status(500).json({ success: false, message: 'Server error updating product' });
    } finally {
      connection.release();
    }
  }
];

// ─── HARD DELETE PRODUCT ─────────────────────────────────────────────────
export const deleteProduct = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    await connection.beginTransaction();
    // Remove variants first (foreign key safety)
    await connection.query('DELETE FROM product_variants WHERE product_id = ?', [id]);
    // Remove the product itself
    await connection.query('DELETE FROM products WHERE id = ?', [id]);

    // Reset auto-increment to automatically realign to MAX(id)+1
    await connection.query('ALTER TABLE products AUTO_INCREMENT = 1;');
    await connection.query('ALTER TABLE product_variants AUTO_INCREMENT = 1;');

    await connection.commit();
    res.json({ success: true, message: 'Product permanently deleted' });
  } catch (err) {
    await connection.rollback();
    console.error('deleteProduct error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    connection.release();
  }
};

// ─── TOGGLE PRODUCT STATUS ───────────────────────────────────────────────
export const toggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.query('UPDATE products SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, message: 'Product status updated successfully' });
  } catch (err) {
    console.error('toggleProductStatus error:', err);
    res.status(500).json({ success: false, message: 'Server error updating status' });
  }
};

// ─── BULK PRODUCT CSV TEMPLATE DOWNLOAD ─────────────────────────────────
export const downloadBulkProductSampleAdmin = async (req, res) => {
  const type = String(req.query.type || 'upload').toLowerCase();

  if (type === 'update') {
    const csv = [
      'id,name,category_id,brand,tags,type,short_description,description,tax,stock,image,status',
      '101,Updated Product Name,2,Acme,festive,new,Physical Product,Updated short description,Updated full description,5,20,/uploads/products/sample.jpg,1'
    ].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="bulk-update-sample.csv"');
    return res.status(200).send(csv);
  }

  const csv = [
    'name,category_id,brand,tags,type,short_description,description,tax,stock,image,status',
    'Sample Product,1,Acme,festive,new,Physical Product,Short description here,Long description here,5,50,/uploads/products/sample.jpg,1'
  ].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="bulk-upload-sample.csv"');
  return res.status(200).send(csv);
};

// ─── BULK PRODUCT INSTRUCTIONS DOWNLOAD ────────────────────────────────
export const downloadBulkProductInstructionsAdmin = async (req, res) => {
  const type = String(req.query.type || 'upload').toLowerCase();
  const lines = [
    'Bulk Product CSV Instructions',
    '',
    `Mode: ${type === 'update' ? 'Update existing products' : 'Upload new products'}`,
    '',
    'CSV Rules:',
    '- File must be UTF-8 CSV format',
    '- Header row is mandatory',
    '- Use comma delimiter',
    '- Wrap fields in double quotes if they contain commas',
    '- status: 1 = active, 0 = inactive',
    '',
    'Columns for Upload:',
    '- name (required)',
    '- category_id (required)',
    '- brand,tags,type,short_description,description,tax,stock,image,status (optional)',
    '',
    'Columns for Update:',
    '- id (required)',
    '- Any other column may be included to update that field',
    '',
    'Tip: image should be a valid existing media path (e.g. /uploads/products/file.jpg)'
  ];

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="bulk-${type === 'update' ? 'update' : 'upload'}-instructions.txt"`
  );
  return res.status(200).send(lines.join('\n'));
};

// ─── BULK PRODUCT DATA EXPORT ───────────────────────────────────────────
export const downloadBulkProductDataAdmin = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, category_id, brand, tags, type, short_description, description, tax, stock, image, status
       FROM products
       ORDER BY id DESC
       LIMIT 5000`
    );

    const header = 'id,name,category_id,brand,tags,type,short_description,description,tax,stock,image,status';
    const csvRows = rows.map((row) => {
      const toCell = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
      return [
        row.id,
        toCell(row.name),
        row.category_id,
        toCell(row.brand),
        toCell(row.tags),
        toCell(row.type),
        toCell(row.short_description),
        toCell(row.description),
        row.tax ?? '',
        row.stock ?? 0,
        toCell(row.image),
        row.status ?? 1
      ].join(',');
    });

    const csv = [header, ...csvRows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="products-data.csv"');
    return res.status(200).send(csv);
  } catch (err) {
    console.error('downloadBulkProductDataAdmin error:', err);
    return res.status(500).json({ success: false, message: 'Failed to export product data' });
  }
};

// ─── BULK PRODUCT CSV UPLOAD / UPDATE ──────────────────────────────────
export const bulkUploadProductsAdmin = async (req, res) => {
  const type = String(req.body.type || 'upload').toLowerCase();
  if (!['upload', 'update'].includes(type)) {
    return res.status(400).json({ success: false, message: 'type must be upload or update' });
  }

  if (!req.file?.buffer) {
    return res.status(400).json({ success: false, message: 'CSV file is required' });
  }

  const csvText = req.file.buffer.toString('utf-8');
  const { headers, rows } = parseCsv(csvText);
  if (!headers.length || !rows.length) {
    return res.status(400).json({ success: false, message: 'CSV is empty or invalid' });
  }

  const connection = await pool.getConnection();
  const errors = [];
  let created = 0;
  let updated = 0;

  try {
    await connection.beginTransaction();

    for (let idx = 0; idx < rows.length; idx += 1) {
      const row = rows[idx];
      const rowNumber = idx + 2;

      if (type === 'upload') {
        const name = row.name?.trim();
        const categoryId = intOrDefault(row.category_id, NaN);

        if (!name || !Number.isFinite(categoryId)) {
          errors.push(`Row ${rowNumber}: name and category_id are required`);
          continue;
        }

        const slugBase = slugify(name, { lower: true, strict: true }) || `product-${Date.now()}`;
        const slug = `${slugBase}-${Date.now()}-${idx}`;

        await connection.query(
          `INSERT INTO products (
            name, category_id, brand, tags, type, short_description, description,
            tax, stock, image, slug, status, date_added, row_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0)`,
          [
            name,
            categoryId,
            row.brand || null,
            row.tags || null,
            row.type || 'Physical Product',
            row.short_description || null,
            row.description || null,
            row.tax ? Number(row.tax) : null,
            intOrDefault(row.stock, 0),
            row.image || null,
            slug,
            intOrDefault(row.status, 1) ? 1 : 0
          ]
        );
        created += 1;
        continue;
      }

      const id = intOrDefault(row.id, NaN);
      if (!Number.isFinite(id)) {
        errors.push(`Row ${rowNumber}: id is required for update`);
        continue;
      }

      const fields = [];
      const values = [];
      const pushField = (field, value) => {
        fields.push(`${field} = ?`);
        values.push(value);
      };

      if (row.name) {
        const cleanName = row.name.trim();
        pushField('name', cleanName);
        pushField('slug', slugify(cleanName, { lower: true, strict: true }) || `product-${id}`);
      }
      if (row.category_id) pushField('category_id', intOrDefault(row.category_id, 0));
      if (Object.prototype.hasOwnProperty.call(row, 'brand')) pushField('brand', row.brand || null);
      if (Object.prototype.hasOwnProperty.call(row, 'tags')) pushField('tags', row.tags || null);
      if (row.type) pushField('type', row.type);
      if (Object.prototype.hasOwnProperty.call(row, 'short_description')) pushField('short_description', row.short_description || null);
      if (Object.prototype.hasOwnProperty.call(row, 'description')) pushField('description', row.description || null);
      if (row.tax) pushField('tax', Number(row.tax));
      if (row.stock) pushField('stock', intOrDefault(row.stock, 0));
      if (Object.prototype.hasOwnProperty.call(row, 'image')) pushField('image', row.image || null);
      if (Object.prototype.hasOwnProperty.call(row, 'status')) pushField('status', intOrDefault(row.status, 1) ? 1 : 0);

      if (!fields.length) {
        errors.push(`Row ${rowNumber}: no update columns provided`);
        continue;
      }

      values.push(id);
      const [result] = await connection.query(
        `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      if (!result.affectedRows) {
        errors.push(`Row ${rowNumber}: product id ${id} not found`);
        continue;
      }

      updated += 1;
    }

    await connection.commit();
    return res.json({
      success: true,
      message: 'Bulk operation completed',
      type,
      totalRows: rows.length,
      created,
      updated,
      failed: errors.length,
      errors
    });
  } catch (err) {
    await connection.rollback();
    console.error('bulkUploadProductsAdmin error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process bulk upload' });
  } finally {
    connection.release();
  }
};

// ─── GET PRODUCT SEARCH SUGGESTIONS ──────────────────────────────────────
export const getProductSearchSuggestions = async (req, res) => {
  try {
    const { q, limit = 8 } = req.query;
    if (!q || !q.trim()) {
      return res.json({ success: true, products: [], categories: [] });
    }

    const words = q.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      return res.json({ success: true, products: [], categories: [] });
    }

    // 1. Fetch matching products (only status = 1)
    const productClauses = words.map(() => '(p.name LIKE ? OR p.short_description LIKE ? OR p.tags LIKE ?)');
    const productParams = [];
    words.forEach(word => {
      productParams.push(`%${word}%`, `%${word}%`, `%${word}%`);
    });
    productParams.push(Number(limit));

    const [products] = await pool.query(
      `SELECT 
        p.id,
        p.name,
        p.image,
        p.slug,
        p.brand,
        p.status,
        pv.id AS default_variant_id,
        pv.price,
        pv.special_price
       FROM products p
       LEFT JOIN product_variants pv 
         ON pv.product_id = p.id 
         AND pv.status = 1
       WHERE p.status = 1 AND (${productClauses.join(' OR ')})
       GROUP BY p.id
       LIMIT ?`,
      productParams
    );

    // 2. Fetch matching categories (only status = 1)
    const categoryClauses = words.map(() => 'name LIKE ?');
    const categoryParams = [];
    words.forEach(word => {
      categoryParams.push(`%${word}%`);
    });
    categoryParams.push(Number(limit));

    const [categories] = await pool.query(
      `SELECT id, name, status 
       FROM categories 
       WHERE status = 1 AND (${categoryClauses.join(' OR ')})
       LIMIT ?`,
      categoryParams
    );

    res.json({
      success: true,
      products,
      categories
    });
  } catch (err) {
    console.error('getProductSearchSuggestions error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch suggestions' });
  }
};
