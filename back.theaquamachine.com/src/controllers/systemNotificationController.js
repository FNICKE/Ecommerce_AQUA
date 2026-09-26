import pool from '../config/db.js';

// Admin: list system notifications with optional search and read filter
export const getSystemNotificationsAdmin = async (req, res) => {
  try {
    const { search, status } = req.query; // status: all | read | unread

    const whereClauses = [];
    const params = [];

    if (search) {
      whereClauses.push('(title LIKE ? OR message LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    // Assume schema has "read_by" column (string / nullable).
    if (status === 'read') {
      whereClauses.push('read_by IS NOT NULL AND read_by <> ""');
    } else if (status === 'unread') {
      whereClauses.push('(read_by IS NULL OR read_by = "")');
    }

    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `
      SELECT
        id,
        title,
        message,
        type,
        type_id,
        read_by,
        date_created
      FROM system_notification
      ${whereSQL}
      ORDER BY id DESC
      `
      ,
      params
    );

    res.json({ success: true, notifications: rows });
  } catch (err) {
    console.error('getSystemNotificationsAdmin error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

