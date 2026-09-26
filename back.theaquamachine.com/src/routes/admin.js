// routes/admin.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { protect, adminOnly } from '../middlewares/auth.js';
import { getAllReviews, createReview, deleteReview } from '../controllers/reviewsController.js';
import { getAllBlogs, createBlog, deleteBlog } from '../controllers/blogsController.js';

import {
  getAdminStats,
  getOrderOutlines,
  getRecentOrders,
  getSalesTrend,

  // Category CRUD
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,


  // Attribute CRUD
  getAttributes,
  createAttribute,
  updateAttribute,
  deleteAttribute,
  getAttributeValues,
  addAttributeValue,
  deleteAttributeValue,
  updateAttributeValueSwatch,
  uploadAttributeSwatch,

  // Tax CRUD
  getTaxes,
  createTax,
  updateTax,
  deleteTax,

  // FAQ CRUD
  getProductFAQs,
  createProductFAQ,
  updateProductFAQ,
  deleteProductFAQ,

  // POS
  createPOSOrder,

  // Product order
  updateProductOrder,

  // Chat / Messages
  getChatUsers,
  getChatMessages,
  sendChatMessage,
  getUnreadCount,

  // Sliders Settings & Management
  getSliderCount,
  updateSliderCount,
  getAdminSliders,
  saveSliders,
  updateSlider,
  deleteSlider,

  // Products Stock Management
  getProductsWithStock,
  updateVariantStock,

  // System Users
  getSystemUsers,
  createSystemUser,
  updateSystemUser,
  updateSystemUserStatus,
  deleteSystemUser,
  uploadSystemUserAvatar
} from '../controllers/adminController.js';

import {
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  updatePromoCodeStatus,
  deletePromoCode
} from '../controllers/promoCodeController.js';

import { getSystemNotificationsAdmin } from '../controllers/systemNotificationController.js';
import {
  getAdminPaymentMethods,
  updateAdminPaymentMethods,
  testRazorpayConnection
} from '../controllers/paymentController.js';
import { getAdminRazorpayPaymentLogs, getAdminPayuPaymentLogs } from '../controllers/paymentLogController.js';
import {
  getBrandsAdmin,
  createBrandAdmin,
  updateBrandAdmin,
  deleteBrandAdmin
} from '../controllers/brandsController.js';
import {
  createProduct,
  bulkUploadProductsAdmin,
  downloadBulkProductSampleAdmin,
  downloadBulkProductInstructionsAdmin,
  downloadBulkProductDataAdmin
} from '../controllers/productController.js';

const router = express.Router();

// Multer setup – same structure as categories/media
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const dir = path.join('public', 'uploads', 'admin', year, month);

    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (err) {
      console.error('Error creating admin upload directory:', err);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${unique}${path.extname(file.originalname).toLowerCase()}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, WEBP files allowed'), false);
    }
  }
});

// Dashboard Routes
router.get('/stats', protect, adminOnly, getAdminStats);
router.get('/orders/outlines', protect, adminOnly, getOrderOutlines);
router.get('/orders/recent', protect, adminOnly, getRecentOrders);
router.get('/sales-trend', protect, adminOnly, getSalesTrend);

// Categories (full CRUD)
router.get('/categories', protect, adminOnly, getAllCategories);
router.get('/categories/:id', protect, adminOnly, getCategoryById);

router.post(
  '/categories',
  protect,
  adminOnly,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
  ]),
  createCategory
);

router.put(
  '/categories/:id',
  protect,
  adminOnly,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
  ]),
  updateCategory
);

router.delete('/categories/:id', protect, adminOnly, deleteCategory);

// ───────────────────────────────────────────────
// Products
// ───────────────────────────────────────────────
router.post(
  '/products',
  protect,
  adminOnly,
  createProduct
);
router.post('/products/reorder', protect, adminOnly, updateProductOrder);

const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const validMime = [
      'text/csv',
      'application/csv',
      'application/vnd.ms-excel',
      'text/plain'
    ];
    const looksCsv = file.originalname?.toLowerCase().endsWith('.csv');
    if (looksCsv || validMime.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Only CSV files are allowed'), false);
  }
});

// ───────────────────────────────────────────────
// Brands
// ───────────────────────────────────────────────
router.get('/brands', protect, adminOnly, getBrandsAdmin);
router.post(
  '/brands',
  protect,
  adminOnly,
  upload.single('image'),
  createBrandAdmin
);
router.put(
  '/brands/:id',
  protect,
  adminOnly,
  upload.single('image'),
  updateBrandAdmin
);
router.delete('/brands/:id', protect, adminOnly, deleteBrandAdmin);

// ───────────────────────────────────────────────
// Attributes, Taxes, FAQs, POS
// ───────────────────────────────────────────────
// ───────────────────────────────────────────────
// Attributes (full CRUD + values)
// ───────────────────────────────────────────────
router.get('/attributes', protect, adminOnly, getAttributes);
router.post('/attributes', protect, adminOnly, createAttribute);
router.put('/attributes/:id', protect, adminOnly, updateAttribute);
router.delete('/attributes/:id', protect, adminOnly, deleteAttribute);

// Attribute values
router.get('/attributes/:attributeId/values', protect, adminOnly, getAttributeValues);
router.post('/attributes/:attributeId/values', protect, adminOnly, addAttributeValue);
router.delete('/attribute-values/:valueId', protect, adminOnly, deleteAttributeValue);
router.put('/attribute-values/:valueId/swatch', protect, adminOnly, updateAttributeValueSwatch);
router.post('/upload-attribute-swatch', protect, adminOnly, upload.single('image'), uploadAttributeSwatch);
// Taxes
router.get('/taxes', protect, adminOnly, getTaxes);
router.post('/taxes', protect, adminOnly, createTax);
router.put('/taxes/:id', protect, adminOnly, updateTax);
router.delete('/taxes/:id', protect, adminOnly, deleteTax);
// Product FAQs
router.get('/products-faqs', protect, adminOnly, getProductFAQs);
router.post('/products/:productId/faqs', protect, adminOnly, createProductFAQ);
router.put('/products-faqs/:id', protect, adminOnly, updateProductFAQ);
router.delete('/products-faqs/:id', protect, adminOnly, deleteProductFAQ);

router.post('/pos/orders', protect, adminOnly, createPOSOrder);

// ───────────────────────────────────────────────
// Chat Routes
// ───────────────────────────────────────────────
router.get('/chat/users', protect, adminOnly, getChatUsers);
router.get('/chat/unread', protect, adminOnly, getUnreadCount);
router.get('/chat/:userId/messages', protect, adminOnly, getChatMessages);
router.post('/chat/:userId/messages', protect, adminOnly, sendChatMessage);

// System notifications
router.get('/system-notifications', protect, adminOnly, getSystemNotificationsAdmin);

// Slider count & sliders management
router.get('/settings/slider-count', protect, adminOnly, getSliderCount);
router.put('/settings/slider-count', protect, adminOnly, updateSliderCount);
router.get('/payment-methods', protect, adminOnly, getAdminPaymentMethods);
router.put('/payment-methods', protect, adminOnly, updateAdminPaymentMethods);
router.post('/payment-methods/test-razorpay', protect, adminOnly, testRazorpayConnection);
router.get('/razorpay-payment-logs', protect, adminOnly, getAdminRazorpayPaymentLogs);
router.get('/payu-payment-logs', protect, adminOnly, getAdminPayuPaymentLogs);
router.get('/sliders', protect, adminOnly, getAdminSliders);
router.post('/sliders', protect, adminOnly, saveSliders);
router.put('/sliders/:id', protect, adminOnly, updateSlider);
router.delete('/sliders/:id', protect, adminOnly, deleteSlider);

// Products Stock Management
router.get('/products-stock', protect, adminOnly, getProductsWithStock);
router.put('/variants/:variantId/stock', protect, adminOnly, updateVariantStock);

// System Users management
router.get('/system-users', protect, adminOnly, getSystemUsers);
router.post('/system-users', protect, adminOnly, createSystemUser);
router.put('/system-users/:userId', protect, adminOnly, updateSystemUser);
router.put('/system-users/:userId/status', protect, adminOnly, updateSystemUserStatus);
router.delete('/system-users/:userId', protect, adminOnly, deleteSystemUser);
router.post('/upload-system-user-avatar', protect, adminOnly, upload.single('image'), uploadSystemUserAvatar);

// Promo Codes management
router.get('/promo-codes', protect, adminOnly, getPromoCodes);
router.post('/promo-codes', protect, adminOnly, upload.single('image'), createPromoCode);
router.put('/promo-codes/:id', protect, adminOnly, upload.single('image'), updatePromoCode);
router.put('/promo-codes/:id/status', protect, adminOnly, updatePromoCodeStatus);
router.delete('/promo-codes/:id', protect, adminOnly, deletePromoCode);

router.get('/bulk-upload/sample', protect, adminOnly, downloadBulkProductSampleAdmin);
router.get('/bulk-upload/instructions', protect, adminOnly, downloadBulkProductInstructionsAdmin);
router.get('/bulk-upload/data', protect, adminOnly, downloadBulkProductDataAdmin);
router.post('/bulk-upload', protect, adminOnly, csvUpload.single('file'), bulkUploadProductsAdmin);

// Reviews & Blogs Management
router.get('/reviews', protect, adminOnly, getAllReviews);
router.post('/reviews', protect, adminOnly, upload.single('image'), createReview);
router.delete('/reviews/:id', protect, adminOnly, deleteReview);

router.get('/blogs', protect, adminOnly, getAllBlogs);
router.post('/blogs', protect, adminOnly, createBlog);
router.delete('/blogs/:id', protect, adminOnly, deleteBlog);

export default router;
