// routes/offers.js
import express from 'express';
import { protect, adminOnly } from '../middlewares/auth.js';
import {
  getOffers,
  getOfferById,
  createOffer,
  updateOffer,
  toggleOfferStatus,
  deleteOffer,
  getPublicOffers,
  getOfferSliders,
  createOfferSlider,
  deleteOfferSlider
} from '../controllers/offerController.js';

const router = express.Router();

// ── Public routes (no auth needed) ──────────────────────────────────────────
// GET /api/offers           → all active offers for homepage banners / offer page
router.get('/', getPublicOffers);

// ── Admin-only routes (require auth + admin role) ────────────────────────────
// GET /api/admin/offers           → all offers (including inactive)
// POST /api/admin/offers          → create offer
// PUT /api/admin/offers/:id       → update offer
// PATCH /api/admin/offers/:id/toggle → toggle active status
// DELETE /api/admin/offers/:id    → delete offer

router.get('/admin', protect, adminOnly, getOffers);
router.get('/admin/:id', protect, adminOnly, getOfferById);
router.post('/admin', protect, adminOnly, createOffer);
router.put('/admin/:id', protect, adminOnly, updateOffer);
router.patch('/admin/:id/toggle', protect, adminOnly, toggleOfferStatus);
router.delete('/admin/:id', protect, adminOnly, deleteOffer);

// Sliders endpoints (for /admin/offer-slider page)
router.get('/sliders', protect, adminOnly, getOfferSliders);
router.post('/sliders', protect, adminOnly, createOfferSlider);
router.delete('/sliders/:id', protect, adminOnly, deleteOfferSlider);

export default router;
