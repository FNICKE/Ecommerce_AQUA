import pool from '../config/db.js';

export const getVariantsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const isNumeric = /^\d+$/.test(productId);

    let query = 'SELECT * FROM product_variants WHERE product_id = ? AND status = 1';
    let params = [productId];

    if (!isNumeric) {
      query = `
        SELECT pv.* 
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        WHERE p.slug = ? AND pv.status = 1 AND p.status = 1
      `;
    }

    const [variants] = await pool.query(query, params);

    // Collect all value IDs from the variants' attribute_value_ids
    const valueIdsSet = new Set();
    variants.forEach(v => {
      if (v.attribute_value_ids) {
        v.attribute_value_ids.split(',').forEach(id => {
          const parsed = parseInt(id.trim(), 10);
          if (parsed) valueIdsSet.add(parsed);
        });
      }
    });

    const valueIds = Array.from(valueIdsSet);
    let valuesMetadata = [];
    if (valueIds.length > 0) {
      const [rows] = await pool.query(
        `SELECT av.id AS value_id, av.value AS value_name, a.id AS attribute_id, a.name AS attribute_name
         FROM attribute_values av
         JOIN attributes a ON av.attribute_id = a.id
         WHERE av.id IN (?)`,
        [valueIds]
      );
      valuesMetadata = rows;
    }

    // Map the resolved attribute metadata to each variant
    variants.forEach(v => {
      const ids = v.attribute_value_ids ? v.attribute_value_ids.split(',').map(id => parseInt(id.trim(), 10)) : [];
      v.attribute_values = valuesMetadata
        .filter(row => ids.includes(row.value_id))
        .map(row => ({
          attribute_id: row.attribute_id,
          attribute_name: row.attribute_name,
          value_id: row.value_id,
          value_name: row.value_name
        }));

      if (typeof v.other_images === 'string') {
        try {
          v.other_images = JSON.parse(v.other_images);
        } catch (e) {
          v.other_images = [];
        }
      } else if (!v.other_images) {
        v.other_images = [];
      }
    });

    res.json({ success: true, variants });
  } catch (err) {
    console.error('getVariantsByProduct error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createVariant = async (req, res) => {
  try {
    const { product_id, attribute_value_ids, price, special_price, stock, sku, image, other_images } = req.body;

    const [result] = await pool.query(
      `INSERT INTO product_variants 
      (product_id, attribute_value_ids, price, special_price, stock, sku, image, other_images, height, breadth, length)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product_id,
        attribute_value_ids || '',
        price,
        special_price || price,
        stock || 0,
        sku || null,
        image || null,
        other_images ? (typeof other_images === 'string' ? other_images : JSON.stringify(other_images)) : null,
        0,
        0,
        0
      ]
    );

    res.status(201).json({
      success: true,
      variantId: result.insertId
    });

  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const { price, special_price, stock, sku, weight, image, other_images } = req.body;

    await pool.query(
      'UPDATE product_variants SET price=?, special_price=?, stock=?, sku=?, weight=?, image=?, other_images=? WHERE id=?',
      [price, special_price, stock, sku, weight || null, image || null, other_images ? (typeof other_images === 'string' ? other_images : JSON.stringify(other_images)) : null, id]
    );

    res.json({ success: true, message: 'Variant updated' });

  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteVariant = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'UPDATE product_variants SET status = 0 WHERE id = ?',
      [id]
    );

    res.json({ success: true, message: 'Variant deleted' });

  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── NEW: Get all products (for weight variant admin) ────────────────────────
export const getProductsForVariantAdmin = async (req, res) => {
  try {
    const [products] = await pool.query(
      'SELECT id, name FROM products WHERE status = 1 ORDER BY name ASC'
    );
    res.json({ success: true, products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── NEW: Bulk upsert weight variants for a product ──────────────────────────
// Body: { product_id, variants: [{ id?, weight, price, special_price, stock, sku, image }] }
export const bulkUpsertWeightVariants = async (req, res) => {
  const { product_id, variants } = req.body;

  if (!product_id || !Array.isArray(variants)) {
    return res.status(400).json({ success: false, message: 'product_id and variants[] required' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const results = [];

    for (const v of variants) {
      const weight = (v.weight || '').trim();
      const price = parseFloat(v.price) || 0;
      const special_price = v.special_price !== '' && v.special_price != null
        ? parseFloat(v.special_price)
        : price;
      const stock = parseInt(v.stock) || 0;
      const sku = v.sku || null;
      const image = v.image || null;
      const other_images = v.other_images || null;

      if (!weight) continue; // skip blank rows

      if (v.id) {
        // Update existing variant
        await connection.query(
          `UPDATE product_variants
           SET weight=?, price=?, special_price=?, stock=?, sku=?, image=?, other_images=?, status=1
           WHERE id=? AND product_id=?`,
          [weight, price, special_price, stock, sku, image, other_images ? (typeof other_images === 'string' ? other_images : JSON.stringify(other_images)) : null, v.id, product_id]
        );
        results.push({ id: v.id, action: 'updated' });
      } else {
        // Check if a variant with this weight already exists (active or inactive)
        const [existing] = await connection.query(
          'SELECT id FROM product_variants WHERE product_id=? AND weight=?',
          [product_id, weight]
        );

        if (existing.length > 0) {
          // Reactivate + update
          const existId = existing[0].id;
          await connection.query(
            `UPDATE product_variants
             SET price=?, special_price=?, stock=?, sku=?, image=?, other_images=?, status=1
             WHERE id=?`,
            [price, special_price, stock, sku, image, other_images ? (typeof other_images === 'string' ? other_images : JSON.stringify(other_images)) : null, existId]
          );
          results.push({ id: existId, action: 'reactivated' });
        } else {
          // Insert new
          const [ins] = await connection.query(
            `INSERT INTO product_variants (product_id, weight, price, special_price, stock, sku, image, other_images, height, breadth, length, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [product_id, weight, price, special_price, stock, sku, image, other_images ? (typeof other_images === 'string' ? other_images : JSON.stringify(other_images)) : null, 0, 0, 0]
          );
          results.push({ id: ins.insertId, action: 'created' });
        }
      }
    }

    await connection.commit();

    // Return fresh variants for this product
    const [freshVariants] = await connection.query(
      'SELECT * FROM product_variants WHERE product_id=? AND status=1 ORDER BY price ASC',
      [product_id]
    );

    // Map other_images back to parsed JSON array for consistency
    freshVariants.forEach(fv => {
      if (typeof fv.other_images === 'string') {
        try {
          fv.other_images = JSON.parse(fv.other_images);
        } catch (e) {
          fv.other_images = [];
        }
      } else if (!fv.other_images) {
        fv.other_images = [];
      }
    });

    res.json({ success: true, results, variants: freshVariants });
  } catch (err) {
    await connection.rollback();
    console.error('[bulkUpsertWeightVariants]', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  } finally {
    connection.release();
  }
};

// ─── NEW: Hard delete a single variant (admin weight management) ─────────────
export const hardDeleteVariant = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM product_variants WHERE id=?', [id]);
    res.json({ success: true, message: 'Variant removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
