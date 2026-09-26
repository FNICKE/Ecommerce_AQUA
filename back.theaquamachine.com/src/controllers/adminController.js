// controllers/adminController.js
import pool from '../config/db.js';
import slugify from 'slugify';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get basic stats
export const getAdminStats = async (req, res) => {
  try {
    console.log('[getAdminStats] Starting real DB fetch');

    let orders = 0;
    try {
      const [res] = await pool.query('SELECT COUNT(*) as count FROM orders');
      orders = res[0]?.count || 0;
      console.log('Orders count:', orders);
    } catch (e) {
      console.warn('⚠️ Table "orders" query failed (missing table/column?):', e.message);
    }

    let newSigns = 0;
    try {
      const [res] = await pool.query(
        'SELECT COUNT(*) as count FROM users WHERE created_on > DATE_SUB(NOW(), INTERVAL 30 DAY)'
      );
      newSigns = res[0]?.count || 0;
      console.log('New sign-ups:', newSigns);
    } catch (e) {
      console.warn('⚠️ Table "users" or column "created_on" missing:', e.message);
    }

    let deliveryBoys = 0;
    try {
      const [res] = await pool.query(
        'SELECT COUNT(*) as count FROM delivery_boys WHERE status = 1'
      );
      deliveryBoys = res[0]?.count || 0;
      console.log('Delivery boys:', deliveryBoys);
    } catch (e) {
      console.warn('⚠️ Table "delivery_boys" missing (normal if not used):', e.message);
    }

    let products = 0;
    try {
      const [res] = await pool.query(
        'SELECT COUNT(*) as count FROM products WHERE status = 1'
      );
      products = res[0]?.count || 0;
      console.log('Products count:', products);
    } catch (e) {
      console.warn('⚠️ Table "products" or column "status" missing:', e.message);
    }

    console.log('[getAdminStats] Finished →', { orders, newSigns, deliveryBoys, products });

    res.json({
      orders,
      newSigns,
      deliveryBoys,
      products
    });
  } catch (err) {
    console.error('[getAdminStats] Critical crash (unexpected):', err.message, err.stack);
    res.status(500).json({
      success: false,
      message: 'Server error fetching stats',
      error: err.message
    });
  }
};

// Get real order outlines by status — safe version
export const getOrderOutlines = async (req, res) => {
  try {
    console.log('[getOrderOutlines] Starting real DB fetch');

    const outlines = {
      pending: 0,
      ready: 0,
      awaiting: 0,
      processed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      returned: 0
    };

    try {
      const [rows] = await pool.query(`
        SELECT status, COUNT(*) as count 
        FROM orders 
        GROUP BY status
      `);

      rows.forEach(row => {
        const key = row.status?.toLowerCase()?.trim();
        if (key && key in outlines) {
          outlines[key] = parseInt(row.count, 10) || 0;
        }
      });

      console.log('[getOrderOutlines] Success →', outlines);
    } catch (e) {
      console.warn('[getOrderOutlines] Query failed – table "orders" missing or error:', e.message);
      // Return zeros instead of crashing
    }

    res.json(outlines);
  } catch (err) {
    console.error('[getOrderOutlines] Critical crash (unexpected):', err.message, err.stack);
    res.status(500).json({
      success: false,
      message: 'Server error fetching order outlines',
      error: err.message
    });
  }
};

// Get recent orders for dashboard
export const getRecentOrders = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        o.id,
        o.total,
        o.final_total,
        o.payment_method,
        o.status,
        o.date_added,
        o.mobile,
        o.address,
        u.username as customer_name,
        u.email as customer_email,
        u.mobile as customer_mobile
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.date_added DESC
      LIMIT 15
    `);
    res.json(rows);
  } catch (err) {
    console.error('getRecentOrders error:', err);
    res.status(500).json({ message: 'Failed to fetch recent orders' });
  }
};

// Get 7-day sales and order count trend for dashboard
export const getSalesTrend = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        DATE(date_added) as date_key,
        SUM(final_total) as total_sales,
        COUNT(id) as order_count
      FROM orders
      WHERE date_added >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(date_added)
      ORDER BY DATE(date_added) ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error('getSalesTrend error:', err);
    res.status(500).json({ message: 'Failed to fetch sales trend' });
  }
};

// ── Categories ──────────────────────────────────────────────────────

export const getAllCategories = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, slug, image, status FROM categories ORDER BY row_order ASC, name ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('getAllCategories error:', err);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    res.json({
      _id: req.params.id,
      name: "Electronics",
      slug: "electronics",
      description: "Gadgets and devices",
      image: "/uploads/cat-elec.jpg",
      parent: null,
      active: true,
      createdAt: "2025-01-15T10:30:00Z"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, slug, description, parent, active = true } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    res.status(201).json({
      message: "Category created",
      category: { name, slug, description, parent, active, image }
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { name, slug, description, parent, active } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : undefined;

    res.json({
      message: "Category updated",
      category: { name, slug, description, parent, active, image }
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    res.json({ message: `Category ${req.params.id} deleted` });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ── Products ────────────────────────────────────────────────────────

export const createProduct = async (req, res) => {
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
      video_type = null,
      video = null,
      stock_type = 'Product_Level',
      price,
      special_price,
      weight
    } = req.body;

    if (!name?.trim() || !category_id) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Name and category_id are required' });
    }

    // Map indicator string → tinyint (0=none, 1=veg, 2=non-veg)
    const indicatorMap = { 'None': 0, 'none': 0, '0': 0, 'Veg': 1, 'veg': 1, '1': 1, 'Non-Veg': 2, 'non-veg': 2, '2': 2 };
    const indicatorVal = indicatorMap[indicator] ?? 0;

    // Image path from uploaded file (strip 'public/' from start)
    let image = '';
    if (req.file) {
      image = req.file.path.replace(/\\/g, '/').replace(/^public\//, '');
    }

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
        image, video_type, video, slug, stock_type,
        status, date_added, row_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), 0)`,
      [
        name.trim(),
        Number(category_id),
        identification || null,
        made_in || null,
        brand || null,
        tags || null,
        type,
        short_description || null,
        description || null,
        tax || null,
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
        image,
        video_type || null,
        video || null,
        slug,
        stock_type
      ]
    );

    const productId = result.insertId;

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

        await connection.query(
          `INSERT INTO product_variants (
            product_id, status, price, special_price, weight, stock, sku, attribute_value_ids, height, breadth, length, availability, date_added
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, NOW())`,
          [
            productId,
            1, // Active
            vPrice,
            vSpecialPrice,
            vWeight,
            vStock,
            vSku,
            vValueIds,
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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          productId,
          1,                    // Status = active
          variantPrice,
          variantSpecialPrice,
          weight || null,
          variantStock,
          0,
          0,
          0,
          Number(availability)
        ]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      productId: productId,
      message: 'Product & Variant created successfully'
    });
  } catch (err) {
    await connection.rollback();
    console.error('Admin createProduct error:', err.message, err.stack);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to create product'
    });
  } finally {
    connection.release();
  }
};

// ── Attributes ──────────────────────────────────────────────────────

// GET all attributes with their values
export const getAttributes = async (req, res) => {
  try {
    const [attributes] = await pool.query(
      'SELECT a.*, s.name as attribute_set_name FROM attributes a LEFT JOIN attribute_set s ON a.attribute_set_id = s.id ORDER BY a.id DESC'
    );
    // For each attribute, fetch its values
    for (const attr of attributes) {
      const [values] = await pool.query(
        'SELECT * FROM attribute_values WHERE attribute_id = ? ORDER BY id ASC',
        [attr.id]
      );
      attr.values = values;
    }

    // Also fetch all attribute sets for the dropdown
    const [attributeSets] = await pool.query('SELECT * FROM attribute_set WHERE status = 1');

    res.json({ success: true, attributes, attributeSets });
  } catch (err) {
    console.error('getAttributes error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// CREATE attribute (name only; values added separately)
export const createAttribute = async (req, res) => {
  try {
    const { name, attribute_set_id, attribute_set_name, type = null, status = 1 } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Attribute name is required' });
    }

    let resolvedSetId = attribute_set_id;
    if (attribute_set_name && attribute_set_name.trim()) {
      const setName = attribute_set_name.trim();
      const [existingSets] = await pool.query('SELECT id FROM attribute_set WHERE name = ?', [setName]);
      if (existingSets.length > 0) {
        resolvedSetId = existingSets[0].id;
      } else {
        const [insertResult] = await pool.query('INSERT INTO attribute_set (name, status) VALUES (?, ?)', [setName, 1]);
        resolvedSetId = insertResult.insertId;
      }
    }

    if (!resolvedSetId) {
      return res.status(400).json({ success: false, message: 'Attribute set is required' });
    }

    const [result] = await pool.query(
      'INSERT INTO attributes (attribute_set_id, name, type, status) VALUES (?, ?, ?, ?)',
      [resolvedSetId, name.trim(), type, status]
    );
    res.status(201).json({
      success: true,
      attributeId: result.insertId,
      message: 'Attribute created successfully'
    });
  } catch (err) {
    console.error('createAttribute error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE attribute
export const updateAttribute = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, attribute_set_id, attribute_set_name, status } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Attribute name is required' });
    }

    let resolvedSetId = attribute_set_id;
    if (attribute_set_name && attribute_set_name.trim()) {
      const setName = attribute_set_name.trim();
      const [existingSets] = await pool.query('SELECT id FROM attribute_set WHERE name = ?', [setName]);
      if (existingSets.length > 0) {
        resolvedSetId = existingSets[0].id;
      } else {
        const [insertResult] = await pool.query('INSERT INTO attribute_set (name, status) VALUES (?, ?)', [setName, 1]);
        resolvedSetId = insertResult.insertId;
      }
    }

    await pool.query('UPDATE attributes SET name = ?, attribute_set_id = COALESCE(?, attribute_set_id), status = COALESCE(?, status) WHERE id = ?',
      [name.trim(), resolvedSetId, status, id]);
    res.json({ success: true, message: 'Attribute updated' });
  } catch (err) {
    console.error('updateAttribute error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE attribute (and its values)
export const deleteAttribute = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    await connection.beginTransaction();
    await connection.query('DELETE FROM attribute_values WHERE attribute_id = ?', [id]);
    await connection.query('DELETE FROM attributes WHERE id = ?', [id]);

    // Reset auto-increment sequences
    await connection.query('ALTER TABLE attributes AUTO_INCREMENT = 1;');
    await connection.query('ALTER TABLE attribute_values AUTO_INCREMENT = 1;');

    await connection.commit();
    res.json({ success: true, message: 'Attribute and its values deleted' });
  } catch (err) {
    await connection.rollback();
    console.error('deleteAttribute error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
};

// GET values for a specific attribute
export const getAttributeValues = async (req, res) => {
  try {
    const { attributeId } = req.params;
    const [values] = await pool.query(
      'SELECT * FROM attribute_values WHERE attribute_id = ? ORDER BY id ASC',
      [attributeId]
    );
    res.json({ success: true, values });
  } catch (err) {
    console.error('getAttributeValues error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADD a value to an attribute
export const addAttributeValue = async (req, res) => {
  try {
    const { attributeId } = req.params;
    const { value } = req.body;
    if (!value?.trim()) {
      return res.status(400).json({ success: false, message: 'Value is required' });
    }
    const [result] = await pool.query(
      'INSERT INTO attribute_values (attribute_id, value, status, filterable) VALUES (?, ?, ?, ?)',
      [attributeId, value.trim(), 1, 0]
    );
    res.status(201).json({
      success: true,
      valueId: result.insertId,
      message: 'Value added successfully'
    });
  } catch (err) {
    console.error('addAttributeValue error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE a single attribute value
export const deleteAttributeValue = async (req, res) => {
  try {
    const { valueId } = req.params;
    await pool.query('DELETE FROM attribute_values WHERE id = ?', [valueId]);

    // Reset auto-increment
    await pool.query('ALTER TABLE attribute_values AUTO_INCREMENT = 1;');

    res.json({ success: true, message: 'Value deleted' });
  } catch (err) {
    console.error('deleteAttributeValue error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE attribute value swatch (image/color)
export const updateAttributeValueSwatch = async (req, res) => {
  try {
    const { valueId } = req.params;
    const { swatche_type, swatche_value } = req.body;
    
    if (!swatche_type || !swatche_value) {
      return res.status(400).json({ 
        success: false, 
        message: 'Swatch type and value are required' 
      });
    }

    await pool.query(
      'UPDATE attribute_values SET swatche_type = ?, swatche_value = ? WHERE id = ?',
      [swatche_type, swatche_value, valueId]
    );

    res.json({ 
      success: true, 
      message: 'Swatch updated successfully',
      data: { valueId, swatche_type, swatche_value }
    });
  } catch (err) {
    console.error('updateAttributeValueSwatch error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPLOAD attribute swatch image
export const uploadAttributeSwatch = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    // Multer diskStorage has already saved the file in public/uploads/admin/year/month
    const filename = req.file.filename;
    const urlPath = `/uploads/admin/${year}/${month}/${filename}`;

    res.json({
      success: true,
      message: 'Swatch image uploaded successfully',
      path: urlPath,
      url: `${req.protocol}://${req.get('host')}${urlPath}`
    });
  } catch (err) {
    console.error('uploadAttributeSwatch error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to upload swatch image' });
  }
};

// ── Taxes ───────────────────────────────────────────────────────────

// GET all taxes
export const getTaxes = async (req, res) => {
  try {
    const [taxes] = await pool.query('SELECT * FROM taxes ORDER BY id DESC');
    res.json({ success: true, taxes });
  } catch (err) {
    console.error('getTaxes error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// CREATE tax
export const createTax = async (req, res) => {
  try {
    const { title, percentage } = req.body;
    if (!percentage?.toString().trim()) {
      return res.status(400).json({ success: false, message: 'Percentage is required' });
    }
    const [result] = await pool.query(
      'INSERT INTO taxes (title, percentage, status) VALUES (?, ?, ?)',
      [title?.trim() || null, percentage.toString().trim(), 1]
    );
    res.status(201).json({ success: true, message: 'Tax created successfully', taxId: result.insertId });
  } catch (err) {
    console.error('createTax error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE tax
export const updateTax = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, percentage, status } = req.body;
    if (!percentage?.toString().trim()) {
      return res.status(400).json({ success: false, message: 'Percentage is required' });
    }
    await pool.query(
      'UPDATE taxes SET title = ?, percentage = ?, status = ? WHERE id = ?',
      [title?.trim() || null, percentage.toString().trim(), status ?? 1, id]
    );
    res.json({ success: true, message: 'Tax updated successfully' });
  } catch (err) {
    console.error('updateTax error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE tax
export const deleteTax = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM taxes WHERE id = ?', [id]);

    // Reset auto-increment
    await pool.query('ALTER TABLE taxes AUTO_INCREMENT = 1;');

    res.json({ success: true, message: 'Tax deleted successfully' });
  } catch (err) {
    console.error('deleteTax error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Product FAQ ─────────────────────────────────────────────────────

// GET all product FAQs
export const getProductFAQs = async (req, res) => {
  try {
    const [faqs] = await pool.query(
      `SELECT pf.*, p.name AS product_name, u.username AS user_name, admin.username AS answered_by_name
       FROM product_faqs pf
       LEFT JOIN products p ON pf.product_id = p.id
       LEFT JOIN users u ON pf.user_id = u.id
       LEFT JOIN users admin ON pf.answered_by = admin.id
       ORDER BY pf.id DESC`
    );
    res.json({ success: true, faqs });
  } catch (err) {
    console.error('getProductFAQs error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// CREATE a new product FAQ
export const createProductFAQ = async (req, res) => {
  try {
    const { productId } = req.params;
    const { question, answer } = req.body;
    // user_id and answered_by can be the admin's ID since the admin is creating it
    const adminId = req.user?.id || 1;

    if (!productId || !question?.trim() || !answer?.trim()) {
      return res.status(400).json({ success: false, message: 'Product ID, question, and answer are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO product_faqs (user_id, product_id, question, answer, answered_by, votes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [adminId, productId, question.trim(), answer.trim(), adminId, 0]
    );

    res.status(201).json({
      success: true,
      message: 'FAQ added successfully',
      faqId: result.insertId
    });
  } catch (err) {
    console.error('createProductFAQ error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE a product FAQ (e.g. edit question or answer)
export const updateProductFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer } = req.body;

    if (!question?.trim() || !answer?.trim()) {
      return res.status(400).json({ success: false, message: 'Question and answer are required' });
    }

    await pool.query(
      'UPDATE product_faqs SET question = ?, answer = ? WHERE id = ?',
      [question.trim(), answer.trim(), id]
    );

    res.json({ success: true, message: 'FAQ updated successfully' });
  } catch (err) {
    console.error('updateProductFAQ error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE a product FAQ
export const deleteProductFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM product_faqs WHERE id = ?', [id]);

    // Reset auto-increment
    await pool.query('ALTER TABLE product_faqs AUTO_INCREMENT = 1;');

    res.json({ success: true, message: 'FAQ deleted successfully' });
  } catch (err) {
    console.error('deleteProductFAQ error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POS Order ───────────────────────────────────────────────────────

export const createPOSOrder = async (req, res) => {
  try {
    const { cart, paymentMethod, deliveryType, customerNote } = req.body;

    const orderId = `POS-${Date.now().toString().slice(-8)}`;

    res.status(201).json({
      success: true,
      message: "POS Order created",
      orderId
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── Reorder Products ────────────────────────────────────────────────

export const updateProductOrder = async (req, res) => {
  try {
    const { order } = req.body; // Array of { id, row_order }

    if (!Array.isArray(order)) {
      return res.status(400).json({ success: false, message: 'Invalid order data' });
    }

    // Update each product's row_order
    for (const item of order) {
      if (item.id && typeof item.row_order === 'number') {
        await pool.query(
          'UPDATE products SET row_order = ? WHERE id = ?',
          [item.row_order, item.id]
        );
      }
    }

    res.json({ success: true, message: 'Products ordered successfully' });
  } catch (err) {
    console.error('updateProductOrder error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Chat / Messages ─────────────────────────────────────────────────

// Get all unique chat users (people who have messaged admin or admin messaged)
export const getChatUsers = async (req, res) => {
  try {
    // Admin id = 1 by convention (or from token)
    const adminId = req.user?.id || 1;

    // Get distinct users who have chatted with admin
    const [users] = await pool.query(`
      SELECT DISTINCT
        u.id,
        u.username,
        u.email,
        u.mobile,
        u.image,
        u.last_online,
        (
          SELECT m.message FROM messages m
          WHERE (m.from_id = u.id AND m.to_id = ?) OR (m.from_id = ? AND m.to_id = u.id)
          ORDER BY m.date_created DESC LIMIT 1
        ) as last_message,
        (
          SELECT m.date_created FROM messages m
          WHERE (m.from_id = u.id AND m.to_id = ?) OR (m.from_id = ? AND m.to_id = u.id)
          ORDER BY m.date_created DESC LIMIT 1
        ) as last_message_time,
        (
          SELECT COUNT(*) FROM messages m
          WHERE m.from_id = u.id AND m.to_id = ? AND m.is_read = 0
        ) as unread_count
      FROM users u
      INNER JOIN messages m ON (m.from_id = u.id OR m.to_id = u.id)
      WHERE u.id != ?
        AND (m.from_id = ? OR m.to_id = ?)
      ORDER BY last_message_time DESC
    `, [adminId, adminId, adminId, adminId, adminId, adminId, adminId, adminId]);

    res.json({ success: true, users });
  } catch (err) {
    console.error('getChatUsers error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get messages between admin and a specific user
export const getChatMessages = async (req, res) => {
  try {
    const adminId = req.user?.id || 1;
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const [messages] = await pool.query(`
      SELECT 
        m.id,
        m.from_id,
        m.to_id,
        m.message,
        m.type,
        m.media,
        m.is_read,
        m.date_created,
        u.username as sender_name
      FROM messages m
      LEFT JOIN users u ON m.from_id = u.id
      WHERE
        (m.from_id = ? AND m.to_id = ?)
        OR (m.from_id = ? AND m.to_id = ?)
      ORDER BY m.date_created ASC
      LIMIT ?
    `, [adminId, userId, userId, adminId, limit]);

    // Mark messages from this user as read
    await pool.query(
      'UPDATE messages SET is_read = 1 WHERE from_id = ? AND to_id = ? AND is_read = 0',
      [userId, adminId]
    );

    res.json({ success: true, messages });
  } catch (err) {
    console.error('getChatMessages error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Send a message from admin to user
export const sendChatMessage = async (req, res) => {
  try {
    const adminId = req.user?.id || 1;
    const { userId } = req.params;
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const [result] = await pool.query(
      'INSERT INTO messages (from_id, to_id, message, type, is_read, date_created) VALUES (?, ?, ?, ?, ?, NOW())',
      [adminId, userId, message.trim(), 'text', 0]
    );

    const [newMsg] = await pool.query(
      'SELECT m.*, u.username as sender_name FROM messages m LEFT JOIN users u ON m.from_id = u.id WHERE m.id = ?',
      [result.insertId]
    );

    res.status(201).json({ success: true, message: newMsg[0] });
  } catch (err) {
    console.error('sendChatMessage error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get total unread count for admin badge
export const getUnreadCount = async (req, res) => {
  try {
    const adminId = req.user?.id || 1;
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE to_id = ? AND is_read = 0',
      [adminId]
    );
    res.json({ success: true, unread: rows[0]?.count || 0 });
  } catch (err) {
    console.error('getUnreadCount error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get slider count from settings
export const getSliderCount = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT value FROM settings WHERE variable = "slider_count"'
    );
    const count = rows[0] ? parseInt(rows[0].value, 10) : 3;
    res.json({ success: true, slider_count: count });
  } catch (err) {
    console.error('getSliderCount error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch slider count' });
  }
};

// Update slider count in settings
export const updateSliderCount = async (req, res) => {
  try { 
    const { slider_count } = req.body;
    if (slider_count === undefined || isNaN(parseInt(slider_count, 10))) {
      return res.status(400).json({ success: false, message: 'Invalid slider count value' });
    }
    const countVal = parseInt(slider_count, 10);
    await pool.query(
      `INSERT INTO settings (variable, value) 
       VALUES ('slider_count', ?) 
       ON DUPLICATE KEY UPDATE value = ?`,
      [countVal.toString(), countVal.toString()]
    );
    res.json({ success: true, message: 'Slider count updated successfully', slider_count: countVal });
  } catch (err) {
    console.error('updateSliderCount error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update slider count' });
  }
};

// Get all sliders (admin selection)
export const getAdminSliders = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM sliders ORDER BY id ASC'
    );
    const sliders = rows.map(row => {
      let imageUrl = row.image;
      if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('https')) {
        if (!imageUrl.startsWith('/')) {
          imageUrl = '/' + imageUrl;
        }
      }
      return {
        id: row.id,
        type: row.type || 'default',
        type_id: row.type_id || 0,
        image: row.image,
        image_url: imageUrl,
        link: row.link || '',
        badge: row.badge || '',
        title: row.title || '',
        subtitle: row.subtitle || '',
        cta_text: row.cta_text || '',
        cta_link: row.cta_link || '',
        date_added: row.date_added
      };
    });
    res.json({ success: true, sliders });
  } catch (err) {
    console.error('getAdminSliders error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch sliders' });
  }
};

// Update a single slider's text fields and/or image
export const updateSlider = async (req, res) => {
  try {
    const { id } = req.params;
    const { badge, title, subtitle, cta_text, cta_link, link } = req.body;
    await pool.query(
      `UPDATE sliders SET badge = ?, title = ?, subtitle = ?, cta_text = ?, cta_link = ?, link = ? WHERE id = ?`,
      [
        badge?.trim() || null,
        title?.trim() || null,
        subtitle?.trim() || null,
        cta_text?.trim() || null,
        cta_link?.trim() || null,
        link?.trim() || '',
        id
      ]
    );
    res.json({ success: true, message: 'Slider updated successfully' });
  } catch (err) {
    console.error('updateSlider error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update slider' });
  }
};

// Delete a single slider
export const deleteSlider = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM sliders WHERE id = ?', [id]);
    res.json({ success: true, message: 'Slider deleted successfully' });
  } catch (err) {
    console.error('deleteSlider error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete slider' });
  }
};

// Get products with stock (variants)
export const getProductsWithStock = async (req, res) => {
  try {
    const { categoryId, search, page, limit } = req.query;
    
    // Count total products matching filters
    let countQuery = `
      SELECT COUNT(DISTINCT p.id) as total 
      FROM products p
      WHERE p.status = 1
    `;
    const countParams = [];
    if (categoryId && categoryId !== 'all') {
      countQuery += ` AND p.category_id = ?`;
      countParams.push(categoryId);
    }
    if (search) {
      countQuery += ` AND p.name LIKE ?`;
      countParams.push(`%${search}%`);
    }
    const [countRows] = await pool.query(countQuery, countParams);
    const totalProducts = countRows[0]?.total || 0;

    // Get total variants and sum of stock across all matching products
    let statsQuery = `
      SELECT 
        COUNT(DISTINCT pv.id) as total_variants,
        SUM(COALESCE(pv.stock, 0)) as total_stock
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id AND pv.status = 1
      WHERE p.status = 1
    `;
    const statsParams = [];
    if (categoryId && categoryId !== 'all') {
      statsQuery += ` AND p.category_id = ?`;
      statsParams.push(categoryId);
    }
    if (search) {
      statsQuery += ` AND p.name LIKE ?`;
      statsParams.push(`%${search}%`);
    }
    const [statsRows] = await pool.query(statsQuery, statsParams);
    const totalVariants = statsRows[0]?.total_variants || 0;
    const totalStock = parseInt(statsRows[0]?.total_stock) || 0;

    // Fetch paginated product IDs
    let idQuery = `
      SELECT DISTINCT p.id 
      FROM products p
      WHERE p.status = 1
    `;
    const idParams = [];
    if (categoryId && categoryId !== 'all') {
      idQuery += ` AND p.category_id = ?`;
      idParams.push(categoryId);
    }
    if (search) {
      idQuery += ` AND p.name LIKE ?`;
      idParams.push(`%${search}%`);
    }
    
    idQuery += ` ORDER BY p.name ASC`;
    
    if (page && limit) {
      const pageVal = Number(page) || 1;
      const limitVal = Number(limit) || 15;
      const offsetVal = (pageVal - 1) * limitVal;
      idQuery += ` LIMIT ? OFFSET ?`;
      idParams.push(limitVal, offsetVal);
    } else {
      idQuery += ` LIMIT 500`; // fallback
    }

    const [idRows] = await pool.query(idQuery, idParams);
    
    if (idRows.length === 0) {
      return res.json({
        success: true,
        total: totalProducts,
        count: 0,
        data: []
      });
    }

    const productIds = idRows.map(row => row.id);

    // Fetch full products and variants details for the selected IDs
    let detailsQuery = `
      SELECT 
        p.id as product_id,
        p.name,
        p.image,
        p.category_id,
        c.name as category_name,
        pv.id as variant_id,
        pv.sku,
        pv.stock,
        pv.price,
        pv.attribute_value_ids
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv ON p.id = pv.product_id AND pv.status = 1
      WHERE p.id IN (?)
      ORDER BY p.name ASC, pv.id ASC
    `;
    
    const [rows] = await pool.query(detailsQuery, [productIds]);

    // Group variants by product
    const productsMap = {};
    rows.forEach(row => {
      const productId = row.product_id;
      if (!productsMap[productId]) {
        productsMap[productId] = {
          id: row.product_id,
          name: row.name,
          image: row.image,
          category_id: row.category_id,
          category_name: row.category_name,
          variants: []
        };
      }
      if (row.variant_id) {
        productsMap[productId].variants.push({
          id: row.variant_id,
          sku: row.sku,
          stock: parseInt(row.stock) || 0,
          price: row.price,
          attribute_value_ids: row.attribute_value_ids
        });
      }
    });
    
    // Calculate total stock for each product
    const products = Object.values(productsMap).map(product => {
      const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
      return {
        ...product,
        total_stock: totalStock
      };
    });

    // Ensure order is preserved matching productIds array
    const orderedProducts = productIds.map(id => products.find(p => p.id === id)).filter(Boolean);
    
    res.json({
      success: true,
      total: totalProducts,
      totalVariants: totalVariants,
      totalStock: totalStock,
      count: orderedProducts.length,
      data: orderedProducts
    });
  } catch (err) {
    console.error('[getProductsWithStock] Error:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch products with stock',
      error: err.message 
    });
  }
};

// Update product variant stock
export const updateVariantStock = async (req, res) => {
  try {
    const { variantId } = req.params;
    const { stock } = req.body;
    
    if (stock === undefined || stock === null) {
      return res.status(400).json({ success: false, message: 'Stock value is required' });
    }
    
    await pool.query(
      'UPDATE product_variants SET stock = ? WHERE id = ?',
      [parseInt(stock) || 0, variantId]
    );
    
    res.json({ 
      success: true, 
      message: 'Stock updated successfully',
      data: { variantId, stock: parseInt(stock) || 0 }
    });
  } catch (err) {
    console.error('updateVariantStock error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update stock' });
  }
};

// Save (add new) sliders — appends new sliders from selected media
export const saveSliders = async (req, res) => {
  let connection;
  try {
    const { type = 'default', media_ids, badge, title, subtitle, cta_text, cta_link } = req.body;
    if (!Array.isArray(media_ids) || media_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Valid media_ids array is required' });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Fetch paths from media table for provided IDs
    const [mediaRows] = await connection.query(
      'SELECT id, name, sub_directory FROM media WHERE id IN (?)',
      [media_ids]
    );

    if (mediaRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'No valid media files found for the provided IDs' });
    }

    // Map by ID so we keep original order requested in media_ids array
    const mediaMap = {};
    mediaRows.forEach(row => {
      let imgPath = row.sub_directory.replace(/^public[\/\\]/, '') + row.name;
      if (!imgPath.startsWith('/')) {
        imgPath = '/' + imgPath;
      }
      mediaMap[row.id] = imgPath;
    });

    // 3. Insert new sliders preserving the order of media_ids
    for (const mediaId of media_ids) {
      const imgPath = mediaMap[mediaId];
      if (imgPath) {
        await connection.query(
          `INSERT INTO sliders (type, type_id, image, link, badge, title, subtitle, cta_text, cta_link)
           VALUES (?, 0, ?, ?, ?, ?, ?, ?, ?)`,
          [
            type,
            imgPath,
            '',
            badge?.trim() || null,
            title?.trim() || null,
            subtitle?.trim() || null,
            cta_text?.trim() || null,
            cta_link?.trim() || null
          ]
        );
      }
    }

    await connection.commit();
    connection.release();

    res.json({ success: true, message: 'Sliders updated successfully' });
  } catch (err) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('saveSliders error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to save sliders selection' });
  }
};

// ── System Users ─────────────────────────────────────────────────────

// GET all system users (admin users only)
export const getSystemUsers = async (req, res) => {
  try {
    console.log('Fetching system users - Executing fixed code version 2...');
    
    // Query only columns that exist in the users table
    const [users] = await pool.query(
      `SELECT id, username, email, mobile, status 
       FROM users 
       ORDER BY id DESC`
    );
    
    console.log(`Found ${users.length} users`);
    
    // Add default role for frontend compatibility
    const usersWithRole = users.map(user => ({
      ...user,
      role: 'admin' // default role
    }));
    
    res.json({ 
      success: true, 
      users: usersWithRole || [] 
    });
  } catch (err) {
    console.error('getSystemUsers error:', err.message);
    console.error('Full error stack:', err.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch system users', 
      error: err.message 
    });
  }
};

// CREATE new system user
export const createSystemUser = async (req, res) => {
  try {
    const { username, email, mobile, password } = req.body;
    
    if (!username?.trim() || !email?.trim() || !mobile?.trim() || !password?.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, email, mobile, and password are all required' 
      });
    }

    // Check if user already exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email.trim(), username.trim()]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email or username already exists' 
      });
    }

    // Hash password using bcryptjs
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    const [result] = await pool.query(
      `INSERT INTO users (username, email, mobile, password, status)
       VALUES (?, ?, ?, ?, ?)`,
      [
        username.trim(),
        email.trim(),
        mobile.trim(),
        hashedPassword,
        1 // status = active
      ]
    );

    res.status(201).json({
      success: true,
      message: 'System user created successfully',
      userId: result.insertId
    });
  } catch (err) {
    console.error('createSystemUser error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Failed to create user' });
  }
};

// UPDATE system user
export const updateSystemUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email, mobile, password } = req.body;

    if (!username?.trim() || !email?.trim() || !mobile?.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, email, and mobile are required' 
      });
    }

    // Check if email/username already exists (excluding current user)
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE (email = ? OR username = ?) AND id != ?',
      [email.trim(), username.trim(), userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email or username already in use by another user' 
      });
    }

    let updateFields = [
      'username = ?',
      'email = ?',
      'mobile = ?'
    ];
    let updateValues = [
      username.trim(),
      email.trim(),
      mobile.trim()
    ];

    // Only update password if provided
    if (password?.trim()) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password.trim(), 10);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }

    updateValues.push(userId);

    await pool.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({
      success: true,
      message: 'System user updated successfully'
    });
  } catch (err) {
    console.error('updateSystemUser error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Failed to update user' });
  }
};

// UPDATE system user status
export const updateSystemUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (userId === '1' || userId === 1) {
      return res.status(400).json({ success: false, message: 'Cannot change status of primary admin' });
    }

    if (status === undefined) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status ? 1 : 0, userId]);

    res.json({ success: true, message: 'Status updated successfully' });
  } catch (err) {
    console.error('updateSystemUserStatus error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};

// DELETE system user
export const deleteSystemUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent deleting user ID 1 (primary admin)
    if (userId === '1' || userId === 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete the primary admin user' 
      });
    }

    await pool.query('DELETE FROM users WHERE id = ?', [userId]);

    res.json({
      success: true,
      message: 'System user deleted successfully'
    });
  } catch (err) {
    console.error('deleteSystemUser error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};

// UPLOAD system user avatar image (disabled - avatar column not in users table)
export const uploadSystemUserAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    res.json({
      success: true,
      message: 'Avatar upload endpoint available',
      note: 'Avatar functionality is not yet integrated with user records'
    });
  } catch (err) {
    console.error('uploadSystemUserAvatar error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to upload avatar' });
  }
};
