// controllers/categoryController.js
import pool from '../config/db.js';
import path from 'path';
import fs from 'fs/promises';

function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function getPublicUrl(filePath) {
  if (!filePath) return null;
  if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('data:')) {
    return filePath;
  }
  const cleaned = filePath.replace(/^public\//, '').replace(/^\/+/, '');
  return `/${cleaned}`;
}

function getYearMonthFromPath(destination) {
  if (!destination) return '';
  const parts = destination.split(/[\\/]/);
  return parts.slice(-2).join('/');
}

// ─── GET all active categories ──────────────────────────────────────────
// controllers/categoryController.js
export const getAllCategories = async (req, res) => {
  try {
    // Get query parameters (optional)
    const { include_inactive = 'false', include_subcategories = 'true' } = req.query;

    // Base query - always include active categories
    let query = `
      SELECT 
        id, name, parent_id, slug, image, banner, row_order, status, clicks
      FROM categories 
      WHERE status = 1
    `;

    // If admin or explicit request wants inactive too
    if (include_inactive === 'true') {
      query = `
        SELECT 
          id, name, parent_id, slug, image, banner, row_order, status, clicks
        FROM categories 
        -- no WHERE status = 1
      `;
    }

    query += ` ORDER BY row_order ASC, name ASC`;

    const [rows] = await pool.query(query);

    // Optional: build nested structure (recommended for frontend)
    let finalCategories = rows;

    if (include_subcategories === 'true') {
      // Fetch all categories (to build tree) - only once
      const [allRows] = await pool.query(`
        SELECT 
          id, name, parent_id, slug, image, banner, row_order, status, clicks
        FROM categories 
        ORDER BY row_order ASC, name ASC
      `);

      const categoryMap = new Map();
      const rootCategories = [];

      // First pass: map all categories
      allRows.forEach(cat => {
        categoryMap.set(cat.id, {
          ...cat,
          imageUrl: getPublicUrl(cat.image),
          bannerUrl: getPublicUrl(cat.banner),
          subcategories: []
        });
      });

      // Second pass: build tree
      allRows.forEach(cat => {
        const node = categoryMap.get(cat.id);
        if (cat.parent_id === 0 || cat.parent_id === null) {
          rootCategories.push(node);
        } else {
          const parent = categoryMap.get(cat.parent_id);
          if (parent) {
            parent.subcategories.push(node);
          }
        }
      });

      finalCategories = rootCategories;
    } else {
      // Flat list with public URLs
      finalCategories = rows.map(row => ({
        ...row,
        imageUrl: getPublicUrl(row.image),
        bannerUrl: getPublicUrl(row.banner),
      }));
    }

    res.json({
      success: true,
      count: finalCategories.length,
      categories: finalCategories,
      metadata: {
        total_in_db: rows.length,              // how many would be without status filter
        active_only: include_inactive !== 'true',
        nested: include_subcategories === 'true'
      }
    });

  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to load categories',
      error: err.message
    });
  }
};

// ─── GET single category ─────────────────────────────────────────────────
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const cat = rows[0];
    res.json({
      success: true,
      category: {
        ...cat,
        imageUrl: getPublicUrl(cat.image),
        bannerUrl: getPublicUrl(cat.banner),
      }
    });
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: err.message,
    });
  }
};

// ─── POST create new category ────────────────────────────────────────────
export const createCategory = async (req, res) => {
  console.log('=== createCategory START ===');
  console.log('Body:', req.body);
  console.log('Files:', req.files ? Object.keys(req.files) : 'No files');

  try {
    const { name, parent_id = 0, mainMediaId, bannerMediaId } = req.body;
    const imageFile = req.files?.image?.[0];
    const bannerFile = req.files?.banner?.[0];

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    if (!imageFile && !mainMediaId) {
      return res.status(400).json({ success: false, message: 'Main image is required (upload or select from media)' });
    }

    const slug = generateSlug(name.trim());

    // Slug uniqueness
    const [slugCheck] = await pool.query('SELECT id FROM categories WHERE slug = ?', [slug]);
    if (slugCheck.length > 0) {
      return res.status(400).json({ success: false, message: 'Slug already exists' });
    }

    let imagePath = null;
    let bannerPath = null;

    // Main image
    if (imageFile) {
      const dir = getYearMonthFromPath(imageFile.destination);
      imagePath = `uploads/categories/${dir}/${imageFile.filename}`;
      console.log('Uploaded main image:', imagePath);
    } else if (mainMediaId) {
      console.log('Fetching main image from media ID:', mainMediaId);
      const [media] = await pool.query(
        'SELECT sub_directory, name, extension FROM media WHERE id = ?',
        [mainMediaId]
      );

      if (media.length === 0) {
        console.log('Media ID not found:', mainMediaId);
        return res.status(400).json({ success: false, message: `Selected main image (ID ${mainMediaId}) not found` });
      }

      const { sub_directory, name } = media[0];
      imagePath = `/${sub_directory ? sub_directory + '/' : ''}${name}`.replace(/\/+/g, '/');
      console.log('Resolved main image path from media:', imagePath);
    }

    // Banner (optional)
    if (bannerFile) {
      const dir = getYearMonthFromPath(bannerFile.destination);
      bannerPath = `uploads/categories/${dir}/${bannerFile.filename}`;
      console.log('Uploaded banner:', bannerPath);
    } else if (bannerMediaId) {
      console.log('Fetching banner from media ID:', bannerMediaId);
      const [media] = await pool.query(
        'SELECT sub_directory, name, extension FROM media WHERE id = ?',
        [bannerMediaId]
      );

      if (media.length > 0) {
        const { sub_directory, name } = media[0];
        bannerPath = `/${sub_directory ? sub_directory + '/' : ''}${name}`.replace(/\/+/g, '/');
        console.log('Resolved banner path from media:', bannerPath);
      }
    }

    console.log('Final values for INSERT:', { name, parent_id, slug, imagePath, bannerPath });

    const [result] = await pool.query(
      `INSERT INTO categories 
       (name, parent_id, slug, image, banner, status, row_order, clicks) 
       VALUES (?, ?, ?, ?, ?, 1, 0, 0)`,
      [name.trim(), parent_id, slug, imagePath, bannerPath]
    );

    console.log('=== SUCCESS === New category ID:', result.insertId);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      categoryId: result.insertId
    });
  } catch (err) {
    console.error('=== CREATE CATEGORY ERROR ===');
    console.error('Error message:', err.message);
    console.error('Full stack:', err.stack);
    res.status(500).json({
      success: false,
      message: 'Server error while creating category',
      error: err.message
    });
  } finally {
    console.log('=== createCategory END ===');
  }
};

// ─── PUT update category ─────────────────────────────────────────────────
export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, parent_id, slug: providedSlug, mainMediaId, bannerMediaId } = req.body;
  const imageFile = req.files?.image?.[0];
  const bannerFile = req.files?.banner?.[0];

  try {
    const [existingRows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const existing = existingRows[0];

    let updates = [];
    let values = [];

    if (name?.trim()) {
      updates.push('name = ?');
      values.push(name.trim());
      const newSlug = providedSlug || generateSlug(name.trim());
      updates.push('slug = ?');
      values.push(newSlug);
    }

    if (parent_id !== undefined) {
      updates.push('parent_id = ?');
      values.push(parent_id || null);
    }

    // Replace main image
    if (imageFile) {
      if (existing.image) {
        const oldPath = path.join(process.cwd(), 'public', existing.image);
        await fs.unlink(oldPath).catch(() => { });
      }
      const dir = getYearMonthFromPath(imageFile.destination);
      const newPath = `uploads/categories/${dir}/${imageFile.filename}`;
      updates.push('image = ?');
      values.push(newPath);
    } else if (mainMediaId) {
      const [media] = await pool.query(
        'SELECT sub_directory, name FROM media WHERE id = ?',
        [mainMediaId]
      );
      if (media.length > 0) {
        const { sub_directory, name } = media[0];
        const newPath = `/${sub_directory ? sub_directory + '/' : ''}${name}`.replace(/\/+/g, '/');
        updates.push('image = ?');
        values.push(newPath);
      }
    }

    // Replace banner
    if (bannerFile) {
      if (existing.banner) {
        const oldPath = path.join(process.cwd(), 'public', existing.banner);
        await fs.unlink(oldPath).catch(() => { });
      }
      const dir = getYearMonthFromPath(bannerFile.destination);
      const newPath = `uploads/categories/${dir}/${bannerFile.filename}`;
      updates.push('banner = ?');
      values.push(newPath);
    } else if (bannerMediaId) {
      const [media] = await pool.query(
        'SELECT sub_directory, name FROM media WHERE id = ?',
        [bannerMediaId]
      );
      if (media.length > 0) {
        const { sub_directory, name } = media[0];
        const newPath = `/${sub_directory ? sub_directory + '/' : ''}${name}`.replace(/\/+/g, '/');
        updates.push('banner = ?');
        values.push(newPath);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`;
    await pool.query(query, values);

    res.json({ success: true, message: 'Category updated successfully' });
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ success: false, message: 'Failed to update category' });
  }
};

// ─── DELETE category (hard delete) ──────────────────────────────────────
export const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query('SELECT id FROM categories WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Hard delete categories securely
    await pool.query('SET FOREIGN_KEY_CHECKS = 0;');
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    await pool.query('ALTER TABLE categories AUTO_INCREMENT = 1;');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1;');

    res.json({ success: true, message: 'Category permanently deleted' });
  } catch (err) {
    console.error('deleteCategory error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
};

// ─── PATCH toggle status (active ↔ inactive) ────────────────────────────
export const toggleCategoryStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query('SELECT status FROM categories WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const currentStatus = rows[0].status;
    const newStatus = currentStatus === 1 ? 0 : 1;

    await pool.query('UPDATE categories SET status = ? WHERE id = ?', [newStatus, id]);

    res.json({
      success: true,
      message: `Category ${newStatus === 1 ? 'activated' : 'deactivated'}`,
      status: newStatus
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to toggle status' });
  }
};

// ─── POST reorder categories ──────────────────────────────────────────────
export const reorderCategories = async (req, res) => {
  try {
    const { order } = req.body; // Array of { id, row_order }

    if (!Array.isArray(order)) {
      return res.status(400).json({ success: false, message: 'Invalid order payload' });
    }

    for (const item of order) {
      if (item.id && typeof item.row_order === 'number') {
        await pool.query('UPDATE categories SET row_order = ? WHERE id = ?', [item.row_order, item.id]);
      }
    }

    res.json({ success: true, message: 'Category order saved successfully' });
  } catch (err) {
    console.error('reorderCategories error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};