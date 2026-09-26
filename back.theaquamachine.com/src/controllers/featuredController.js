import pool from '../config/db.js';

export const getAllFeatured = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM `featured_sections` ORDER BY `order` ASC, `created_at` DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createFeatured = async (req, res) => {
  const { title, shortDescription, style = 'Default', categories, productTypes } = req.body;

  try {
    const catName = Array.isArray(categories) ? categories[0] : categories;

    // Get next order number
    const [maxRes] = await pool.query(
      'SELECT MAX(`order`) as max_order FROM `featured_sections`'
    );
    const newOrder = (maxRes[0]?.max_order || 0) + 1;

    // Insert
    const [result] = await pool.query(
      `INSERT INTO \`featured_sections\` 
       (title, short_description, style, category_name, product_type, \`order\`)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, shortDescription, style, catName, productTypes, newOrder]
    );

    // Return the newly created row
    const [newSection] = await pool.query(
      'SELECT * FROM `featured_sections` WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newSection[0]);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

export const updateFeatured = async (req, res) => {
  const { id } = req.params;
  const { title, shortDescription, style = 'Default', categories, productTypes } = req.body;

  try {
    const catName = Array.isArray(categories) ? categories[0] : categories;

    await pool.query(
      `UPDATE \`featured_sections\` 
       SET title = ?, short_description = ?, style = ?, category_name = ?, product_type = ? 
       WHERE id = ?`,
      [title, shortDescription, style, catName, productTypes, id]
    );

    res.json({ message: 'Featured section updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating featured section' });
  }
};

export const deleteFeatured = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM `featured_sections` WHERE id = ?', [id]);
    res.json({ message: 'Featured section deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting featured section' });
  }
};

export const reorderFeatured = async (req, res) => {
  const { order } = req.body;   // array of ids

  if (!Array.isArray(order)) {
    return res.status(400).json({ message: 'Order must be an array of ids' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (let i = 0; i < order.length; i++) {
      await connection.query(
        'UPDATE `featured_sections` SET `order` = ? WHERE id = ?',
        [i, order[i]]
      );
    }

    await connection.commit();
    res.json({ message: 'Section order updated successfully' });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: 'Reorder failed' });
  } finally {
    connection.release();
  }
};