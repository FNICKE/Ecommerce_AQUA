// controllers/offerController.js
import pool from '../config/db.js';

// ── Migrate the existing offers table to add missing columns ────────────────
let tableMigrated = false;
const ensureOffersTable = async () => {
  if (tableMigrated) return;
  try {
    // Create table if it doesn't exist at all (with full schema)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS offers (
        id           INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
        type         VARCHAR(50)  NULL,
        type_id      INT          NULL DEFAULT 0,
        title        VARCHAR(255) NULL,
        min_discount INT          NULL DEFAULT 0,
        max_discount INT          NULL DEFAULT 0,
        image        VARCHAR(512) NOT NULL,
        link         VARCHAR(512) NULL DEFAULT '0',
        is_active    TINYINT(1)   NOT NULL DEFAULT 1,
        date_added   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Add title column if missing
    try {
      await pool.query(`ALTER TABLE offers ADD COLUMN title VARCHAR(255) NULL AFTER type_id`);
    } catch { /* column already exists, ignore */ }

    // Add is_active column if missing
    try {
      await pool.query(`ALTER TABLE offers ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER link`);
    } catch { /* column already exists, ignore */ }

    tableMigrated = true;
    console.log('✅ offers table ready');
  } catch (err) {
    console.error('❌ ensureOffersTable error:', err.message);
    throw err;
  }
};

// ── GET all offers (admin) ──────────────────────────────────────────────────
export const getOffers = async (req, res) => {
  try {
    await ensureOffersTable();

    const [offers] = await pool.query(
      `SELECT * FROM offers ORDER BY date_added DESC`
    );

    // Enrich with category names where applicable
    for (const offer of offers) {
      if (offer.type === 'categories' && offer.type_id) {
        try {
          const [catRows] = await pool.query(
            'SELECT name FROM categories WHERE id = ?',
            [offer.type_id]
          );
          offer.category_name = catRows[0]?.name || null;
        } catch {
          offer.category_name = null;
        }
      } else {
        offer.category_name = null;
      }
    }

    res.json({ success: true, offers });
  } catch (err) {
    console.error('getOffers error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET single offer ────────────────────────────────────────────────────────
export const getOfferById = async (req, res) => {
  try {
    await ensureOffersTable();
    const [rows] = await pool.query('SELECT * FROM offers WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Offer not found' });
    res.json({ success: true, offer: rows[0] });
  } catch (err) {
    console.error('getOfferById error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── CREATE offer ────────────────────────────────────────────────────────────
export const createOffer = async (req, res) => {
  try {
    await ensureOffersTable();
    const { type, type_id, title, min_discount, max_discount, link, image, is_active } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, message: 'Image is required' });
    }

    const [result] = await pool.query(
      `INSERT INTO offers (type, type_id, title, min_discount, max_discount, link, image, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        type || 'all',
        type_id ? Number(type_id) : 0,
        title || null,
        Number(min_discount) || 0,
        Number(max_discount) || 0,
        link || '0',
        image,
        is_active !== undefined ? Number(is_active) : 1
      ]
    );

    res.status(201).json({ success: true, message: 'Offer created successfully', offerId: result.insertId });
  } catch (err) {
    console.error('createOffer error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── UPDATE offer ────────────────────────────────────────────────────────────
export const updateOffer = async (req, res) => {
  try {
    await ensureOffersTable();
    const { id } = req.params;
    const { type, type_id, title, min_discount, max_discount, link, image, is_active } = req.body;

    const [existing] = await pool.query('SELECT * FROM offers WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Offer not found' });

    const row = existing[0];
    await pool.query(
      `UPDATE offers
       SET type = ?, type_id = ?, title = ?, min_discount = ?, max_discount = ?,
           link = ?, image = ?, is_active = ?
       WHERE id = ?`,
      [
        type          ?? row.type,
        type_id       !== undefined ? Number(type_id) : row.type_id,
        title         !== undefined ? (title || null) : row.title,
        Number(min_discount) || 0,
        Number(max_discount) || 0,
        link          !== undefined ? (link || '0') : row.link,
        image         || row.image,
        is_active     !== undefined ? Number(is_active) : row.is_active,
        id
      ]
    );

    res.json({ success: true, message: 'Offer updated successfully' });
  } catch (err) {
    console.error('updateOffer error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── TOGGLE offer active status ──────────────────────────────────────────────
export const toggleOfferStatus = async (req, res) => {
  try {
    await ensureOffersTable();
    const { id } = req.params;
    await pool.query(
      'UPDATE offers SET is_active = IF(is_active = 1, 0, 1) WHERE id = ?',
      [id]
    );
    const [rows] = await pool.query('SELECT is_active FROM offers WHERE id = ?', [id]);
    res.json({ success: true, is_active: rows[0]?.is_active });
  } catch (err) {
    console.error('toggleOfferStatus error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE offer ────────────────────────────────────────────────────────────
export const deleteOffer = async (req, res) => {
  try {
    await ensureOffersTable();
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM offers WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Offer not found' });
    res.json({ success: true, message: 'Offer deleted successfully' });
  } catch (err) {
    console.error('deleteOffer error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUBLIC: active offers (for homepage / offer page banner) ────────────────
export const getPublicOffers = async (req, res) => {
  try {
    await ensureOffersTable();

    // If is_active column doesn't exist yet, fall back to all rows
    let offers;
    try {
      [offers] = await pool.query(
        `SELECT * FROM offers WHERE is_active = 1 ORDER BY date_added DESC`
      );
    } catch {
      [offers] = await pool.query(
        `SELECT * FROM offers ORDER BY date_added DESC`
      );
    }

    // Enrich with category names
    for (const offer of offers) {
      if (offer.type === 'categories' && offer.type_id) {
        try {
          const [catRows] = await pool.query(
            'SELECT name FROM categories WHERE id = ?',
            [offer.type_id]
          );
          offer.category_name = catRows[0]?.name || null;
        } catch {
          offer.category_name = null;
        }
      } else {
        offer.category_name = null;
      }
    }

    res.json({ success: true, offers });
  } catch (err) {
    console.error('getPublicOffers error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Offer Sliders controllers (for /admin/offer-slider page) ─────────────────
export const getOfferSliders = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM sliders ORDER BY id DESC'
    );
    res.json({ success: true, sliders: rows });
  } catch (err) {
    console.error('getOfferSliders error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createOfferSlider = async (req, res) => {
  try {
    const { type, typeId, image, link } = req.body;
    const typeVal = type || 'default';
    const typeIdVal = typeId ? Number(typeId) : 0;

    if (!image) {
      return res.status(400).json({ success: false, message: 'Image is required' });
    }

    const [result] = await pool.query(
      `INSERT INTO sliders (type, type_id, image, link, badge, title, subtitle, cta_text, cta_link)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        typeVal,
        typeIdVal,
        image,
        link || '',
        'Premium Collection',
        typeVal === 'categories' ? 'Category Offer' : 'Special Collection',
        'Straight from the farm to your kitchen.',
        'Shop Collection',
        link || (typeVal === 'categories' ? `/category/${typeIdVal}` : '/products')
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Slider added successfully',
      slider: {
        id: result.insertId,
        type: typeVal,
        type_id: typeIdVal,
        image,
        link: link || ''
      }
    });
  } catch (err) {
    console.error('createOfferSlider error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteOfferSlider = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM sliders WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Slider not found' });
    }
    res.json({ success: true, message: 'Slider deleted successfully' });
  } catch (err) {
    console.error('deleteOfferSlider error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
