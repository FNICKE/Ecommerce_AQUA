// ================================================
// src/middleware/upload.js
// ================================================

import multer from 'multer';
import path from 'path';

// Storage: save images in public/uploads/products/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/products/'); 
    // ⚠️ Make sure this folder exists manually
  },

  filename: (req, file, cb) => {
    const uniqueSuffix =
      Date.now() + '-' + Math.round(Math.random() * 1e9);

    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;

    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }

    cb(new Error('Only images allowed (jpg, jpeg, png, webp)'));
  }
});


// ✅ Single image upload middleware
export const uploadProductImage = upload.single('image');


// ✅ Optional: Multiple image upload (if needed later)
export const uploadMultipleProductImages = upload.array('images', 8);
