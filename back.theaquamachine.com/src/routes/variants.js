// routes/variants.js
import express from 'express';
import { protect, adminOnly } from '../middlewares/auth.js';
import {
  getVariantsByProduct,
  createVariant,
  updateVariant,
  deleteVariant,
  getProductsForVariantAdmin,
  bulkUpsertWeightVariants,
  hardDeleteVariant
} from '../controllers/variantController.js';

const router = express.Router();

// ─── Public / storefront ─────────────────────────────────────────────────────
router.get('/product/:productId', getVariantsByProduct);

// ─── Admin – products list (for weight variant manager) ──────────────────────
router.get('/admin/products-list', protect, adminOnly, getProductsForVariantAdmin);

// ─── Admin – bulk upsert weight variants ─────────────────────────────────────
router.post('/admin/bulk-weight', protect, adminOnly, bulkUpsertWeightVariants);

// ─── Admin – hard delete a variant ───────────────────────────────────────────
router.delete('/admin/:id', protect, adminOnly, hardDeleteVariant);

// ─── Generic CRUD ─────────────────────────────────────────────────────────────
router.post('/', protect, adminOnly, createVariant);
router.put('/:id', protect, adminOnly, updateVariant);
router.delete('/:id', protect, adminOnly, deleteVariant);

export default router;
