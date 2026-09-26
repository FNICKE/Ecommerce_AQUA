import express from 'express';
const router = express.Router();

import { 
  getAllFeatured, 
  createFeatured, 
  updateFeatured,
  deleteFeatured,
  reorderFeatured 
} from '../controllers/featuredController.js';

router.get('/', getAllFeatured);
router.post('/', createFeatured);
router.put('/:id', updateFeatured);
router.delete('/:id', deleteFeatured);
router.post('/reorder', reorderFeatured);

export default router;