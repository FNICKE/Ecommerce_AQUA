import pool from '../config/db.js';

export const getHomeProducts = async (req, res) => {
  try {
    console.log('getHomeProducts endpoint called');

    // Step 1: Fetch featured sections
    const [sections] = await pool.query(`
      SELECT 
        id,
        title,
        short_description,
        category_name,
        product_type,
        \`order\`,
        created_at
      FROM featured_sections
      ORDER BY \`order\` ASC, created_at DESC
      LIMIT 8
    `);

    console.log(`Found ${sections.length} featured sections`);

    if (sections.length === 0) {
      console.log('No featured sections found → returning empty array');
      return res.json({ categories: [] });
    }

    const result = [];

    for (const sec of sections) {
      console.log(`Processing section: ${sec.title} (id: ${sec.id})`);

      let sql = `
        SELECT 
          p.id, p.name, p.description, p.image, p.slug, p.date_added as created_at,
          pv.id AS default_variant_id,
          COALESCE(pv.price, 0) as price,
          COALESCE(pv.special_price, 0) as special_price,
          pv.stock
        FROM products p
        LEFT JOIN product_variants pv ON p.id = pv.product_id AND pv.status = 1
        WHERE p.status = 1
      `;
      const params = [];

      // Only add category filter if the category exists and has active products (including subcategories)
      let useCategoryFilter = false;
      if (sec.category_name && sec.category_name.trim() !== '') {
        try {
          const [catCount] = await pool.query(
            `SELECT COUNT(*) as cnt 
             FROM products p 
             JOIN categories c ON p.category_id = c.id 
             WHERE (c.name = ? OR c.parent_id = (SELECT id FROM categories WHERE name = ? LIMIT 1)) AND p.status = 1`, 
            [sec.category_name.trim(), sec.category_name.trim()]
          );
          if (catCount && catCount[0] && catCount[0].cnt > 0) {
            useCategoryFilter = true;
          }
        } catch (cntErr) {
          console.error('Error counting category products:', cntErr.message);
        }
      }

      if (useCategoryFilter) {
        sql += ' AND (p.category_id = (SELECT id FROM categories WHERE name = ? LIMIT 1) OR p.category_id IN (SELECT id FROM categories WHERE parent_id = (SELECT id FROM categories WHERE name = ? LIMIT 1)))';
        params.push(sec.category_name.trim(), sec.category_name.trim());
        console.log(`Filtering products by category_name = "${sec.category_name.trim()}" (including subcategories)`);
      } else {
        console.log('No active products in category or no category_name → showing all active products as fallback');
      }

      // Sorting & limit
      if (sec.product_type === 'New Added Products') {
        sql += ' ORDER BY p.date_added DESC LIMIT 10';
        console.log('Sorting: Newest first, limit 10');
      } else {
        sql += ' ORDER BY p.name ASC LIMIT 12';
        console.log('Sorting: Alphabetical, limit 12');
      }

      let products = [];
      try {
        [products] = await pool.query(sql, params);
        console.log(`Found ${products.length} products for section ${sec.title}`);
      } catch (productErr) {
        console.error(`Product query failed for section ${sec.title}:`, productErr.message);
        // Don't crash - continue with empty products
      }

      result.push({
        category: {
          id: sec.id,
          name: sec.title || 'Featured Collection',
          description: sec.short_description || '',
        },
        products,
      });
    }

    console.log(`Returning ${result.length} sections`);
    res.json({ categories: result });
  } catch (err) {
    console.error('getHomeProducts CRASH:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({
      message: 'Server error loading home content',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    });
  }
};