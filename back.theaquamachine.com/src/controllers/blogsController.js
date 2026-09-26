import pool from '../config/db.js';

export const getAllBlogs = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM blogs ORDER BY created_at DESC');
    res.json({ success: true, blogs: rows });
  } catch (error) {
    console.error('getAllBlogs error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to load blogs' });
  }
};

export const createBlog = async (req, res) => {
  try {
    const { title, content, image } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and written Content are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO blogs (title, content, image) VALUES (?, ?, ?)',
      [title, content, image || null]
    );

    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      blogId: result.insertId
    });
  } catch (error) {
    console.error('createBlog error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to save blog post' });
  }
};

export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Blog ID is required' });
    }

    const [result] = await pool.query('DELETE FROM blogs WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    res.json({ success: true, message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('deleteBlog error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete blog' });
  }
};
