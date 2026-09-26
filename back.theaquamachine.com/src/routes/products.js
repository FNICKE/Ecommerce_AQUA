// routes/products.js - ES Module version
import express from 'express';
import { 
  getAllProducts, 
  createProduct, 
  getProductById, 
  updateProduct, 
  deleteProduct, 
  toggleProductStatus,
  getProductSearchSuggestions
} from '../controllers/productController.js';

const router = express.Router();

// NOTE: multer is handled INSIDE createProduct and updateProduct controllers
// (they use upload.single / upload.fields internally as middleware arrays)
// Do NOT add route-level multer here — it would conflict.

router.get('/', getAllProducts);
router.get('/search', getProductSearchSuggestions);
router.get('/:id', getProductById);
router.post('/', createProduct);        // createProduct = [upload.single('image'), handler]
router.put('/:id', updateProduct);      // updateProduct = [upload.fields([...]), handler]
router.delete('/:id', deleteProduct);
router.patch('/:id/status', toggleProductStatus);

export default router;