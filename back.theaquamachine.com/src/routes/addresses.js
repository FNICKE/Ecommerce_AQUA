// src/routes/addresses.js

import express from 'express';
import { protect } from '../middlewares/auth.js';
import {
  getUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} from '../controllers/addressController.js';

const router = express.Router();

router.get('/', protect, getUserAddresses);
router.post('/', protect, createAddress);
router.put('/:id', protect, updateAddress);
router.delete('/:id', protect, deleteAddress);
router.put('/:id/default', protect, setDefaultAddress);

export default router;
