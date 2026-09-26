import pool from '../config/db.js';

export const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const [wishlist] = await pool.query(
      `SELECT 
         p.id,
         p.name,
         p.image,
         p.other_images,
         p.short_description,
         p.description,
         p.stock,
         p.brand,
         p.status,
         p.tags,
         pv.id AS default_variant_id,
         pv.price,
         pv.special_price,
         c.name AS category_name
       FROM favorites f
       JOIN products p ON f.product_id = p.id
       LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.status = 1
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE f.user_id = ? AND p.status = 1
       GROUP BY p.id`,
      [userId]
    );
    res.json({ success: true, wishlist });
  } catch (err) {
    console.error('getWishlist error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching wishlist' });
  }
};

export const toggleWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id } = req.body;
    
    if (!product_id) {
      return res.status(400).json({ success: false, message: 'product_id is required' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM favorites WHERE user_id = ? AND product_id = ?',
      [userId, product_id]
    );

    if (existing.length > 0) {
      await pool.query(
        'DELETE FROM favorites WHERE id = ?',
        [existing[0].id]
      );
      res.json({ success: true, action: 'removed', message: 'Product removed from wishlist' });
    } else {
      await pool.query(
        'INSERT INTO favorites (user_id, product_id) VALUES (?, ?)',
        [userId, product_id]
      );
      res.json({ success: true, action: 'added', message: 'Product added to wishlist' });
    }
  } catch (err) {
    console.error('toggleWishlist error:', err);
    res.status(500).json({ success: false, message: 'Server error updating wishlist' });
  }
};
