// src/routes/auth.js
import express from 'express';
import { protect } from '../middlewares/auth.js';
import {
  register,
  login,
  getMe,
  adminResetPassword,
  requestPasswordReset,
  resetPassword,
} from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/admin/reset-password', adminResetPassword);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

// Protected route – get current user
router.get('/me', protect, getMe);

export default router;