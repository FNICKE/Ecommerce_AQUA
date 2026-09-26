// server.js
import 'dotenv/config'; // loads .env automatically in ESM
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import helmet from 'helmet';
import multer from 'multer';
import os from 'os';
import fs from 'fs';

import pool from './src/config/db.js';
import { ensurePaymentLogsTable } from './src/services/paymentLogService.js';
import { ensureReviewsAndBlogsTables } from './src/services/systemService.js';

// Route imports
import authRoutes from './src/routes/auth.js';
import categoryRoutes from './src/routes/categories.js';
import productRoutes from './src/routes/products.js';
import cartRoutes from './src/routes/cart.js';
import orderRoutes from './src/routes/orders.js';
import variantRoutes from './src/routes/variants.js';
import addressRoutes from './src/routes/addresses.js';
import userRoutes from './src/routes/users.js';
import configRoutes from './src/routes/config.js';
import mediaRoutes from './src/routes/mediaroutes.js';
import adminRoutes from './src/routes/admin.js';
import featuredRoutes from './src/routes/featured.js';
import homeRoutes from './src/routes/home.js';
import wishlistRoutes from './src/routes/wishlist.js';
import promoCodeRoutes from './src/routes/promoCodes.js';
import offerRoutes from './src/routes/offers.js';

import errorHandler from './src/middlewares/errorHandler.js';

const app = express();
app.set('trust proxy', 1);

// ─── Global Multer Setup (for image uploads in any route) ───────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'public', 'uploads', 'products'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only images (jpg, jpeg, png, webp) allowed!'));
  }
});

// Make multer available to routes if needed
app.use((req, res, next) => {
  req.upload = upload;
  next();
});

// ─── Middleware ──────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false })); // Security headers allowing cross-origin media loading

const frontendOrigins = [
    'https://theaquamachine.com',
  'https://www.theaquamachine.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174'
];

app.use(cors({
  origin: frontendOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev')); // Request logging
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files (fallback to checking both folders)
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── Routes ──────────────────────────────────────────────────────────────
app.get('/', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbError = null;
  try {
    const connection = await pool.getConnection();
    connection.release();
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'error';
    dbError = err.message;
  }

  let uploadsStatus = 'unknown';
  try {
    fs.accessSync(path.join(process.cwd(), 'public', 'uploads'));
    uploadsStatus = 'accessible';
  } catch (err) {
    try {
      fs.accessSync(path.join(process.cwd(), 'uploads'));
      uploadsStatus = 'accessible';
    } catch (err2) {
      uploadsStatus = 'error';
    }
  }

  const apis = [
    { name: 'Authentication API', path: '/api/auth' },
    { name: 'Categories API', path: '/api/categories' },
    { name: 'Products API', path: '/api/products' },
    { name: 'Cart API', path: '/api/cart' },
    { name: 'Orders API', path: '/api/orders' },
    { name: 'Variants API', path: '/api/variants' },
    { name: 'Addresses API', path: '/api/addresses' },
    { name: 'Users API', path: '/api/users' },
    { name: 'Config API', path: '/api/config' },
    { name: 'Media API', path: '/api/media' },
    { name: 'Wishlist API', path: '/api/wishlist' },
    { name: 'Promo Codes API', path: '/api/promo-codes' },
    { name: 'Offers API', path: '/api/offers' },
    { name: 'Featured Sections API', path: '/api/admin/featured-sections' },
    { name: 'Home Storefront API', path: '/api/home' },
    { name: 'Admin API', path: '/api/admin' }
  ];

  const overallSuccess = dbStatus === 'connected' && uploadsStatus === 'accessible';

  let responseText = '';
  
  if (dbStatus === 'connected') {
    responseText += `Database Connection: <span style="color: green;">CONNECTED</span><br>\n`;
  } else {
    responseText += `Database Connection: <span style="color: red;">DISCONNECTED (Error: ${dbError})</span><br>\n`;
  }

  if (uploadsStatus === 'accessible') {
    responseText += `Uploads Directory: <span style="color: green;">ACCESSIBLE</span><br>\n`;
  } else {
    responseText += `Uploads Directory: <span style="color: red;">INACCESSIBLE</span><br>\n`;
  }

  responseText += `<br>\nActive API Endpoints:<br>\n`;

  apis.forEach(api => {
    const statusText = dbStatus === 'connected' ? 'ACTIVE' : 'ERROR (Database Connection Failed)';
    const statusColor = dbStatus === 'connected' ? 'green' : 'red';
    responseText += `${api.name} (${api.path}) - <span style="color: ${statusColor};">${statusText}</span><br>\n`;
  });

  res.header('Content-Type', 'text/html');
  res.status(overallSuccess ? 200 : 500).send(responseText);
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/variants', variantRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/users', userRoutes);
app.use('/api/config', configRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/promo-codes', promoCodeRoutes);
app.use('/api/offers', offerRoutes);

// Featured & Home (specific before general admin)
app.use('/api/admin/featured-sections', featuredRoutes);
app.use('/api/home', homeRoutes);

// All admin routes
app.use('/api/admin', adminRoutes);

// Dynamic XML Sitemap for SEO crawlers
app.get('/sitemap.xml', async (req, res) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host').replace(/^api\./, '')}`;
    
    // Fetch products
    const [products] = await pool.query('SELECT id, date_added FROM products WHERE status = 1');
    // Fetch categories
    const [categories] = await pool.query('SELECT id FROM categories WHERE status = 1');
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    // Static Pages
    const staticPages = ['', '/products', '/about', '/contact', '/category'];
    staticPages.forEach(page => {
      xml += `  <url>\n`;
      xml += `    <loc>${frontendUrl}${page}</loc>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>${page === '' ? '1.0' : '0.8'}</priority>\n`;
      xml += `  </url>\n`;
    });
    
    // Categories
    categories.forEach(cat => {
      xml += `  <url>\n`;
      xml += `    <loc>${frontendUrl}/category/${cat.id}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    });
    
    // Products
    products.forEach(prod => {
      const date = prod.date_added ? new Date(prod.date_added).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      xml += `  <url>\n`;
      xml += `    <loc>${frontendUrl}/product/${prod.id}</loc>\n`;
      xml += `    <lastmod>${date}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.9</priority>\n`;
      xml += `  </url>\n`;
    });
    
    xml += `</urlset>`;
    
    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// Global error handler (must be last)
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Show local network IP for testing on phone/other devices
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`Network URL: http://${iface.address}:${PORT}`);
      }
    }
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    pool.end().then(() => {
      console.log('Database pool closed.');
      process.exit(0);
    });
  });
});

// Handle uncaught exceptions / rejections
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

// Database connection check on startup
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    await ensurePaymentLogsTable();
    console.log('✅ Razorpay payment logs table ready');
    await ensureReviewsAndBlogsTables();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
})();