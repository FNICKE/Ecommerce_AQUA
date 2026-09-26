import pool from '../config/db.js';

let tablesReady = false;

export async function ensureReviewsAndBlogsTables() {
  if (tablesReady) return;

  try {
    // 1. Reviews Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        designation VARCHAR(255) NULL,
        review TEXT NOT NULL,
        stars INT NOT NULL DEFAULT 5,
        image VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 2. Blogs Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blogs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        image VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    tablesReady = true;
    console.log('✅ Reviews and blogs database tables verified/created successfully');
  } catch (error) {
    console.error('❌ Failed to ensure reviews and blogs tables:', error.message);
    throw error;
  }
}
