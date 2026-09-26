import pool from '../config/db.js';
import slugify from 'slugify';

// GET /api/admin/brands - list all brands
export const getBrandsAdmin = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, slug, image, status FROM brands ORDER BY id DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('getBrandsAdmin error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch brands' });
  }
};

// POST /api/admin/brands - create a brand
export const createBrandAdmin = async (req, res) => {
  try {
    const { name, imagePath: bodyImagePath } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const slug = slugify(name, { lower: true, strict: true });
    
    // Handle image from upload or from media library path
    let imagePath = null;
    if (req.file) {
      imagePath = req.file.path.replace(/\\/g, '/').replace(/^public\//, '');
    } else if (bodyImagePath) {
      imagePath = bodyImagePath;
    }

    if (!imagePath) {
      return res.status(400).json({ success: false, message: 'Image is required' });
    }

    const [result] = await pool.query(
      'INSERT INTO brands (name, slug, image, status) VALUES (?, ?, ?, ?)',
      [name.trim(), slug, imagePath, 1]
    );

    res.status(201).json({
      success: true,
      id: result.insertId,
      name: name.trim(),
      slug,
      image: imagePath,
      status: 1,
    });
  } catch (err) {
    console.error('createBrandAdmin error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to create brand' });
  }
};

// PUT /api/admin/brands/:id - update name / image / status
export const updateBrandAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status, imagePath: bodyImagePath } = req.body;

    const fields = [];
    const values = [];

    if (name?.trim()) {
      fields.push('name = ?');
      values.push(name.trim());
      // also update slug
      fields.push('slug = ?');
      values.push(slugify(name, { lower: true, strict: true }));
    }

    if (typeof status !== 'undefined') {
      fields.push('status = ?');
      values.push(Number(status) ? 1 : 0);
    }

    if (req.file) {
      const imagePath = req.file.path.replace(/\\/g, '/').replace(/^public\//, '');
      fields.push('image = ?');
      values.push(imagePath);
    } else if (bodyImagePath) {
      fields.push('image = ?');
      values.push(bodyImagePath);
    }

    if (!fields.length) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    values.push(id);
    await pool.query(`UPDATE brands SET ${fields.join(', ')} WHERE id = ?`, values);

    res.json({ success: true, message: 'Brand updated' });
  } catch (err) {
    console.error('updateBrandAdmin error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update brand' });
  }
};

// DELETE /api/admin/brands/:id - delete brand
export const deleteBrandAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM brands WHERE id = ?', [id]);

    // Reset auto-increment
    await pool.query('ALTER TABLE brands AUTO_INCREMENT = 1;');

    res.json({ success: true, message: 'Brand deleted' });
  } catch (err) {
    console.error('deleteBrandAdmin error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete brand' });
  }
};

