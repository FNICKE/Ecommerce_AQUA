import pool from '../config/db.js';

export const getUserAddresses = async (req, res) => {
  try {
    const userId = req.user.id;

    const [addresses] = await pool.query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC',
      [userId]
    );

    res.json({ success: true, addresses });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      type = 'home',
      mobile,
      alternate_mobile,
      address,
      landmark,
      city,
      area,
      pincode,
      state,
      country = 'India',
      latitude,
      longitude,
      is_default = 0
    } = req.body;

    if (is_default) {
      await pool.query(
        'UPDATE addresses SET is_default = 0 WHERE user_id = ?',
        [userId]
      );
    }

    const [result] = await pool.query(
      `INSERT INTO addresses
      (user_id, name, type, mobile, alternate_mobile, address, landmark, city, area, pincode, state, country, latitude, longitude, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name,
        type,
        mobile,
        alternate_mobile || null,
        address,
        landmark || null,
        city,
        area,
        pincode,
        state,
        country,
        latitude || null,
        longitude || null,
        is_default
      ]
    );

    res.status(201).json({
      success: true,
      addressId: result.insertId
    });

  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const fields = req.body;

    if (fields.is_default) {
      await pool.query(
        'UPDATE addresses SET is_default = 0 WHERE user_id = ?',
        [userId]
      );
    }

    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(fields)) {
      updates.push(`${key} = ?`);
      values.push(value);
    }

    if (!updates.length)
      return res.status(400).json({ success: false, message: 'No fields to update' });

    values.push(id, userId);

    await pool.query(
      `UPDATE addresses SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    res.json({ success: true, message: 'Address updated' });

  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await pool.query(
      'DELETE FROM addresses WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({ success: true, message: 'Address deleted' });

  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await pool.query(
      'UPDATE addresses SET is_default = 0 WHERE user_id = ?',
      [userId]
    );

    await pool.query(
      'UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({ success: true, message: 'Default address updated' });

  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
