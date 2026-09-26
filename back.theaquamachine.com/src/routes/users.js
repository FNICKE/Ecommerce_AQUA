// ================================================
// src/routes/users.js
// ================================================

import express from 'express';
import pool from '../config/db.js';
import { protect, adminOnly } from '../middlewares/auth.js';

const router = express.Router();

// ================================================
// GET /me - Get current logged-in user's data
// ================================================
router.get('/me', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      'SELECT id, username, email, mobile, company FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error('Error fetching current user:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ================================================
// GET all users - ADMIN ONLY
// ================================================
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, email, mobile, company FROM users ORDER BY id DESC'
    );

    res.json({ success: true, count: users.length, users });
  } catch (err) {
    console.error('Error fetching all users:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ================================================
// GET single user - own profile or admin view
// ================================================
router.get('/:id', protect, async (req, res) => {
  try {
    const requestedId = parseInt(req.params.id);
    const currentUserId = req.user.id;

    const [rows] = await pool.query(
      'SELECT id, username, email, mobile, company FROM users WHERE id = ?',
      [requestedId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = rows[0];

    // Allow if: own profile OR admin
    if (currentUserId !== requestedId && req.user.company !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized - you can only view your own profile'
      });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ================================================
// PUT /update - Update own profile (logged-in user only)
// ================================================
router.put('/update', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, mobile } = req.body;

    if (!username || !email || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and mobile are required'
      });
    }

    // Check uniqueness (exclude self)
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE (email = ? OR mobile = ?) AND id != ?',
      [email, mobile, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email or mobile is already in use by another account'
      });
    }

    // Update
    await pool.query(
      'UPDATE users SET username = ?, email = ?, mobile = ? WHERE id = ?',
      [username, email, mobile, userId]
    );

    // Return updated data
    const [updated] = await pool.query(
      'SELECT id, username, email, mobile, company FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updated[0]
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error while updating profile'
    });
  }
});

export default router;