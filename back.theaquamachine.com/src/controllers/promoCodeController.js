import pool from '../config/db.js';

// GET /api/admin/promo-codes - Fetch all promo codes
export const getPromoCodes = async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM promo_codes';
    const params = [];

    if (search) {
      query += ' WHERE promo_code LIKE ? OR message LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY id DESC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getPromoCodes error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch promo codes' });
  }
};

// POST /api/admin/promo-codes - Create promo code
export const createPromoCode = async (req, res) => {
  try {
    const {
      promo_code,
      message,
      start_date,
      end_date,
      no_of_users,
      minimum_order_amount,
      discount,
      discount_type,
      max_discount_amount,
      repeat_usage,
      no_of_repeat_usage,
      imagePath,
      status,
      is_cashback,
      list_promocode,
      is_specific_users,
      users_id
    } = req.body;

    if (!promo_code?.trim()) {
      return res.status(400).json({ success: false, message: 'Promo Code is required' });
    }

    // Handle image
    let image = null;
    if (req.file) {
      image = req.file.path.replace(/\\/g, '/').replace(/^public\//, '');
    } else if (imagePath) {
      image = imagePath;
    }

    const query = `
      INSERT INTO promo_codes (
        promo_code, message, start_date, end_date, no_of_users, 
        minimum_order_amount, discount, discount_type, max_discount_amount, 
        repeat_usage, no_of_repeat_usage, image, status, is_cashback, 
        list_promocode, is_specific_users, users_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      promo_code.trim(),
      message || null,
      start_date || null,
      end_date || null,
      no_of_users ? parseInt(no_of_users, 10) : null,
      minimum_order_amount ? parseFloat(minimum_order_amount) : null,
      discount ? parseFloat(discount) : null,
      discount_type || null,
      max_discount_amount ? parseFloat(max_discount_amount) : null,
      repeat_usage ? parseInt(repeat_usage, 10) : 0,
      no_of_repeat_usage ? parseInt(no_of_repeat_usage, 10) : null,
      image,
      typeof status !== 'undefined' ? parseInt(status, 10) : 1,
      is_cashback ? parseInt(is_cashback, 10) : 0,
      list_promocode ? parseInt(list_promocode, 10) : 1,
      is_specific_users ? parseInt(is_specific_users, 10) : 0,
      users_id || ""
    ];

    const [result] = await pool.query(query, params);

    res.status(201).json({
      success: true,
      message: 'Promo Code created successfully',
      data: {
        id: result.insertId,
        promo_code: promo_code.trim(),
        message
      }
    });
  } catch (err) {
    console.error('createPromoCode error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to create promo code' });
  }
};

// PUT /api/admin/promo-codes/:id - Update promo code
export const updatePromoCode = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      promo_code,
      message,
      start_date,
      end_date,
      no_of_users,
      minimum_order_amount,
      discount,
      discount_type,
      max_discount_amount,
      repeat_usage,
      no_of_repeat_usage,
      imagePath,
      status,
      is_cashback,
      list_promocode,
      is_specific_users,
      users_id
    } = req.body;

    if (!promo_code?.trim()) {
      return res.status(400).json({ success: false, message: 'Promo Code is required' });
    }

    // Handle image
    let image = imagePath;
    if (req.file) {
      image = req.file.path.replace(/\\/g, '/').replace(/^public\//, '');
    }

    const query = `
      UPDATE promo_codes SET
        promo_code = ?, message = ?, start_date = ?, end_date = ?, no_of_users = ?, 
        minimum_order_amount = ?, discount = ?, discount_type = ?, max_discount_amount = ?, 
        repeat_usage = ?, no_of_repeat_usage = ?, image = ?, status = ?, is_cashback = ?, 
        list_promocode = ?, is_specific_users = ?, users_id = ?
      WHERE id = ?
    `;

    const params = [
      promo_code.trim(),
      message || null,
      start_date || null,
      end_date || null,
      no_of_users ? parseInt(no_of_users, 10) : null,
      minimum_order_amount ? parseFloat(minimum_order_amount) : null,
      discount ? parseFloat(discount) : null,
      discount_type || null,
      max_discount_amount ? parseFloat(max_discount_amount) : null,
      repeat_usage ? parseInt(repeat_usage, 10) : 0,
      no_of_repeat_usage ? parseInt(no_of_repeat_usage, 10) : null,
      image,
      typeof status !== 'undefined' ? parseInt(status, 10) : 1,
      is_cashback ? parseInt(is_cashback, 10) : 0,
      list_promocode ? parseInt(list_promocode, 10) : 1,
      is_specific_users ? parseInt(is_specific_users, 10) : 0,
      users_id || "",
      id
    ];

    await pool.query(query, params);

    res.json({ success: true, message: 'Promo Code updated successfully' });
  } catch (err) {
    console.error('updatePromoCode error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update promo code' });
  }
};

// PUT /api/admin/promo-codes/:id/status - Toggle promo code status
export const updatePromoCodeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (typeof status === 'undefined') {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    await pool.query('UPDATE promo_codes SET status = ? WHERE id = ?', [Number(status) ? 1 : 0, id]);

    res.json({ success: true, message: 'Promo Code status updated successfully' });
  } catch (err) {
    console.error('updatePromoCodeStatus error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update promo code status' });
  }
};

// DELETE /api/admin/promo-codes/:id - Delete promo code
export const deletePromoCode = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM promo_codes WHERE id = ?', [id]);

    res.json({ success: true, message: 'Promo Code deleted successfully' });
  } catch (err) {
    console.error('deletePromoCode error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete promo code' });
  }
};

// POST /api/promo-codes/validate - Validate promo code for customer
export const validatePromoCode = async (req, res) => {
  try {
    const { promo_code, amount } = req.body;
    const userId = req.user.id;

    if (!promo_code?.trim()) {
      return res.status(400).json({ success: false, message: 'Promo code is required' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM promo_codes WHERE promo_code = ? AND status = 1',
      [promo_code.trim()]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive promo code' });
    }

    const coupon = rows[0];
    const now = new Date();

    // Validate dates if set
    if (coupon.start_date) {
      const start = new Date(coupon.start_date);
      if (now < start) {
        return res.status(400).json({ success: false, message: 'This promo code is not active yet' });
      }
    }

    if (coupon.end_date) {
      const end = new Date(coupon.end_date);
      if (now > end) {
        return res.status(400).json({ success: false, message: 'This promo code has expired' });
      }
    }

    // Validate minimum order amount
    const orderAmount = parseFloat(amount) || 0;
    if (coupon.minimum_order_amount && orderAmount < coupon.minimum_order_amount) {
      return res.status(400).json({ 
        success: false, 
        message: `Minimum order amount of ₹${coupon.minimum_order_amount} is required to use this code` 
      });
    }

    // Validate specific users restriction
    if (coupon.is_specific_users === 1) {
      const allowedUsers = coupon.users_id ? coupon.users_id.split(',').map(id => id.trim()) : [];
      if (!allowedUsers.includes(String(userId))) {
        return res.status(400).json({ success: false, message: 'This promo code is not available for your account' });
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = (orderAmount * coupon.discount) / 100;
      if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
        discountAmount = coupon.max_discount_amount;
      }
    } else {
      discountAmount = coupon.discount;
      if (discountAmount > orderAmount) {
        discountAmount = orderAmount;
      }
    }

    res.json({
      success: true,
      message: 'Promo code applied successfully!',
      coupon: {
        id: coupon.id,
        promo_code: coupon.promo_code,
        discount: coupon.discount,
        discount_type: coupon.discount_type,
        is_cashback: coupon.is_cashback,
        message: coupon.message
      },
      discountAmount
    });

  } catch (err) {
    console.error('validatePromoCode error:', err.message);
    res.status(500).json({ success: false, message: 'Server error validating promo code' });
  }
};
