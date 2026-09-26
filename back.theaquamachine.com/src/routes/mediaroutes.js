// routes/mediaroutes.js
import express from 'express';
const router = express.Router();

import {
  getAllMedia,
  uploadMedia,
  updateMedia,
  deleteMedia,
  upload
} from '../controllers/mediacontroller.js';

router.get('/', getAllMedia);
router.post('/upload', upload.array('files', 12), uploadMedia);
router.post('/upload-single', upload.single('file'), uploadMedia);
router.put('/:id', upload.single('file'), updateMedia);
router.delete('/:id', deleteMedia);

export default router;