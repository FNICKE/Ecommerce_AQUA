// routes/config.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import nodemailer from 'nodemailer';
import pool from '../config/db.js';
import { protect, adminOnly } from '../middlewares/auth.js';
import { ensureEmailTemplatesTable, ensureEmailLogsTable } from '../services/emailService.js';
import { ensurePoliciesTable } from '../services/policyService.js';

const router = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    if (
      allowed.test(path.extname(file.originalname).toLowerCase()) &&
      allowed.test(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed: jpg, jpeg, png, webp, gif'));
    }
  },
});

// ────────────────────────────────────────────────
// GET /api/config/public - Public site settings (flattened)
// ────────────────────────────────────────────────
router.get('/public', async (req, res) => {
  try {
    const PUBLIC_KEYS = [
      // navbar / brand
      'site_name',
      'site_title',
      'logo',
      'favicon',
      'site_title_image',

      // footer
      'footer_text',
      'footer_description',
      'footer_quick_links',
      'footer_support_links',
      // social links
      'social_facebook',
      'social_instagram',
      'social_whatsapp',

      // contact (used by Footer + Contact page)
      'contact_phone',
      'contact_email',
      'contact_address',
      'contact_intro_text',
      'contact_areas_we_deliver',
      'contact_delivery_timings',
      'contact_business_hours_mon_sat',
      'contact_business_hours_sunday',
      'contact_response_time',

      // contact (bottom headquarters section)
      'contact_headquarters_title',
      'contact_headquarters_description',
      'contact_headquarters_address',
      'contact_website',

      // about us
      'about_heritage_title',
      'about_heritage_p1',
      'about_heritage_p2',
      'about_heritage_label1_val',
      'about_heritage_label1_txt',
      'about_heritage_label2_val',
      'about_heritage_label2_txt',
      'about_heritage_image1',
      'about_heritage_image2',
      'about_promise_title',
      'about_promise1_title',
      'about_promise1_desc',
      'about_promise2_title',
      'about_promise2_desc',
      'about_promise3_title',
      'about_promise3_desc',
      'about_why_title1',
      'about_why_desc1',
      'about_why_title2',
      'about_why_desc2',
      'about_why_title3',
      'about_why_desc3',
      'about_why_title4',
      'about_why_desc4',

      // privacy & terms & policies
      'privacy_policy',
      'terms_conditions',
      'return_policy',
      'shipping_policy',

      // meta tags
      'meta_keywords',
      'meta_description',

      // map iframe
      'map_iframe',

      // themes & colors
      'theme_classic_primary_color',
      'theme_classic_secondary_color',
      'theme_classic_font_color',
      'theme_color',

      // social extra
      'social_twitter',
      'social_youtube',

      // app download section
      'app_download_enabled',
      'app_download_title',
      'app_download_tagline',
      'app_download_description',
      'app_download_promo_header',
      'app_download_playstore_url',
      'app_download_applestore_url',

      // benefits/features section
      'feature_shipping_enabled',
      'feature_shipping_title',
      'feature_shipping_description',
      'feature_returns_enabled',
      'feature_returns_title',
      'feature_returns_description',
      'feature_support_enabled',
      'feature_support_title',
      'feature_support_description',
      'feature_safety_enabled',
      'feature_safety_title',
      'feature_safety_description'
    ];

    const [rows] = await pool.query(
      `SELECT variable, value FROM settings WHERE variable IN (${PUBLIC_KEYS.map(() => '?').join(',')})`,
      PUBLIC_KEYS
    );

    const settings = {
      site_title: 'Store',
      site_name: 'Store',
      logo_url: '',
      favicon_url: '',
      site_title_image: '',

      footer_text: `© {year} Store. All rights reserved.`,
      footer_description: 'Welcome to our online store. We are your premier destination for high-quality products.',
      footer_quick_links: JSON.stringify([
        { text: 'Collections', url: '/category' },
        { text: 'Products Catalog', url: '/products' },
        { text: 'About Our Brand', url: '/about' },
        { text: 'Contact Us', url: '/contact' }
      ]),
      footer_support_links: JSON.stringify([
        { text: 'Track Order', url: '/my-orders' },
        { text: 'Privacy Policy', url: '/privacy' },
        { text: 'Terms of Service', url: '/terms' },
        { text: 'Return & Refund Policy', url: '/return-policy' },
        { text: 'Shipping Policy', url: '/shipping-policy' }
      ]),
      social_facebook: '',
      social_instagram: '',
      social_whatsapp: '8454064310',

      contact_phone: '8454064310',
      contact_email: 'aquamachine2426@gmail.com',
      contact_address: 'Office no.1, first floor, near D-Mart, Sector 5, New Panvel East, Panvel, Maharashtra 410206',

      contact_intro_text:
        'For any kind of queries related to products, orders or services feel free to contact us on our official email address or phone number as given below :',
      contact_areas_we_deliver: '',
      contact_delivery_timings: '',
      contact_business_hours_mon_sat: 'Mon - Sat',
      contact_business_hours_sunday: 'Sunday',
      contact_response_time: 'Response time: Within 24 hours',

      contact_headquarters_title: 'Headquarters',
      contact_headquarters_description:
        'Visit our office to explore our wide collection of fish food, filtration units, and other premium aquarium supplies.',
      contact_headquarters_address:
        'Office no.1, first floor, near D-Mart, Sector 5, New Panvel East, Panvel, Maharashtra 410206',
      contact_website: 'theaquamachine.com',

      // About Us Fallbacks
      about_heritage_title: 'A Legacy of Passion for Aquariums',
      about_heritage_p1: 'At AQUA MACHINE, we are dedicated to providing the ultimate experience for aquarium enthusiasts. We offer a wide range of premium fish foods, filtration systems, and other essential resources to keep your aquatic life thriving and healthy.',
      about_heritage_p2: 'Whether you are setting up your first home aquarium or maintaining a complex aquatic ecosystem, we provide high-quality, reliable products and expert guidance. Every product in our inventory is carefully chosen to ensure optimal performance and safety for your marine and freshwater pets.',
      about_heritage_label1_val: '100%',
      about_heritage_label1_txt: 'Premium Quality',
      about_heritage_label2_val: '24/7',
      about_heritage_label2_txt: 'Support',
      about_heritage_image1: '',
      about_heritage_image2: '',
      
      about_promise_title: 'The AQUA MACHINE Promise',
      
      about_promise1_title: 'Premium Nutrition',
      about_promise1_desc: 'We supply top-grade fish foods containing essential nutrients for all kinds of freshwater and marine species.',
      about_promise2_title: 'Advanced Filtration',
      about_promise2_desc: 'Our advanced filtration products ensure crystal-clear water and a safe, balanced ecosystem for your fish.',
      about_promise3_title: 'Complete Support',
      about_promise3_desc: 'From tanks to accessories, we provide all the resources and guidance required to maintain a beautiful aquarium.',
      
      about_why_title1: 'Quality Products',
      about_why_desc1: 'Curated aquarium supplies and fish food',
      about_why_title2: 'Expert Guidance',
      about_why_desc2: 'Dedicated support for all hobbyists',
      about_why_title3: 'Fast Delivery',
      about_why_desc3: 'Prompt shipping across India',
      about_why_title4: 'Secure Shopping',
      about_why_desc4: '100% safe checkout and payment',

      // Privacy Policy, Terms, Return & Shipping Fallbacks
      privacy_policy: `<h3>Privacy policy</h3><p>Customers ACCESSING, BROWSING OR OTHERWISE USING THE WEBSITE indicates user is in AGREEMENT with all the terms and conditions mentioned henceforth. User is requested to READ terms and conditions CAREFULLY BEFORE PROCEEDING FURTHER.</p>`,
      terms_conditions: `<h3>Terms and conditions</h3><p>Welcome to our store. By visiting or ordering from our website, you agree to the terms and conditions outlined herein.</p>`,
      return_policy: `<h3>Return & Refund Policy</h3><p>We have a 7-day return policy. If you receive a damaged or defective product, please contact our support team within 48 hours of delivery.</p>`,
      shipping_policy: `<h3>Shipping Policy</h3><p>Standard delivery takes 3 to 7 business days across India. Live tracking updates are provided via email and SMS upon dispatch.</p>`,
      meta_keywords: '',
      meta_description: '',
      theme_classic_primary_color: '',
      theme_classic_secondary_color: '',
      theme_classic_font_color: '',
      theme_color: 'default',

      social_twitter: '',
      social_youtube: '',

      app_download_enabled: '0',
      app_download_title: 'AQUA MACHINE Mobile App',
      app_download_tagline: 'Premium Aquarium Supplies at your fingertips',
      app_download_description: 'Download our official mobile app to browse, order, and track your premium aquarium filters, fish foods, and accessories on the go.',
      app_download_promo_header: 'Get 10% OFF on your first app purchase!',
      app_download_playstore_url: 'https://play.google.com/',
      app_download_applestore_url: 'https://www.apple.com/in/app-store/',

      feature_shipping_enabled: '1',
      feature_shipping_title: 'Free Shipping',
      feature_shipping_description: 'Free Shipping at your door step.',
      feature_returns_enabled: '1',
      feature_returns_title: 'Free Returns',
      feature_returns_description: 'Free return if products are damaged.',
      feature_support_enabled: '1',
      feature_support_title: 'Support 24/7',
      feature_support_description: '24/7 and 365 days support is available.',
      feature_safety_enabled: '1',
      feature_safety_title: '100% Safe & Secure',
      feature_safety_description: '100% safe & secure.'
    };

    rows.forEach((row) => {
      if (!row?.variable) return;
      if (row.variable === 'logo') {
        settings.logo_url = row.value || settings.logo_url;
      } else if (row.variable === 'favicon') {
        settings.favicon_url = row.value || settings.favicon_url;
      } else {
        settings[row.variable] = row.value ?? settings[row.variable];
      }
    });

    const year = new Date().getFullYear();
    res.json({
      success: true,
      site_name: settings.site_name,
      site_title: settings.site_title,
      logo_url: settings.logo_url,
      favicon_url: settings.favicon_url,
      site_title_image: settings.site_title_image,

      footer_text: String(settings.footer_text || '').replace('{year}', year),
      footer_description: settings.footer_description,
      footer_quick_links: (() => { try { return JSON.parse(settings.footer_quick_links); } catch { return [{ text: 'Aquarium Collections', url: '/category' }, { text: 'Products Catalog', url: '/products' }, { text: 'About Our Brand', url: '/about' }, { text: 'Contact Us', url: '/contact' }]; } })(),
      footer_support_links: (() => {
        try {
          const parsed = JSON.parse(settings.footer_support_links);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const hasReturn = parsed.some(l => l.url === '/return-policy' || l.text?.toLowerCase().includes('return'));
            const hasShipping = parsed.some(l => l.url === '/shipping-policy' || l.text?.toLowerCase().includes('shipping'));
            const list = [...parsed];
            if (!hasReturn) list.push({ text: 'Return & Refund Policy', url: '/return-policy' });
            if (!hasShipping) list.push({ text: 'Shipping Policy', url: '/shipping-policy' });
            return list;
          }
        } catch { }
        return [
          { text: 'Track Order', url: '/my-orders' },
          { text: 'Privacy Policy', url: '/privacy' },
          { text: 'Terms of Service', url: '/terms' },
          { text: 'Return & Refund Policy', url: '/return-policy' },
          { text: 'Shipping Policy', url: '/shipping-policy' }
        ];
      })(),
      social_facebook: settings.social_facebook || '',
      social_instagram: settings.social_instagram || '',
      social_whatsapp: settings.social_whatsapp || '8454064310',

      contact_info: {
        phone: settings.contact_phone,
        email: settings.contact_email,
        address: settings.contact_address,
      },
      contact_page: {
        intro_text: settings.contact_intro_text,
        areas_we_deliver: settings.contact_areas_we_deliver,
        delivery_timings: settings.contact_delivery_timings,

        business_hours_mon_sat: settings.contact_business_hours_mon_sat,
        business_hours_sunday: settings.contact_business_hours_sunday,
        response_time: settings.contact_response_time,

        headquarters_title: settings.contact_headquarters_title,
        headquarters_description: settings.contact_headquarters_description,
        headquarters_address: settings.contact_headquarters_address,
        website: settings.contact_website,
      },
      about_page: {
        heritage_title: settings.about_heritage_title,
        heritage_p1: settings.about_heritage_p1,
        heritage_p2: settings.about_heritage_p2,
        heritage_label1_val: settings.about_heritage_label1_val,
        heritage_label1_txt: settings.about_heritage_label1_txt,
        heritage_label2_val: settings.about_heritage_label2_val,
        heritage_label2_txt: settings.about_heritage_label2_txt,
        heritage_image1: settings.about_heritage_image1,
        heritage_image2: settings.about_heritage_image2,
        
        promise_title: settings.about_promise_title,
        
        promise1_title: settings.about_promise1_title,
        promise1_desc: settings.about_promise1_desc,
        promise2_title: settings.about_promise2_title,
        promise2_desc: settings.about_promise2_desc,
        promise3_title: settings.about_promise3_title,
        promise3_desc: settings.about_promise3_desc,
        
        why_title1: settings.about_why_title1,
        why_desc1: settings.about_why_desc1,
        why_title2: settings.about_why_title2,
        why_desc2: settings.about_why_desc2,
        why_title3: settings.about_why_title3,
        why_desc3: settings.about_why_desc3,
        why_title4: settings.about_why_title4,
        why_desc4: settings.about_why_desc4,
      },
      privacy_policy: settings.privacy_policy,
      terms_conditions: settings.terms_conditions,
      return_policy: settings.return_policy,
      shipping_policy: settings.shipping_policy,
      meta_keywords: settings.meta_keywords || '',
      meta_description: settings.meta_description || '',
      map_iframe: settings.map_iframe,
      theme_classic_primary_color: settings.theme_classic_primary_color,
      theme_classic_secondary_color: settings.theme_classic_secondary_color,
      theme_classic_font_color: settings.theme_classic_font_color,
      theme_color: settings.theme_color,
      social_twitter: settings.social_twitter || '',
      social_youtube: settings.social_youtube || '',
      app_download: {
        enabled: settings.app_download_enabled === '1',
        title: settings.app_download_title,
        tagline: settings.app_download_tagline,
        description: settings.app_download_description,
        promo_header: settings.app_download_promo_header,
        playstore_url: settings.app_download_playstore_url,
        applestore_url: settings.app_download_applestore_url,
      },
      features: {
        shipping: {
          enabled: settings.feature_shipping_enabled === '1',
          title: settings.feature_shipping_title,
          description: settings.feature_shipping_description,
        },
        returns: {
          enabled: settings.feature_returns_enabled === '1',
          title: settings.feature_returns_title,
          description: settings.feature_returns_description,
        },
        support: {
          enabled: settings.feature_support_enabled === '1',
          title: settings.feature_support_title,
          description: settings.feature_support_description,
        },
        safety: {
          enabled: settings.feature_safety_enabled === '1',
          title: settings.feature_safety_title,
          description: settings.feature_safety_description,
        }
      },
    });
  } catch (err) {
    console.error('[GET /api/config/public] Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to load public configuration',
    });
  }
});

// ────────────────────────────────────────────────
// POST /api/config/navbar/logo - Upload logo (admin)
// ────────────────────────────────────────────────
router.post(
  '/navbar/logo',
  protect,
  adminOnly,
  upload.single('logo'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No logo file uploaded',
        });
      }

      const logoPath = `/uploads/${req.file.filename}`;

      await pool.query(
        `INSERT INTO settings (variable, value) 
         VALUES ('logo', ?) 
         ON DUPLICATE KEY UPDATE value = ?`,
        [logoPath, logoPath]
      );

      res.json({
        success: true,
        message: 'Logo updated successfully',
        logo_url: logoPath,   // consistent key name
      });
    } catch (err) {
      console.error('[POST /navbar/logo] Error:', err.message);
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to update logo',
      });
    }
  }
);

// ────────────────────────────────────────────────
// POST /api/config/navbar/name - Update site name (admin)
// ────────────────────────────────────────────────
router.post('/navbar/name', protect, adminOnly, async (req, res) => {
  const { site_name } = req.body;

  try {
    if (!site_name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Site name is required and cannot be empty',
      });
    }

    const trimmedName = site_name.trim();

    await pool.query(
      `INSERT INTO settings (variable, value) 
       VALUES ('site_name', ?) 
       ON DUPLICATE KEY UPDATE value = ?`,
      [trimmedName, trimmedName]
    );

    res.json({
      success: true,
      message: 'Site name updated successfully',
      site_name: trimmedName,
    });
  } catch (err) {
    console.error('[POST /navbar/name] Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update site name',
    });
  }
});




// routes/home.js (or inside config.js)
// routes/config.js or routes/home.js
// In routes/config.js (or wherever the route is defined)
router.get('/home-products', async (req, res) => {
  try {
    // Get active categories
    const [categories] = await pool.query(
      `SELECT id, name, image, banner 
       FROM categories 
       WHERE status = 1 
       ORDER BY row_order ASC, id ASC`
    );

    const result = [];

    for (const cat of categories) {
      const [products] = await pool.query(
        `SELECT 
           p.id,
           p.name,
           p.image,
           p.tags,
           COALESCE(pv.price, 0) AS price,
           COALESCE(pv.special_price, pv.price, 0) AS display_price,
           pv.stock,
           pv.weight
         FROM products p
         LEFT JOIN product_variants pv 
           ON p.id = pv.product_id AND pv.status = 1
         WHERE p.category_id = ? 
           AND p.status = 1
         ORDER BY p.row_order ASC, p.id DESC
         LIMIT 20`,
        [cat.id]
      );

      // Format products with discount calculation
      const formattedProducts = products.map(p => ({
        id: p.id,
        name: p.name,
        image: p.image,
        tags: p.tags || '',
        price: p.display_price,
        originalPrice: p.price,
        discount: p.price > p.display_price && p.price > 0
          ? Math.round(((p.price - p.display_price) / p.price) * 100)
          : 0,
        stock: p.stock || 0,
        weight: p.weight || null,
      }));

      result.push({
        category: {
          id: cat.id,
          name: cat.name,
          image: cat.image || cat.banner || null,
        },
        products: formattedProducts,
      });
    }

    res.json({
      success: true,
      categories: result,
    });
  } catch (err) {
    console.error('Home products endpoint error:', err.message, err.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to load home products',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});
// ────────────────────────────────────────────────
// POST /api/config/footer - Update footer (admin)
// ────────────────────────────────────────────────
router.post('/footer', protect, adminOnly, async (req, res) => {
  const { footer_text, footer_description } = req.body;

  try {
    if (footer_text !== undefined) {
      await pool.query(
        `INSERT INTO settings (variable, value) 
         VALUES ('footer_text', ?) 
         ON DUPLICATE KEY UPDATE value = ?`,
        [footer_text, footer_text]
      );
    }

    if (footer_description !== undefined) {
      await pool.query(
        `INSERT INTO settings (variable, value) 
         VALUES ('footer_description', ?) 
         ON DUPLICATE KEY UPDATE value = ?`,
        [footer_description, footer_description]
      );
    }

    res.json({ success: true, message: 'Footer updated successfully' });
  } catch (err) {
    console.error('[POST /footer] Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update footer',
    });
  }
});

// ────────────────────────────────────────────────
// PUT /api/config/contact - Update Contact Us content (admin)
// ────────────────────────────────────────────────
router.put('/contact', protect, adminOnly, async (req, res) => {
  const {
    phone,
    email,
    address,
    intro_text,
    areas_we_deliver,
    delivery_timings,
    business_hours_mon_sat,
    business_hours_sunday,
    response_time,
    headquarters_title,
    headquarters_description,
    headquarters_address,
    website,
  } = req.body || {};

  try {
    const updates = {
      contact_phone: phone,
      contact_email: email,
      contact_address: address,
      contact_intro_text: intro_text,
      contact_areas_we_deliver: areas_we_deliver,
      contact_delivery_timings: delivery_timings,
      contact_business_hours_mon_sat: business_hours_mon_sat,
      contact_business_hours_sunday: business_hours_sunday,
      contact_response_time: response_time,
      contact_headquarters_title: headquarters_title,
      contact_headquarters_description: headquarters_description,
      contact_headquarters_address: headquarters_address,
      contact_website: website,
    };

    for (const [variable, value] of Object.entries(updates)) {
      if (value === undefined) continue; // only update provided fields
      await pool.query(
        `INSERT INTO settings (variable, value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value)`,
        [variable, String(value)]
      );
    }

    res.json({ success: true, message: 'Contact info updated successfully' });
  } catch (err) {
    console.error('[PUT /api/config/contact] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update contact info' });
  }
});

// ────────────────────────────────────────────────
// PUT /api/config/about - Update About Us content (admin)
// ────────────────────────────────────────────────
router.put('/about', protect, adminOnly, async (req, res) => {
  const {
    heritage_title,
    heritage_p1,
    heritage_p2,
    heritage_label1_val,
    heritage_label1_txt,
    heritage_label2_val,
    heritage_label2_txt,
    heritage_image1,
    heritage_image2,
    promise_title,
    promise1_title,
    promise1_desc,
    promise2_title,
    promise2_desc,
    promise3_title,
    promise3_desc,
    why_title1,
    why_desc1,
    why_title2,
    why_desc2,
    why_title3,
    why_desc3,
    why_title4,
    why_desc4,
  } = req.body || {};

  try {
    const updates = {
      about_heritage_title: heritage_title,
      about_heritage_p1: heritage_p1,
      about_heritage_p2: heritage_p2,
      about_heritage_label1_val: heritage_label1_val,
      about_heritage_label1_txt: heritage_label1_txt,
      about_heritage_label2_val: heritage_label2_val,
      about_heritage_label2_txt: heritage_label2_txt,
      about_heritage_image1: heritage_image1,
      about_heritage_image2: heritage_image2,
      about_promise_title: promise_title,
      about_promise1_title: promise1_title,
      about_promise1_desc: promise1_desc,
      about_promise2_title: promise2_title,
      about_promise2_desc: promise2_desc,
      about_promise3_title: promise3_title,
      about_promise3_desc: promise3_desc,
      about_why_title1: why_title1,
      about_why_desc1: why_desc1,
      about_why_title2: why_title2,
      about_why_desc2: why_desc2,
      about_why_title3: why_title3,
      about_why_desc3: why_desc3,
      about_why_title4: why_title4,
      about_why_desc4: why_desc4,
    };

    for (const [variable, value] of Object.entries(updates)) {
      if (value === undefined) continue; // only update provided fields
      await pool.query(
        `INSERT INTO settings (variable, value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value)`,
        [variable, String(value)]
      );
    }

    res.json({ success: true, message: 'About info updated successfully' });
  } catch (err) {
    console.error('[PUT /api/config/about] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update about info' });
  }
});

// ────────────────────────────────────────────────
// Default email templates with placeholder tokens
const DEFAULT_CUSTOMER_TEMPLATE = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #334155;">
  <div style="background-color: #4f46e5; padding: 24px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 24px;">Order Confirmed!</h1>
    <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Thank you for shopping with {store_name}</p>
  </div>
  <div style="padding: 24px;">
    <p>Hi {customer_name},</p>
    <p>We are excited to let you know that your order has been received and is being processed. Below are your order details:</p>
    
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0;"><strong>Order ID:</strong> #{order_id}</p>
      <p style="margin: 0 0 8px 0;"><strong>Date:</strong> {order_date}</p>
      <p style="margin: 0;"><strong>Payment Method:</strong> {payment_method}</p>
    </div>

    <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 24px;">Items Ordered</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f1f5f9;">
          <th style="padding: 10px; text-align: left; font-size: 12px; font-weight: bold; color: #475569;">Product</th>
          <th style="padding: 10px; text-align: center; font-size: 12px; font-weight: bold; color: #475569;">Qty</th>
          <th style="padding: 10px; text-align: right; font-size: 12px; font-weight: bold; color: #475569;">Price</th>
          <th style="padding: 10px; text-align: right; font-size: 12px; font-weight: bold; color: #475569;">Amount</th>
        </tr>
      </thead>
      <tbody>
        {items_table}
      </tbody>
    </table>

    <table style="width: 60%; margin-left: auto; margin-top: 20px; border-collapse: collapse; font-size: 14px;">
      <tr>
        <td style="padding: 6px 0; color: #64748b;">Subtotal:</td>
        <td style="padding: 6px 0; text-align: right;">₹{subtotal}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #16a34a;">Discount:</td>
        <td style="padding: 6px 0; text-align: right; color: #16a34a;">-₹{discount}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #64748b;">Delivery Charge:</td>
        <td style="padding: 6px 0; text-align: right;">₹{delivery_charge}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #dc2626;">Wallet Balance Used:</td>
        <td style="padding: 6px 0; text-align: right; color: #dc2626;">-₹{wallet_balance}</td>
      </tr>
      <tr style="border-top: 1px solid #e2e8f0; font-weight: bold; font-size: 16px;">
        <td style="padding: 12px 0 0 0; color: #1e293b;">Total Amount:</td>
        <td style="padding: 12px 0 0 0; text-align: right; color: #4f46e5;">₹{total_amount}</td>
      </tr>
    </table>

    <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 32px;">Shipping Address</h3>
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6;">
      {shipping_address}
    </div>

    <p style="margin-top: 32px; font-size: 13px; color: #64748b; text-align: center;">
      If you have any questions, feel free to contact us at <a href="mailto:{admin_email}" style="color: #4f46e5;">{admin_email}</a>.
    </p>
  </div>
  <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
    &copy; {current_year} {store_name}. All rights reserved.
  </div>
</div>`;

const DEFAULT_ADMIN_TEMPLATE = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #334155;">
  <div style="background-color: #0f172a; padding: 24px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 24px;">New Order Received</h1>
    <p style="margin: 8px 0 0 0; font-size: 14px; color: #94a3b8;">Order #{order_id} needs processing</p>
  </div>
  <div style="padding: 24px;">
    <p>Hi Admin,</p>
    <p>A new order has been successfully placed by <strong>{customer_name}</strong> ({customer_email}).</p>
    
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0;"><strong>Order ID:</strong> #{order_id}</p>
      <p style="margin: 0 0 8px 0;"><strong>Total Value:</strong> ₹{total_amount}</p>
      <p style="margin: 0 0 8px 0;"><strong>Payment Method:</strong> {payment_method}</p>
      <p style="margin: 0;"><strong>Customer Phone:</strong> {customer_phone}</p>
    </div>

    <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 24px;">Items Ordered</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f1f5f9;">
          <th style="padding: 10px; text-align: left; font-size: 12px; font-weight: bold; color: #475569;">Product</th>
          <th style="padding: 10px; text-align: center; font-size: 12px; font-weight: bold; color: #475569;">Qty</th>
          <th style="padding: 10px; text-align: right; font-size: 12px; font-weight: bold; color: #475569;">Price</th>
          <th style="padding: 10px; text-align: right; font-size: 12px; font-weight: bold; color: #475569;">Amount</th>
        </tr>
      </thead>
      <tbody>
        {items_table}
      </tbody>
    </table>

    <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 32px;">Shipping Address</h3>
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6;">
      {shipping_address}
    </div>

    <div style="text-align: center; margin-top: 32px;">
      <a href="{frontend_url}/admin/orders" style="background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
        View Order in Admin Panel
      </a>
    </div>
  </div>
</div>`;

// GET /api/config/email - Get email (SMTP) settings (admin)
// ────────────────────────────────────────────────
router.get('/email', protect, adminOnly, async (req, res) => {
  try {
    const keys = [
      'mail_mailer',
      'mail_host',
      'mail_driver',
      'mail_port',
      'mail_encryption',
      'mail_username',
      'mail_email_id',
      'mail_password',
      'mail_customer_template',
      'mail_admin_template'
    ];

    const [rows] = await pool.query('SELECT variable, value FROM settings WHERE variable IN (?)', [keys]);
    const settings = {};
    rows.forEach(row => {
      settings[row.variable] = row.value;
    });

    res.json({
      success: true,
      data: {
        mail_mailer: settings.mail_mailer || process.env.SMTP_MAILER || 'smtp',
        mail_host: settings.mail_host || process.env.SMTP_HOST || 'mail.theaquamachine.com',
        mail_driver: settings.mail_driver || process.env.SMTP_DRIVER || 'smtp',
        mail_port: settings.mail_port || process.env.SMTP_PORT || '465',
        mail_encryption: settings.mail_encryption || process.env.SMTP_ENCRYPTION || 'ssl',
        mail_username: settings.mail_username || process.env.SMTP_USER || 'info@theaquamachine.com',
        mail_email_id: settings.mail_email_id || process.env.SMTP_EMAIL_ID || 'info@theaquamachine.com',
        mail_password: settings.mail_password || process.env.SMTP_PASS || 'India@2026',
        mail_customer_template: settings.mail_customer_template || DEFAULT_CUSTOMER_TEMPLATE,
        mail_admin_template: settings.mail_admin_template || DEFAULT_ADMIN_TEMPLATE
      }
    });
  } catch (err) {
    console.error('[GET /api/config/email] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch email settings' });
  }
});

// ────────────────────────────────────────────────
// PUT /api/config/email - Update email (SMTP) settings (admin)
// ────────────────────────────────────────────────
router.put('/email', protect, adminOnly, async (req, res) => {
  const {
    mail_mailer,
    mail_host,
    mail_driver,
    mail_port,
    mail_encryption,
    mail_username,
    mail_email_id,
    mail_password,
    mail_customer_template,
    mail_admin_template
  } = req.body || {};

  try {
    const updates = {
      mail_mailer,
      mail_host,
      mail_driver,
      mail_port,
      mail_encryption,
      mail_username,
      mail_email_id,
      mail_password,
      mail_customer_template,
      mail_admin_template
    };

    for (const [variable, value] of Object.entries(updates)) {
      if (value === undefined) continue;
      await pool.query(
        `INSERT INTO settings (variable, value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value)`,
        [variable, String(value)]
      );
    }

    res.json({ success: true, message: 'Email settings updated successfully' });
  } catch (err) {
    console.error('[PUT /api/config/email] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update email settings' });
  }
});

// ────────────────────────────────────────────────
// GET /api/config/templates - Get all email templates (admin)
// ────────────────────────────────────────────────
router.get('/templates', protect, adminOnly, async (req, res) => {
  try {
    await ensureEmailTemplatesTable();
    const [rows] = await pool.query('SELECT * FROM email_templates ORDER BY id ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[GET /api/config/templates] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch email templates' });
  }
});

// ────────────────────────────────────────────────
// POST /api/config/templates - Create new email template (admin)
// ────────────────────────────────────────────────
router.post('/templates', protect, adminOnly, async (req, res) => {
  const { name, code, subject, content, type } = req.body || {};
  if (!name || !code || !subject || !content) {
    return res.status(400).json({ success: false, message: 'All fields (name, code, subject, content) are required.' });
  }

  try {
    await pool.query(
      `INSERT INTO email_templates (name, code, subject, content, type, is_default)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [name, code.trim().toLowerCase().replace(/\s+/g, '_'), subject, content, type || 'customer']
    );
    res.json({ success: true, message: 'Email template created successfully' });
  } catch (err) {
    console.error('[POST /api/config/templates] Error:', err.message);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'A template with this code already exists.' });
    }
    res.status(500).json({ success: false, message: 'Failed to create email template' });
  }
});

// ────────────────────────────────────────────────
// PUT /api/config/templates/:id - Update an email template (admin)
// ────────────────────────────────────────────────
router.put('/templates/:id', protect, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { name, subject, content, type } = req.body || {};

  try {
    const [existing] = await pool.query('SELECT * FROM email_templates WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    await pool.query(
      `UPDATE email_templates 
       SET name = ?, subject = ?, content = ?, type = ?
       WHERE id = ?`,
      [name || existing[0].name, subject || existing[0].subject, content !== undefined ? content : existing[0].content, type || existing[0].type, id]
    );

    res.json({ success: true, message: 'Email template updated successfully' });
  } catch (err) {
    console.error('[PUT /api/config/templates/:id] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update email template' });
  }
});

// ────────────────────────────────────────────────
// DELETE /api/config/templates/:id - Delete an email template (admin)
// ────────────────────────────────────────────────
router.delete('/templates/:id', protect, adminOnly, async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await pool.query('SELECT * FROM email_templates WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    if (existing[0].is_default) {
      return res.status(400).json({ success: false, message: 'Cannot delete default system templates.' });
    }

    await pool.query('DELETE FROM email_templates WHERE id = ?', [id]);
    res.json({ success: true, message: 'Email template deleted successfully' });
  } catch (err) {
    console.error('[DELETE /api/config/templates/:id] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete email template' });
  }
});

// ────────────────────────────────────────────────
// GET /api/config/email-logs - Fetch email logs history (admin)
// ────────────────────────────────────────────────
router.get('/email-logs', protect, adminOnly, async (req, res) => {
  try {
    await ensureEmailLogsTable();
    const [rows] = await pool.query('SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 100');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[GET /api/config/email-logs] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch email logs' });
  }
});

// ────────────────────────────────────────────────
// POST /api/config/test-email - Send a test email using current SMTP settings
// ────────────────────────────────────────────────
router.post('/test-email', protect, adminOnly, async (req, res) => {
  const { to } = req.body || {};
  if (!to) {
    return res.status(400).json({ success: false, message: 'Recipient email (to) is required' });
  }

  try {
    // Load SMTP settings from DB
    const keys = ['mail_host', 'mail_port', 'mail_encryption', 'mail_username', 'mail_email_id', 'mail_password'];
    const [rows] = await pool.query('SELECT variable, value FROM settings WHERE variable IN (?)', [keys]);
    const s = {};
    rows.forEach(r => { s[r.variable] = r.value; });

    const host = s.mail_host || 'mail.theaquamachine.com';
    const port = Number(s.mail_port || 465);
    const user = s.mail_username || 'info@theaquamachine.com';
    const pass = s.mail_password || 'India@2026';
    const senderEmail = s.mail_email_id || user;
    const encryption = (s.mail_encryption || 'ssl').toLowerCase();
    const isSecure = encryption === 'ssl' || port === 465;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: isSecure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });

    const info = await transporter.sendMail({
      from: `"The Aqua Machine" <${senderEmail}>`,
      to,
      subject: `SMTP Test Email - ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
          <div style="background:#4f46e5;padding:24px;text-align:center;color:#fff;">
            <h1 style="margin:0;font-size:22px;">✅ SMTP Test Successful!</h1>
            <p style="margin:8px 0 0;font-size:13px;opacity:0.85;">Your email configuration is working correctly</p>
          </div>
          <div style="padding:24px;">
            <p style="font-size:14px;color:#334155;">Hi Admin,</p>
            <p style="font-size:14px;color:#334155;">This is a test email sent from <strong>The Aqua Machine</strong> backend to verify your SMTP settings are configured properly.</p>
            <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:16px;">
              <tr style="background:#f8fafc;"><td style="padding:8px 12px;font-weight:bold;border:1px solid #e2e8f0;">SMTP Host</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${host}</td></tr>
              <tr><td style="padding:8px 12px;font-weight:bold;border:1px solid #e2e8f0;">Port</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${port}</td></tr>
              <tr style="background:#f8fafc;"><td style="padding:8px 12px;font-weight:bold;border:1px solid #e2e8f0;">Encryption</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${encryption.toUpperCase()}</td></tr>
              <tr><td style="padding:8px 12px;font-weight:bold;border:1px solid #e2e8f0;">Sender</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${senderEmail}</td></tr>
              <tr style="background:#f8fafc;"><td style="padding:8px 12px;font-weight:bold;border:1px solid #e2e8f0;">Sent To</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${to}</td></tr>
              <tr><td style="padding:8px 12px;font-weight:bold;border:1px solid #e2e8f0;">Time</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td></tr>
            </table>
            <p style="margin-top:24px;font-size:13px;color:#64748b;">If you received this email, your SMTP configuration is correct and order confirmation emails will be delivered successfully.</p>
          </div>
          <div style="background:#f1f5f9;padding:14px;text-align:center;font-size:11px;color:#94a3b8;">&copy; ${new Date().getFullYear()} The Aqua Machine</div>
        </div>
      `
    });

    res.json({
      success: true,
      message: `Test email sent to ${to}`,
      details: {
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected
      }
    });
  } catch (err) {
    console.error('[POST /api/config/test-email] Error:', err.message);
    res.status(500).json({
      success: false,
      message: `Failed to send test email: ${err.message}`,
      error: err.message
    });
  }
});

// ────────────────────────────────────────────────
// GET /api/config/policies - Get all policies (public or admin)
// ────────────────────────────────────────────────
router.get('/policies', async (req, res) => {
  try {
    await ensurePoliciesTable();
    const [rows] = await pool.query('SELECT id, type, title, content, status, updated_at FROM policies ORDER BY id ASC');
    res.json({
      success: true,
      policies: rows
    });
  } catch (err) {
    console.error('[GET /api/config/policies] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch policies' });
  }
});

// ────────────────────────────────────────────────
// GET /api/config/policies/:type - Get single policy
// ────────────────────────────────────────────────
router.get('/policies/:type', async (req, res) => {
  const { type } = req.params;
  try {
    await ensurePoliciesTable();
    const [rows] = await pool.query('SELECT id, type, title, content, status, updated_at FROM policies WHERE type = ?', [type]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }
    res.json({
      success: true,
      policy: rows[0]
    });
  } catch (err) {
    console.error('[GET /api/config/policies/:type] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch policy' });
  }
});

// ────────────────────────────────────────────────
// PUT /api/config/policies/:type - Update single policy (admin)
// ────────────────────────────────────────────────
router.put('/policies/:type', protect, adminOnly, async (req, res) => {
  const { type } = req.params;
  const { content, title, status } = req.body || {};

  try {
    await ensurePoliciesTable();

    // 1. Update in policies table
    const [existing] = await pool.query('SELECT id FROM policies WHERE type = ?', [type]);
    if (existing.length > 0) {
      const updates = [];
      const params = [];

      if (content !== undefined) { updates.push('content = ?'); params.push(content); }
      if (title !== undefined) { updates.push('title = ?'); params.push(title); }
      if (status !== undefined) { updates.push('status = ?'); params.push(status); }

      if (updates.length > 0) {
        params.push(type);
        await pool.query(`UPDATE policies SET ${updates.join(', ')} WHERE type = ?`, params);
      }
    } else {
      await pool.query(
        'INSERT INTO policies (type, title, content, status) VALUES (?, ?, ?, ?)',
        [type, title || type.replace(/_/g, ' ').toUpperCase(), content || '', status !== undefined ? status : 1]
      );
    }

    // 2. Mirror into settings table for complete backward compatibility
    if (content !== undefined) {
      await pool.query(
        `INSERT INTO settings (variable, value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value)`,
        [type, String(content)]
      );
    }

    res.json({ success: true, message: `${title || type} updated successfully` });
  } catch (err) {
    console.error('[PUT /api/config/policies/:type] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update policy' });
  }
});

// ────────────────────────────────────────────────
// PUT /api/config/policies - Update all policies in batch (admin)
// ────────────────────────────────────────────────
router.put('/policies', protect, adminOnly, async (req, res) => {
  const { privacy_policy, terms_conditions, return_policy, shipping_policy } = req.body || {};

  try {
    await ensurePoliciesTable();

    const updates = {
      privacy_policy,
      terms_conditions,
      return_policy,
      shipping_policy
    };

    for (const [key, val] of Object.entries(updates)) {
      if (val === undefined) continue;

      // Update policies table
      await pool.query(
        `INSERT INTO policies (type, title, content)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE content = VALUES(content)`,
        [key, key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), String(val)]
      );

      // Update settings table
      await pool.query(
        `INSERT INTO settings (variable, value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value)`,
        [key, String(val)]
      );
    }

    res.json({ success: true, message: 'All policies updated successfully' });
  } catch (err) {
    console.error('[PUT /api/config/policies] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update policies' });
  }
});

// ────────────────────────────────────────────────
// PUT /api/config/privacy-terms - Legacy endpoint compatibility
// ────────────────────────────────────────────────
router.put('/privacy-terms', protect, adminOnly, async (req, res) => {
  const { privacy_policy, terms_conditions, return_policy, shipping_policy } = req.body || {};

  try {
    await ensurePoliciesTable();

    const updates = {
      privacy_policy,
      terms_conditions,
      return_policy,
      shipping_policy,
    };

    for (const [variable, value] of Object.entries(updates)) {
      if (value === undefined) continue;

      // Update policies table
      await pool.query(
        `INSERT INTO policies (type, title, content)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE content = VALUES(content)`,
        [variable, variable.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), String(value)]
      );

      // Update settings table
      await pool.query(
        `INSERT INTO settings (variable, value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value)`,
        [variable, String(value)]
      );
    }

    res.json({ success: true, message: 'Policies updated successfully' });
  } catch (err) {
    console.error('[PUT /api/config/privacy-terms] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update policies' });
  }
});

// ────────────────────────────────────────────────
// GET /api/config/hero-slides - Public hero carousel (mock / placeholder)
// ────────────────────────────────────────────────
router.get('/hero-slides', async (req, res) => {
  try {
    res.json({
      success: true,
      slides: [
        {
          id: 1,
          image_url: '/uploads/hero1.jpg',
          title: 'Summer Sale',
          subtitle: 'Up to 70% off',
        },
        {
          id: 2,
          image_url: '/uploads/hero2.jpg',
          title: 'New Arrivals',
          subtitle: 'Fresh styles every week',
        },
      ],
    });
  } catch (err) {
    console.error('[GET /hero-slides] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load hero slides' });
  }
});

// ────────────────────────────────────────────────
// GET /api/config/sliders - Public dynamic sliders endpoint (respecting limit)
// ────────────────────────────────────────────────
router.get('/sliders', async (req, res) => {
  try {
    // 1. Get the slider count limit from settings (defaults to 3 if not found)
    const [settingsRows] = await pool.query(
      'SELECT value FROM settings WHERE variable = "slider_count"'
    );
    const limit = settingsRows[0] ? parseInt(settingsRows[0].value, 10) : 3;

    // 2. Fetch active sliders up to limit
    const [sliderRows] = await pool.query(
      'SELECT * FROM sliders ORDER BY id DESC LIMIT ?',
      [limit]
    );

    const slides = sliderRows.map(row => {
      let imageUrl = row.image;
      if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('https')) {
        if (!imageUrl.startsWith('/')) {
          imageUrl = '/' + imageUrl;
        }
      }

      // Determine call-to-action link based on dynamic parameters
      let ctaLink = '/products';
      if (row.type === 'categories' && row.type_id) {
        ctaLink = `/category/${row.type_id}`;
      } else if (row.link && row.link !== '0') {
        ctaLink = row.link;
      } else if (row.cta_link) {
        ctaLink = row.cta_link;
      }

      return {
        id: row.id,
        image_url: imageUrl,
        badge: row.badge || 'Premium Collection',
        title: row.title || '',
        subtitle: row.subtitle || '',
        cta_text: row.cta_text || 'Shop Now',
        cta_link: ctaLink,
      };
    });

    res.json({
      success: true,
      slides
    });
  } catch (err) {
    console.error('[GET /api/config/sliders] Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to load sliders list',
      error: err.message
    });
  }
});


// ────────────────────────────────────────────────
// GET /api/config/home-sections - Public home sections (mock)
// ────────────────────────────────────────────────
router.get('/home-sections', async (req, res) => {
  const activeOnly = req.query.active === 'true';

  try {
    let sections = [
      { id: 1, title: 'Featured Products', section_type: 'products', active: true },
      { id: 2, title: 'Categories', section_type: 'categories', active: true },
      { id: 3, title: 'Newsletter', section_type: 'newsletter', active: false },
    ];

    if (activeOnly) {
      sections = sections.filter((s) => s.active);
    }

    res.json({ success: true, sections });
  } catch (err) {
    console.error('[GET /home-sections] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load home sections' });
  }
});

// ────────────────────────────────────────────────
// POST /api/config/home-sections - Add new section (admin)
// ────────────────────────────────────────────────
router.post('/home-sections', protect, adminOnly, async (req, res) => {
  const { title, subtitle, type, content, active = true } = req.body;

  try {
    if (!title?.trim() || !type) {
      return res.status(400).json({
        success: false,
        message: 'Title and section type are required',
      });
    }

    const [result] = await pool.query(
      `INSERT INTO home_sections (title, subtitle, section_type, content, active) 
       VALUES (?, ?, ?, ?, ?)`,
      [title.trim(), subtitle || null, type, content || null, active ? 1 : 0]
    );

    res.status(201).json({
      success: true,
      message: 'Section created successfully',
      section: {
        id: result.insertId,
        title: title.trim(),
        subtitle,
        type,
        active: !!active,
      },
    });
  } catch (err) {
    console.error('[POST /home-sections] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to create section' });
  }
});

// ────────────────────────────────────────────────
// POST /api/config/home-sections/:sectionId/products - Add product to section
// ────────────────────────────────────────────────
router.post('/home-sections/:sectionId/products', protect, adminOnly, async (req, res) => {
  const { sectionId } = req.params;
  const { productId, rank = 0 } = req.body;

  try {
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
    }

    await pool.query(
      `INSERT INTO home_section_products (section_id, product_id, rank) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE rank = ?`,
      [sectionId, productId, rank, rank]
    );

    res.json({ success: true, message: 'Product added to section successfully' });
  } catch (err) {
    console.error('[POST /home-sections/:sectionId/products] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to add product to section' });
  }
});

// GET /api/config/site-content - Dynamic site content (newsletter, CTA, etc.)
router.get('/site-content', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT variable, value FROM settings WHERE variable IN ("newsletter_title", "newsletter_description", "cta_text")'
    );
    const data = {};
    rows.forEach(r => {
      data[r.variable] = r.value;
    });
    res.json({ success: true, data });
  } catch (err) {
    console.error('[GET /api/config/site-content] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load site content' });
  }
});

// ────────────────────────────────────────────────
// GENERAL WEBSITE SETTINGS ENDPOINTS
// ────────────────────────────────────────────────
const GENERAL_KEYS = [
  'site_title',
  'site_name',
  'support_number',
  'support_email',
  'copyright_details',
  'address',
  'short_description',
  'map_iframe',
  'logo',
  'favicon',
  'site_title_image',
  'meta_keywords',
  'meta_description',
  'developer_mode',
  'app_download_enabled',
  'app_download_title',
  'app_download_tagline',
  'app_download_description',
  'app_download_promo_header',
  'app_download_playstore_url',
  'app_download_applestore_url',
  'social_twitter',
  'social_instagram',
  'social_youtube',
  'social_whatsapp',
  'feature_shipping_enabled',
  'feature_shipping_title',
  'feature_shipping_description',
  'feature_returns_enabled',
  'feature_returns_title',
  'feature_returns_description',
  'feature_support_enabled',
  'feature_support_title',
  'feature_support_description',
  'feature_safety_enabled',
  'feature_safety_title',
  'feature_safety_description',
  'theme_classic_primary_color',
  'theme_classic_secondary_color',
  'theme_classic_font_color',
  'theme_color',
  'footer_description',
  'footer_quick_links',
  'footer_support_links',
  'social_facebook',
  'social_instagram',
  'social_whatsapp'
];

// GET /api/config/general - Load general website settings
router.get('/general', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT variable, value FROM settings WHERE variable IN (${GENERAL_KEYS.map(() => '?').join(',')})`,
      GENERAL_KEYS
    );

    // Mockup brand default specifications
    const defaults = {
      site_title: 'Jijai Masale',
      site_name: 'Jijai Masale',
      support_number: '9323497001',
      support_email: 'info@jijaimasale.in',
      copyright_details: 'Copyright © 2025, All Right Reserved Jijai Masale. Developed by <a href = "https://www.kalkidigital.com" target="_blank">Kalki Digital </a>',
      address: 'HO AND MFG ADD - SATYAM -SHIVAM HIGHTS PLOT NO 142/5 ASHTI -DOITHAN ROAD BAVI TAQ ASHTI DIS .BEED -414203\nMUMBAI OFFICE -',
      short_description: 'We, Jijai Masale, At Spice Haven, we believe that the essence of every delicious dish lies in the quality and freshness of the spices used.',
      map_iframe: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1885.9806552492967!2d73.08693515652054!3d19.02142644552438!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7e94d178f7ff9%3A0x70d7d80a4f751393!2sJijai%20Masale%20Pvt%20Ltd!5e0!3m2!1sen!2sin!4v1766473635989!5m2!1sen!2sin" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
      logo: '',
      favicon: '',
      meta_keywords: 'masala manufacturers, spices manufacturers in BEED MAHARSTRA , spices exporters in India',
      meta_description: 'We are Manufacturer and Trading Company in Spices. We Provides Different Types of Spices to various Sectors. We have original Taste in Spices , Our Taste maker will make your food more tasty by simply using in right quantity. We have our unique taste for each products this taste will never be match to anyother taste.',
      developer_mode: '0',
      app_download_enabled: '0',
      app_download_title: '',
      app_download_tagline: '',
      app_download_description: '',
      app_download_promo_header: '',
      app_download_playstore_url: '',
      app_download_applestore_url: '',
      social_facebook: '',
      social_instagram: '',
      social_twitter: '',
      social_youtube: '',
      social_whatsapp: '',
      footer_description: '',
      footer_quick_links: JSON.stringify([{ text: 'Collections', url: '/category' }, { text: 'Products Catalog', url: '/products' }, { text: 'About Our Brand', url: '/about' }, { text: 'Contact Us', url: '/contact' }]),
      footer_support_links: JSON.stringify([{ text: 'Track Order', url: '/my-orders' }, { text: 'Privacy Policy', url: '/privacy' }, { text: 'Terms of Service', url: '/terms' }, { text: 'Return & Refund Policy', url: '/return-policy' }, { text: 'Shipping Policy', url: '/shipping-policy' }]),
      feature_shipping_enabled: '1',
      feature_shipping_title: 'Free Shipping',
      feature_shipping_description: 'Free Shipping at your door step.',
      feature_returns_enabled: '1',
      feature_returns_title: 'Free Returns',
      feature_returns_description: 'Free return if products are damaged.',
      feature_support_enabled: '1',
      feature_support_title: 'Support 24/7',
      feature_support_description: '24/7 and 365 days support is available.',
      feature_safety_enabled: '1',
      feature_safety_title: '100% Safe & Secure',
      feature_safety_description: '100% safe & secure.',
      theme_classic_primary_color: '',
      theme_classic_secondary_color: '',
      theme_classic_font_color: '',
      theme_color: 'default'
    };

    const data = { ...defaults };
    rows.forEach((row) => {
      data[row.variable] = row.value ?? defaults[row.variable];
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error('[GET /api/config/general] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load general settings' });
  }
});

// PUT /api/config/general - Update text/switch settings and sync with legacy storefront public keys
router.put('/general', protect, adminOnly, async (req, res) => {
  try {
    const KEY_SYNC_MAP = {
      support_number: 'contact_phone',
      support_email: 'contact_email',
      copyright_details: 'footer_text',
      address: 'contact_address',
      short_description: 'footer_description'
    };

    const keys = Object.keys(req.body);
    for (const key of keys) {
      if (GENERAL_KEYS.includes(key)) {
        const val = req.body[key] !== undefined && req.body[key] !== null ? String(req.body[key]) : '';
        
        // Save the main key
        await pool.query(
          `INSERT INTO settings (variable, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?`,
          [key, val, val]
        );

        // Sync with legacy storefront key if mapped
        if (KEY_SYNC_MAP[key]) {
          const syncKey = KEY_SYNC_MAP[key];
          await pool.query(
            `INSERT INTO settings (variable, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?`,
            [syncKey, val, val]
          );
        }
      }
    }
    res.json({ success: true, message: 'General settings updated successfully!' });
  } catch (err) {
    console.error('[PUT /api/config/general] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update general settings' });
  }
});

// POST /api/config/general/logo - Upload store logo
router.post('/general/logo', protect, adminOnly, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No logo file uploaded' });
    }
    const logoPath = `/uploads/${req.file.filename}`;
    await pool.query(
      `INSERT INTO settings (variable, value) VALUES ('logo', ?) ON DUPLICATE KEY UPDATE value = ?`,
      [logoPath, logoPath]
    );
    res.json({ success: true, message: 'Logo uploaded successfully', logo_url: logoPath });
  } catch (err) {
    console.error('[POST /api/config/general/logo] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to upload logo' });
  }
});

// POST /api/config/general/favicon - Upload store favicon
router.post('/general/favicon', protect, adminOnly, upload.single('favicon'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No favicon file uploaded' });
    }
    const favPath = `/uploads/${req.file.filename}`;
    await pool.query(
      `INSERT INTO settings (variable, value) VALUES ('favicon', ?) ON DUPLICATE KEY UPDATE value = ?`,
      [favPath, favPath]
    );
    res.json({ success: true, message: 'Favicon uploaded successfully', favicon_url: favPath });
  } catch (err) {
    console.error('[POST /api/config/general/favicon] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to upload favicon' });
  }
});

// POST /api/config/general/site_title_image - Upload site title image
router.post('/general/site_title_image', protect, adminOnly, upload.single('site_title_image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No site title image file uploaded' });
    }
    const imagePath = `/uploads/${req.file.filename}`;
    await pool.query(
      `INSERT INTO settings (variable, value) VALUES ('site_title_image', ?) ON DUPLICATE KEY UPDATE value = ?`,
      [imagePath, imagePath]
    );
    res.json({ success: true, message: 'Site Title image uploaded successfully', site_title_image_url: imagePath });
  } catch (err) {
    console.error('[POST /api/config/general/site_title_image] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to upload site title image' });
  }
});

// POST /api/config/about/heritage_image1 - Upload first heritage image
router.post('/about/heritage_image1', protect, adminOnly, upload.single('heritage_image1'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }
    const imagePath = `/uploads/${req.file.filename}`;
    await pool.query(
      `INSERT INTO settings (variable, value) VALUES ('about_heritage_image1', ?) ON DUPLICATE KEY UPDATE value = ?`,
      [imagePath, imagePath]
    );
    res.json({ success: true, message: 'Heritage image 1 uploaded successfully', image_url: imagePath });
  } catch (err) {
    console.error('[POST /api/config/about/heritage_image1] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to upload heritage image 1' });
  }
});

// POST /api/config/about/heritage_image2 - Upload second heritage image
router.post('/about/heritage_image2', protect, adminOnly, upload.single('heritage_image2'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }
    const imagePath = `/uploads/${req.file.filename}`;
    await pool.query(
      `INSERT INTO settings (variable, value) VALUES ('about_heritage_image2', ?) ON DUPLICATE KEY UPDATE value = ?`,
      [imagePath, imagePath]
    );
    res.json({ success: true, message: 'Heritage image 2 uploaded successfully', image_url: imagePath });
  } catch (err) {
    console.error('[POST /api/config/about/heritage_image2] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to upload heritage image 2' });
  }
});

// ────────────────────────────────────────────────
// STORE SETTINGS ENDPOINTS
// ────────────────────────────────────────────────
const STORE_KEYS = [
  'site_title',
  'support_number',
  'support_email',
  'copyright_details',
  'address',
  'system_timezone',
  'tax_name',
  'tax_number',
  'low_stock_limit',
  'customer_app_maintenance_msg',
  'delivery_boy_maintenance_msg',
  'logo',
  'global_free_delivery_threshold',
  'refer_earn_status',
  'refer_earn_method',
  'refer_earn_bonus',
  'refer_earn_min_order',
  'store_setting_enable_cart_button',
  'store_setting_expand_product_images',
  'store_setting_enable_local_pickup',
  'store_setting_zipcode_wise_delivery',
  'store_setting_order_delivery_otp',
  'store_setting_system_status',
  'store_setting_customer_app_maintenance',
  'store_setting_delivery_boy_maintenance',
  'store_setting_google_login',
  'store_setting_apple_login',
  'store_setting_whatsapp_share',
  'store_setting_pincode_wise',
  'store_setting_city_wise',
  'store_setting_wallet_balance',
  'store_setting_android_version',
  'store_setting_ios_version'
];

// GET /api/config/store - Get store settings
router.get('/store', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT variable, value FROM settings WHERE variable IN (${STORE_KEYS.map(() => '?').join(',')})`,
      STORE_KEYS
    );

    const defaults = {
      site_title: 'Jijai Masale',
      support_number: '8468953130',
      support_email: 'support@jijaimasale.in',
      copyright_details: '© 2024 Jijai Masale',
      address: '#262-265, Time Square Empire, Goa',
      system_timezone: 'Asia/Kolkata',
      tax_name: 'GST Number',
      tax_number: '',
      low_stock_limit: '15',
      customer_app_maintenance_msg: '',
      delivery_boy_maintenance_msg: '',
      logo: '',
      global_free_delivery_threshold: '500',
      refer_earn_status: '1',
      refer_earn_method: 'Percentage (%)',
      refer_earn_bonus: '10',
      refer_earn_min_order: '100',
      store_setting_enable_cart_button: '1',
      store_setting_expand_product_images: '0',
      store_setting_enable_local_pickup: '0',
      store_setting_zipcode_wise_delivery: '1',
      store_setting_order_delivery_otp: '1',
      store_setting_system_status: '1',
      store_setting_customer_app_maintenance: '0',
      store_setting_delivery_boy_maintenance: '0',
      store_setting_google_login: '1',
      store_setting_apple_login: '0',
      store_setting_whatsapp_share: '1',
      store_setting_pincode_wise: '1',
      store_setting_city_wise: '0',
      store_setting_wallet_balance: '0',
      store_setting_android_version: '1.0.0',
      store_setting_ios_version: '1.0.0'
    };

    const data = { ...defaults };
    rows.forEach((row) => {
      data[row.variable] = row.value ?? defaults[row.variable];
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error('[GET /api/config/store] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load store settings' });
  }
});

// PUT /api/config/store - Update store settings
router.put('/store', protect, adminOnly, async (req, res) => {
  try {
    const KEY_SYNC_MAP = {
      site_title: 'site_name',
      support_number: 'contact_phone',
      support_email: 'contact_email',
      copyright_details: 'footer_text',
      address: 'contact_address'
    };

    const keys = Object.keys(req.body);
    for (const key of keys) {
      if (STORE_KEYS.includes(key)) {
        const val = req.body[key] !== undefined && req.body[key] !== null ? String(req.body[key]) : '';
        
        await pool.query(
          `INSERT INTO settings (variable, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?`,
          [key, val, val]
        );

        if (KEY_SYNC_MAP[key]) {
          const syncKey = KEY_SYNC_MAP[key];
          await pool.query(
            `INSERT INTO settings (variable, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?`,
            [syncKey, val, val]
          );
        }
      }
    }
    res.json({ success: true, message: 'Store settings updated successfully!' });
  } catch (err) {
    console.error('[PUT /api/config/store] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update store settings' });
  }
});

// POST /api/config/store/logo - Upload store logo
router.post('/store/logo', protect, adminOnly, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No logo file uploaded' });
    }
    const logoPath = `/uploads/${req.file.filename}`;
    await pool.query(
      `INSERT INTO settings (variable, value) VALUES ('logo', ?) ON DUPLICATE KEY UPDATE value = ?`,
      [logoPath, logoPath]
    );
    res.json({ success: true, message: 'Logo uploaded successfully', logo_url: logoPath });
  } catch (err) {
    console.error('[POST /api/config/store/logo] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to upload logo' });
  }
});

// ────────────────────────────────────────────────
// THEMES SETTINGS ENDPOINTS
// ────────────────────────────────────────────────
router.get('/themes', protect, adminOnly, async (req, res) => {
  try {
    const [themes] = await pool.query('SELECT * FROM themes ORDER BY id ASC');
    const [settingsRows] = await pool.query(
      `SELECT variable, value FROM settings WHERE variable IN (
        'theme_classic_primary_color',
        'theme_classic_secondary_color',
        'theme_classic_font_color',
        'theme_color'
      )`
    );

    const settings = {
      theme_classic_primary_color: '',
      theme_classic_secondary_color: '',
      theme_classic_font_color: '',
      theme_color: 'default'
    };

    settingsRows.forEach(row => {
      settings[row.variable] = row.value || '';
    });

    res.json({
      success: true,
      themes,
      settings
    });
  } catch (err) {
    console.error('[GET /api/config/themes] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load theme settings' });
  }
});

router.put('/themes', protect, adminOnly, async (req, res) => {
  const { theme_color, theme_classic_primary_color, theme_classic_secondary_color, theme_classic_font_color } = req.body;
  try {
    const vars = {
      theme_color: theme_color || 'default',
      theme_classic_primary_color: theme_classic_primary_color || '',
      theme_classic_secondary_color: theme_classic_secondary_color || '',
      theme_classic_font_color: theme_classic_font_color || ''
    };

    for (const [key, val] of Object.entries(vars)) {
      await pool.query(
        `INSERT INTO settings (variable, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?`,
        [key, val, val]
      );
    }

    // Update themes table default flag based on selected slug
    if (theme_color) {
      await pool.query('UPDATE themes SET is_default = 0');
      await pool.query('UPDATE themes SET is_default = 1 WHERE slug = ?', [theme_color]);
    }

    res.json({ success: true, message: 'Theme settings updated successfully!' });
  } catch (err) {
    console.error('[PUT /api/config/themes] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update theme settings' });
  }
});

// ────────────────────────────────────────────────
// LANGUAGES SETTINGS ENDPOINTS
// ────────────────────────────────────────────────
router.get('/languages', protect, adminOnly, async (req, res) => {
  try {
    const [languages] = await pool.query('SELECT * FROM languages ORDER BY id ASC');
    const [settingsRows] = await pool.query("SELECT value FROM settings WHERE variable = 'default_language'");
    const defaultLanguage = settingsRows[0]?.value || 'en';

    res.json({
      success: true,
      languages,
      default_language: defaultLanguage
    });
  } catch (err) {
    console.error('[GET /api/config/languages] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load languages' });
  }
});

router.post('/languages', protect, adminOnly, async (req, res) => {
  const { language, code, is_rtl } = req.body;
  if (!language?.trim() || !code?.trim()) {
    return res.status(400).json({ success: false, message: 'Language name and code are required' });
  }
  try {
    await pool.query(
      'INSERT INTO languages (language, code, is_rtl) VALUES (?, ?, ?)',
      [language.trim(), code.trim().toLowerCase(), is_rtl ? 1 : 0]
    );
    res.json({ success: true, message: 'Language added successfully!' });
  } catch (err) {
    console.error('[POST /api/config/languages] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to add language' });
  }
});

router.put('/languages/default', protect, adminOnly, async (req, res) => {
  const { default_language } = req.body;
  if (!default_language?.trim()) {
    return res.status(400).json({ success: false, message: 'Default language code is required' });
  }
  try {
    const val = default_language.trim().toLowerCase();
    await pool.query(
      `INSERT INTO settings (variable, value) VALUES ('default_language', ?) ON DUPLICATE KEY UPDATE value = ?`,
      [val, val]
    );
    res.json({ success: true, message: 'Default language updated successfully!' });
  } catch (err) {
    console.error('[PUT /api/config/languages/default] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update default language' });
  }
});

router.put('/languages/:id', protect, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { language, code, is_rtl } = req.body;
  if (!language?.trim() || !code?.trim()) {
    return res.status(400).json({ success: false, message: 'Language name and code are required' });
  }
  try {
    await pool.query(
      'UPDATE languages SET language = ?, code = ?, is_rtl = ? WHERE id = ?',
      [language.trim(), code.trim().toLowerCase(), is_rtl ? 1 : 0, id]
    );
    res.json({ success: true, message: 'Language updated successfully!' });
  } catch (err) {
    console.error('[PUT /api/config/languages/:id] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update language' });
  }
});

router.delete('/languages/:id', protect, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM languages WHERE id = ?', [id]);
    res.json({ success: true, message: 'Language deleted successfully!' });
  } catch (err) {
    console.error('[DELETE /api/config/languages/:id] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete language' });
  }
});

// ────────────────────────────────────────────────
// FIREBASE SETTINGS ENDPOINTS
// ────────────────────────────────────────────────
router.get('/firebase', protect, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT value FROM settings WHERE variable = 'firebase_settings'");
    let settings = {
      apiKey: '',
      authDomain: '',
      databaseURL: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
      measurementId: ''
    };
    if (rows[0]?.value) {
      try {
        settings = { ...settings, ...JSON.parse(rows[0].value) };
      } catch (e) {
        console.warn('Failed to parse database firebase_settings JSON');
      }
    }
    res.json({ success: true, data: settings });
  } catch (err) {
    console.error('[GET /api/config/firebase] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load Firebase settings' });
  }
});

router.put('/firebase', protect, adminOnly, async (req, res) => {
  try {
    const val = JSON.stringify(req.body);
    await pool.query(
      `INSERT INTO settings (variable, value) VALUES ('firebase_settings', ?) ON DUPLICATE KEY UPDATE value = ?`,
      [val, val]
    );
    res.json({ success: true, message: 'Firebase settings updated successfully!' });
  } catch (err) {
    console.error('[PUT /api/config/firebase] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update Firebase settings' });
  }
});

export default router;