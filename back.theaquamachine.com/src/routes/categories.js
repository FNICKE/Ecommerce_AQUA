// routes/categories.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect, adminOnly } from '../middlewares/auth.js';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  reorderCategories
} from '../controllers/categoryController.js';

const router = express.Router();

// ─── Multer configuration ────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const dir = path.join('public', 'uploads', 'categories', year, month);

    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (err) {
      console.error('Error creating categories upload directory:', err);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed (jpg, png, webp, gif)'), false);
    }
  }
});

// ─── Routes ──────────────────────────────────────────────────────────────

router.get('/', getAllCategories);                      // Public + admin list
router.get('/:id', getCategoryById);                    // Single category

// Admin only routes
router.post(
  '/',
  protect,
  adminOnly,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
  ]),
  createCategory
);

router.put(
  '/:id',
  protect,
  adminOnly,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
  ]),
  updateCategory
);

router.delete('/:id', protect, adminOnly, deleteCategory);
router.patch('/:id/toggle-status', protect, adminOnly, toggleCategoryStatus);
router.post('/reorder', protect, adminOnly, reorderCategories);

export default router;