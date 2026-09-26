import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

export const register = async (req, res) => {
  try {
    const { username, email, mobile, password } = req.body;

    if (!username || !email || !mobile || !password) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? OR mobile = ?',
      [email, mobile]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (username, email, mobile, password, status) VALUES (?, ?, ?, ?, ?)',
      [username, email, mobile, hashedPassword, 1]
    );

    const token = jwt.sign(
      { id: result.insertId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      token,
      user: { id: result.insertId, username, email, mobile }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { emailOrMobile, password } = req.body;

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? OR mobile = ?',
      [emailOrMobile, emailOrMobile]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = rows[0];

    if (user.status === 0) {
      return res.status(401).json({ success: false, message: 'Your account is inactive. Please contact an administrator.' });
    }


    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

const token = jwt.sign(
  {
    id: user.id,
    company: user.company || null   // Include company in JWT payload
  },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN }
);

res.json({
  success: true,
  token,
  user: {
    id: user.id,
    username: user.username,
    email: user.email,
    mobile: user.mobile,
    company: user.company || null,   // Send company back to frontend
    role: user.role || 'basic'
  }
});
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
// controllers/authController.js
export const getMe = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, email, mobile, company, role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const adminResetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Find the admin user with matching email
    const [rows] = await pool.query(
      'SELECT id, company FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Admin account not found with the provided email' });
    }

    const user = rows[0];

    // Ensure the account belongs to an admin
    if (user.company !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied. Only admin passwords can be reset here.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and activate status
    await pool.query(
      'UPDATE users SET password = ?, status = 1 WHERE id = ?',
      [hashedPassword, user.id]
    );

    res.json({
      success: true,
      message: 'Admin password reset successfully! You can now log in.'
    });
  } catch (err) {
    console.error('Admin password reset error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const [rows] = await pool.query(
      'SELECT id, email, company FROM users WHERE email = ?',
      [email]
    );

    if (rows.length > 0 && rows[0].company !== 'ADMIN') {
      const token = jwt.sign(
        { id: rows[0].id, email: rows[0].email, purpose: 'password-reset' },
        process.env.JWT_SECRET,
        { expiresIn: '30m' }
      );
      const requestOrigin = req.get('origin');
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'https://theaquamachine.com',
        'https://www.theaquamachine.com'
      ];
      const frontendUrl = allowedOrigins.includes(requestOrigin)
        ? requestOrigin
        : (process.env.FRONTEND_URL || 'https://theaquamachine.com');
      await sendPasswordResetEmail(
        rows[0].email,
        `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`
      );
    }

    res.json({ success: true, message: 'If an account exists for this email, a reset link has been sent.' });
  } catch (err) {
    console.error('Password reset request error:', err);
    res.status(500).json({ success: false, message: 'Unable to send reset email right now' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Reset token and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.purpose !== 'password-reset') {
      return res.status(400).json({ success: false, message: 'Invalid reset token' });
    }

    const [users] = await pool.query(
      'SELECT id, company FROM users WHERE id = ? AND email = ?',
      [payload.id, payload.email]
    );
    if (users.length === 0 || users[0].company === 'ADMIN') {
      return res.status(400).json({ success: false, message: 'Invalid reset token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ?, status = 1 WHERE id = ?', [hashedPassword, payload.id]);
    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.status(400).json({ success: false, message: 'This reset link is invalid or has expired' });
    }
    console.error('Password reset error:', err);
    res.status(500).json({ success: false, message: 'Unable to reset password right now' });
  }
};
