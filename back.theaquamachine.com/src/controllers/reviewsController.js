import pool from '../config/db.js';

export const getAllReviews = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM reviews ORDER BY created_at DESC');
    res.json({ success: true, reviews: rows });
  } catch (error) {
    console.error('getAllReviews error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to load reviews' });
  }
};

export const createReview = async (req, res) => {
  try {
    const { name, designation, review, stars } = req.body;
    let image = req.body.image || null;

    if (req.file) {
      // Normalize path to use standard slashes and remove the public prefix
      image = req.file.path.replace(/\\/g, '/').replace(/^public\//, '');
      if (!image.startsWith('/')) {
        image = '/' + image;
      }
    }

    if (!name || !review) {
      return res.status(400).json({ success: false, message: 'Name and Review content are required' });
    }

    const starCount = Math.min(Math.max(parseInt(stars, 10) || 5, 1), 5);

    const [result] = await pool.query(
      'INSERT INTO reviews (name, designation, review, stars, image) VALUES (?, ?, ?, ?, ?)',
      [name, designation || null, review, starCount, image || null]
    );

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      reviewId: result.insertId
    });
  } catch (error) {
    console.error('createReview error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to save review' });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Review ID is required' });
    }

    const [result] = await pool.query('DELETE FROM reviews WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('deleteReview error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete review' });
  }
};
