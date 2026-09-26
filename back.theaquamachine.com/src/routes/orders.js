// routes/orders.js
import express from 'express';
import { protect, adminOnly } from '../middlewares/auth.js';
import {
  createOrder,
  createRazorpayOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getAllOrdersAdmin,
  getOrderTrackingAdmin,
  deleteOrderAdmin,
  getOrderByIdAdmin,
  updateOrderAdmin,
  verifyRazorpayPaymentAndCreateOrder,
  getInventoryReportAdmin,
  createPayuOrderHash,
  handlePayuCallback
} from '../controllers/orderController.js';
import { getPublicPaymentMethods } from '../controllers/paymentController.js';
import { logRazorpayPaymentCancelled } from '../controllers/paymentLogController.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────
// Customer Routes
// ─────────────────────────────────────────────────────────────────────
router.get('/payment-methods', protect, getPublicPaymentMethods);
router.post('/razorpay/create-order', protect, createRazorpayOrder);
router.post('/razorpay/verify', protect, verifyRazorpayPaymentAndCreateOrder);
router.post('/razorpay/log-cancelled', protect, logRazorpayPaymentCancelled);
router.post('/payu/hash', protect, createPayuOrderHash);
router.post('/payu/callback', handlePayuCallback);
router.post('/',      protect, createOrder);       // Place new order
router.get('/',       protect, getUserOrders);      // My orders
router.get('/:id',    protect, getOrderById);       // Single order details
router.put('/:id/cancel', protect, cancelOrder);   // Cancel my order

// ─────────────────────────────────────────────────────────────────────
// Admin Routes
// ─────────────────────────────────────────────────────────────────────
router.get('/admin/all',       protect, adminOnly, getAllOrdersAdmin);      // All orders + filters
router.get('/admin/inventory-report', protect, adminOnly, getInventoryReportAdmin); // Inventory report
router.put('/admin/:id/status', protect, adminOnly, updateOrderStatus);     // Update order status (simple)
router.get('/admin/tracking',   protect, adminOnly, getOrderTrackingAdmin); // Order tracking list
router.get('/admin/:id',        protect, adminOnly, getOrderByIdAdmin);      // Get single order with items for admin
router.put('/admin/:id',        protect, adminOnly, updateOrderAdmin);       // Update full order details for admin
router.delete('/admin/:id',    protect, adminOnly, deleteOrderAdmin);       // Delete order

export default router;
