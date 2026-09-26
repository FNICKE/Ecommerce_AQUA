// controllers/mediacontroller.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pool from '../config/db.js';

// ───────────────────────────────────────────────
// Multer: Preserve ORIGINAL filename + check for conflicts
// ───────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const dir = path.join('public', 'uploads', 'media', year, month);

    // Create folder if it doesn't exist
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (err) {
      console.error('Error creating directory:', err);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const originalName = file.originalname;
    const ext = path.extname(originalName);
    let baseName = path.basename(originalName, ext);
    let filename = originalName;
    let counter = 1;

    const year = new Date().getFullYear().toString();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    // Check if file already exists in destination → append (1), (2), etc.
    while (true) {
      const fullPath = path.join('public', 'uploads', 'media', year, month, filename);

      if (fs.existsSync(fullPath)) {
        filename = `${baseName} (${counter})${ext}`;
        counter++;
      } else {
        break;
      }
    }

    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
    'image/webp', 'image/bmp', 'image/svg+xml', 'image/tiff',
    'image/avif', 'image/x-png', 'image/pjpeg',
    'application/pdf'
  ];
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.tiff', '.avif', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();

  // Accept if mimetype matches OR if it's a generic type but extension is allowed
  const isAllowed = 
    allowedMimeTypes.includes(file.mimetype) ||
    file.mimetype.startsWith('image/') ||
    (file.mimetype === 'application/octet-stream' && allowedExts.includes(ext));

  if (isAllowed) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed: JPG, PNG, GIF, WEBP, BMP, SVG, PDF`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 12 * 1024 * 1024 } // 12 MB
});

// Helper: human-readable file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ───────────────────────────────────────────────
// GET /api/media - List all media
// ───────────────────────────────────────────────
async function getAllMedia(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id, title, name, extension, type, sub_directory, size, date_created
      FROM media
      ORDER BY date_created DESC
      LIMIT 200
    `);

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'avif'];
    const items = rows.map(row => {
      const isExternal = row.sub_directory && (row.sub_directory.startsWith('http://') || row.sub_directory.startsWith('https://'));
      const cleanPath = isExternal ? row.sub_directory : row.sub_directory.replace(/^public[/\\]/, '');
      const fileUrl = isExternal ? cleanPath : `${baseUrl}/${cleanPath}${row.name}`;
      const ext = row.extension?.toLowerCase() || '';
      const isImage = row.type.startsWith('image/') || row.type === 'image' || imageExtensions.includes(ext);
      return {
        id: row.id,
        name: row.name,
        title: row.title || row.name,
        extension: row.extension.toUpperCase(),
        type: isImage ? (row.type.startsWith('image/') ? row.type : `image/${ext}`) : row.type,
        path: cleanPath,
        size: row.size,
        url: fileUrl,
        thumbnail: isImage ? fileUrl : '/images/file-placeholder.png'
      };
    });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (err) {
    console.error('Error fetching media:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch media' });
  }
}

// ───────────────────────────────────────────────
// POST /api/media/upload - Upload files
// ───────────────────────────────────────────────
async function uploadMedia(req, res) {
  try {
    if (!req.files?.length) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const inserted = [];

    for (const file of req.files) {
      const dirParts = file.destination.split(/[\\/]/);
      const yearMonth = dirParts.slice(-2).join('/');
      const subDir = `uploads/media/${yearMonth}/`;

      const humanSize = formatFileSize(file.size);

      const [result] = await pool.query(
        `INSERT INTO media 
         (title, name, extension, type, sub_directory, size)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          file.originalname,           // original name from device
          file.filename,               // final saved name (with possible (1), etc.)
          path.extname(file.originalname).slice(1).toLowerCase(),
          file.mimetype,
          subDir,
          humanSize
        ]
      );

      inserted.push({
        id: result.insertId,
        name: file.filename,
        originalName: file.originalname,
        url: `/${subDir}${file.filename}`
      });
    }

    res.status(201).json({
      success: true,
      message: `Uploaded ${inserted.length} file(s) successfully`,
      data: inserted
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: err.message || 'Upload failed' });
  }
}

// ───────────────────────────────────────────────
// PUT /api/media/:id - Update media title and/or image
// ───────────────────────────────────────────────
async function updateMedia(req, res) {
  const { id } = req.params;
  const { title } = req.body;

  try {
    if (!title?.trim() && !req.file) {
      return res.status(400).json({ success: false, message: 'Title or image is required' });
    }

    const [[row]] = await pool.query(
      'SELECT id, name, sub_directory FROM media WHERE id = ?',
      [id]
    );

    if (!row) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    let updateQuery = 'UPDATE media SET';
    const updateValues = [];
    const updateFields = [];

    // Update title if provided
    if (title?.trim()) {
      updateFields.push('title = ?');
      updateValues.push(title.trim());
    }

    // Handle file upload - replace old file
    let newImagePath = null;
    if (req.file) {
      // Delete old file from filesystem
      const oldFilePath = path.join(process.cwd(), 'public', row.sub_directory, row.name);
      try {
        await fs.promises.unlink(oldFilePath);
      } catch (fsErr) {
        if (fsErr.code !== 'ENOENT') {
          console.warn('File delete warning:', fsErr.message);
        }
      }

      // Update file info in database
      const dirParts = req.file.destination.split(/[\\/]/);
      const yearMonth = dirParts.slice(-2).join('/');
      const subDir = `uploads/media/${yearMonth}/`;
      const humanSize = formatFileSize(req.file.size);

      updateFields.push('name = ?', 'sub_directory = ?', 'extension = ?', 'type = ?', 'size = ?');
      updateValues.push(
        req.file.filename,
        subDir,
        path.extname(req.file.originalname).slice(1).toLowerCase(),
        req.file.mimetype,
        humanSize
      );

      newImagePath = `/${subDir}${req.file.filename}`;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    updateValues.push(id);
    await pool.query(
      `UPDATE media SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ 
      success: true, 
      message: 'Media updated successfully',
      data: { 
        id, 
        title: title?.trim() || row.title,
        imageUrl: newImagePath
      }
    });
  } catch (err) {
    console.error('Update media error:', err);
    res.status(500).json({ success: false, message: 'Failed to update media' });
  }
}

// ───────────────────────────────────────────────
// DELETE /api/media/:id
// ───────────────────────────────────────────────
async function deleteMedia(req, res) {
  const { id } = req.params;

  try {
    const [[row]] = await pool.query(
      'SELECT name, sub_directory FROM media WHERE id = ?',
      [id]
    );

    if (!row) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const filePath = path.join(process.cwd(), 'public', row.sub_directory, row.name);

    try {
      await fs.promises.unlink(filePath);
    } catch (fsErr) {
      if (fsErr.code !== 'ENOENT') {
        console.warn('File delete warning:', fsErr.message);
      }
    }

    await pool.query('DELETE FROM media WHERE id = ?', [id]);

    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
}

export {
  getAllMedia,
  uploadMedia,
  updateMedia,
  deleteMedia,
  upload
};