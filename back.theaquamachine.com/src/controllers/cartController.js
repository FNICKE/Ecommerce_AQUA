import pool from '../config/db.js';

// controllers/cartController.js
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const [cartItems] = await pool.query(
      `SELECT 
         c.id                    AS cart_id,
         c.user_id,
         c.product_variant_id    AS variant_id,
         c.qty,
         p.id                    AS product_id,
         p.name,
         p.image                 AS image,
         p.short_description,
         pv.weight               AS weight,
         pv.price,
         pv.special_price,
         pv.stock                AS variant_stock,
         pv.sku
       FROM cart c
       JOIN product_variants pv ON c.product_variant_id = pv.id
       JOIN products p          ON pv.product_id = p.id
       WHERE c.user_id = ?
       ORDER BY c.id DESC`,
      [userId]
    );

    res.json({ success: true, cartItems });
  } catch (err) {
    console.error('getCart error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch cart' });
  }
};

export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, variant_id, qty = 1 } = req.body;   // ← add variant_id here!

    if (!variant_id) {
      return res.status(400).json({ success: false, message: 'variant_id is required' });
    }

    const quantity = parseInt(qty, 10);
    if (isNaN(quantity) || quantity < 1) {
      return res.status(400).json({ success: false, message: 'qty must be positive integer' });
    }

    // Validate variant exists and has stock
    const [variantRows] = await pool.query(
      'SELECT stock FROM product_variants WHERE id = ? AND status = 1',
      [variant_id]
    );

    if (variantRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Variant not found or inactive' });
    }

    const availableStock = variantRows[0].stock;
    if (quantity > availableStock) {
      return res.status(400).json({ success: false, message: 'Not enough stock available' });
    }

    // Check if this exact variant is already in cart
    const [existing] = await pool.query(
      'SELECT id, qty FROM cart WHERE user_id = ? AND product_variant_id = ?',
      [userId, variant_id]
    );

    if (existing.length > 0) {
      const newQty = existing[0].qty + quantity;
      if (newQty > availableStock) {
        return res.status(400).json({ success: false, message: 'Total quantity exceeds available stock' });
      }
      await pool.query(
        'UPDATE cart SET qty = ? WHERE id = ? AND user_id = ?',
        [newQty, existing[0].id, userId]
      );
    } else {
      await pool.query(
        'INSERT INTO cart (user_id, product_variant_id, qty) VALUES (?, ?, ?)',
        [userId, variant_id, quantity]
      );
    }

    res.json({ success: true, message: 'Item added to cart' });
  } catch (err) {
    console.error('addToCart error:', err);
    res.status(500).json({ success: false, message: 'Failed to add item to cart' });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { qty } = req.body;

    const quantity = parseInt(qty, 10);
    if (isNaN(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'qty must be a positive integer'
      });
    }

    const [result] = await pool.query(
      'UPDATE cart SET qty = ? WHERE id = ? AND user_id = ?',
      [quantity, itemId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found or not owned by user'
      });
    }

    res.json({ 
      success: true, 
      message: 'Cart item updated' 
    });
  } catch (err) {
    console.error('updateCartItem error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update cart item'
    });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    const [result] = await pool.query(
      'DELETE FROM cart WHERE id = ? AND user_id = ?',
      [itemId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found or not owned by user'
      });
    }

    res.json({ 
      success: true, 
      message: 'Item removed from cart' 
    });
  } catch (err) {
    console.error('removeFromCart error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to remove item from cart'
    });
  }
};