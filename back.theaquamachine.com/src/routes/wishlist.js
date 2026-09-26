import express from 'express';
import { protect } from '../middlewares/auth.js';
import { getWishlist, toggleWishlist } from '../controllers/wishlistController.js';

const router = express.Router();

router.get('/', protect, getWishlist);
router.post('/toggle', protect, toggleWishlist);

export default router;
