import express from 'express';
const router = express.Router();

import { getHomeProducts } from '../controllers/homeController.js';
import { getAllReviews } from '../controllers/reviewsController.js';
import { getAllBlogs } from '../controllers/blogsController.js';

router.get('/home-products', getHomeProducts);
router.get('/reviews', getAllReviews);
router.get('/blogs', getAllBlogs);

export default router;