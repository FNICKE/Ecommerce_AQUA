import express from 'express';
import { validatePromoCode } from '../controllers/promoCodeController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/validate', protect, validatePromoCode);

export default router;
