import pool from '../config/db.js';

let tableReady = false;

export async function ensurePaymentLogsTable() {
  if (tableReady) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS razorpay_payment_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      store_order_id INT NULL,
      razorpay_order_id VARCHAR(100) NULL,
      razorpay_payment_id VARCHAR(100) NULL,
      amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
      amount_paise INT NOT NULL DEFAULT 0,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      status ENUM('initiated', 'paid', 'failed', 'cancelled') NOT NULL DEFAULT 'initiated',
      customer_name VARCHAR(255) NULL,
      customer_email VARCHAR(255) NULL,
      customer_mobile VARCHAR(30) NULL,
      error_message TEXT NULL,
      meta JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_store_order_id (store_order_id),
      INDEX idx_razorpay_order_id (razorpay_order_id),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  tableReady = true;
}

export async function createPaymentLog({
  userId = null,
  razorpayOrderId = null,
  amount = 0,
  amountPaise = 0,
  currency = 'INR',
  status = 'initiated',
  customerName = null,
  customerEmail = null,
  customerMobile = null,
  meta = null,
}) {
  await ensurePaymentLogsTable();

  const [result] = await pool.query(
    `INSERT INTO razorpay_payment_logs (
      user_id, razorpay_order_id, amount, amount_paise, currency, status,
      customer_name, customer_email, customer_mobile, meta
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      razorpayOrderId,
      Number(amount) || 0,
      Number(amountPaise) || 0,
      currency,
      status,
      customerName,
      customerEmail,
      customerMobile,
      meta ? JSON.stringify(meta) : null,
    ]
  );

  return result.insertId;
}

export async function updatePaymentLogByRazorpayOrderId(razorpayOrderId, updates = {}) {
  if (!razorpayOrderId) return null;

  await ensurePaymentLogsTable();

  const fields = [];
  const values = [];

  const allowed = {
    status: 'status',
    store_order_id: 'storeOrderId',
    razorpay_payment_id: 'razorpayPaymentId',
    error_message: 'errorMessage',
    meta: 'meta',
  };

  for (const [column, key] of Object.entries(allowed)) {
    if (updates[key] !== undefined) {
      fields.push(`${column} = ?`);
      values.push(key === 'meta' && updates[key] != null ? JSON.stringify(updates[key]) : updates[key]);
    }
  }

  if (!fields.length) return null;

  const [latest] = await pool.query(
    'SELECT id FROM razorpay_payment_logs WHERE razorpay_order_id = ? ORDER BY id DESC LIMIT 1',
    [razorpayOrderId]
  );

  if (!latest.length) return null;

  values.push(latest[0].id);

  const [result] = await pool.query(
    `UPDATE razorpay_payment_logs SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  return result.affectedRows;
}

export async function listPaymentLogsForAdmin({
  status,
  search,
  fromDate,
  toDate,
  page = 1,
  limit = 25,
}) {
  await ensurePaymentLogsTable();

  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 100);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const where = ['1=1'];
  const params = [];

  if (status && status !== 'all') {
    where.push('l.status = ?');
    params.push(status);
  }

  if (fromDate) {
    where.push('DATE(l.created_at) >= ?');
    params.push(fromDate);
  }

  if (toDate) {
    where.push('DATE(l.created_at) <= ?');
    params.push(toDate);
  }

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    where.push(`(
      l.razorpay_order_id LIKE ? OR
      l.razorpay_payment_id LIKE ? OR
      l.customer_name LIKE ? OR
      l.customer_email LIKE ? OR
      l.customer_mobile LIKE ? OR
      CAST(l.store_order_id AS CHAR) LIKE ? OR
      u.username LIKE ? OR
      u.email LIKE ?
    )`);
    params.push(term, term, term, term, term, term, term, term);
  }

  const whereClause = where.join(' AND ');

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM razorpay_payment_logs l
     LEFT JOIN users u ON u.id = l.user_id
     WHERE ${whereClause}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT
      l.id,
      l.user_id,
      l.store_order_id,
      l.razorpay_order_id,
      l.razorpay_payment_id,
      l.amount,
      l.amount_paise,
      l.currency,
      l.status,
      l.customer_name,
      l.customer_email,
      l.customer_mobile,
      l.error_message,
      l.meta,
      l.created_at,
      l.updated_at,
      u.username AS user_username,
      u.email AS user_email
     FROM razorpay_payment_logs l
     LEFT JOIN users u ON u.id = l.user_id
     WHERE ${whereClause}
     ORDER BY l.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, safeLimit, offset]
  );

  const logs = rows.map((row) => ({
    ...row,
    meta: row.meta ? (typeof row.meta === 'string' ? JSON.parse(row.meta) : row.meta) : null,
  }));

  return {
    logs,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: countRows[0]?.total || 0,
      totalPages: Math.ceil((countRows[0]?.total || 0) / safeLimit) || 1,
    },
  };
}

export async function getPaymentLogStats() {
  await ensurePaymentLogsTable();

  const [rows] = await pool.query(`
    SELECT
      COUNT(*) AS total,
      SUM(status = 'paid') AS paid,
      SUM(status = 'failed') AS failed,
      SUM(status = 'cancelled') AS cancelled,
      SUM(status = 'initiated') AS initiated,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS paid_amount
    FROM razorpay_payment_logs
  `);

  return rows[0] || { total: 0, paid: 0, failed: 0, cancelled: 0, initiated: 0, paid_amount: 0 };
}

export async function ensurePayuTransactionsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payu_transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      txnid VARCHAR(100) UNIQUE NOT NULL,
      user_id INT NOT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      order_payload LONGTEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'initiated',
      mihpayid VARCHAR(100) DEFAULT NULL,
      store_order_id INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

export async function listPayuPaymentLogsForAdmin({
  status,
  search,
  fromDate,
  toDate,
  page = 1,
  limit = 25,
}) {
  await ensurePayuTransactionsTable();

  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 100);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const where = ['1=1'];
  const params = [];

  // PayU uses 'success' for paid
  if (status && status !== 'all') {
    if (status === 'paid') {
      where.push("t.status = 'success'");
    } else {
      where.push('t.status = ?');
      params.push(status);
    }
  }

  if (fromDate) {
    where.push('DATE(t.created_at) >= ?');
    params.push(fromDate);
  }

  if (toDate) {
    where.push('DATE(t.created_at) <= ?');
    params.push(toDate);
  }

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    where.push(`(
      t.txnid LIKE ? OR
      t.mihpayid LIKE ? OR
      CAST(t.store_order_id AS CHAR) LIKE ? OR
      u.username LIKE ? OR
      u.email LIKE ?
    )`);
    params.push(term, term, term, term, term);
  }

  const whereClause = where.join(' AND ');

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM payu_transactions t
     LEFT JOIN users u ON u.id = t.user_id
     WHERE ${whereClause}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT
      t.id,
      t.user_id,
      t.store_order_id,
      t.txnid,
      t.amount,
      t.status,
      t.mihpayid,
      t.created_at,
      u.username AS user_username,
      u.email AS user_email
     FROM payu_transactions t
     LEFT JOIN users u ON u.id = t.user_id
     WHERE ${whereClause}
     ORDER BY t.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, safeLimit, offset]
  );

  return {
    logs: rows,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: countRows[0]?.total || 0,
      totalPages: Math.ceil((countRows[0]?.total || 0) / safeLimit) || 1,
    },
  };
}

export async function getPayuPaymentLogStats() {
  await ensurePayuTransactionsTable();

  const [rows] = await pool.query(`
    SELECT
      COUNT(*) AS total,
      SUM(status = 'success') AS paid,
      SUM(status = 'failed') AS failed,
      SUM(status = 'initiated') AS initiated,
      COALESCE(SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END), 0) AS paid_amount
    FROM payu_transactions
  `);

  const s = rows[0] || {};
  return {
    total: s.total || 0,
    paid: s.paid || 0,
    failed: s.failed || 0,
    cancelled: 0,
    initiated: s.initiated || 0,
    paid_amount: s.paid_amount || 0,
  };
}
