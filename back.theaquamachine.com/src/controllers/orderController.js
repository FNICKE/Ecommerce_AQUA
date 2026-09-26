import crypto from 'crypto';
import pool from '../config/db.js';
import {
  createRazorpayGatewayOrder,
  fetchRazorpayGatewayOrder,
  getPaymentSettings,
  verifyRazorpaySignature,
} from './paymentController.js';
import {
  createPaymentLog,
  updatePaymentLogByRazorpayOrderId,
} from '../services/paymentLogService.js';
import { sendOrderEmail } from '../services/emailService.js';

// ─── Customer: Create Order ──────────────────────────────────────────────
const createOrderForUser = async ({
  userId,
  body,
  paymentMethod,
  status = 'pending',
  paymentNote = '',
}) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { 
      address_id, 
      items, 
      total, 
      payment_method = 'cod', 
      mobile = '', 
      promo_code = null, 
      promo_discount = 0, 
      final_total = null,
      wallet_balance = 0,
      delivery_charge = 0,
      notes = ''
    } = body;

    if (!items || !items.length) {
      const error = new Error('No items in order');
      error.statusCode = 400;
      throw error;
    }

    for (const item of items) {
      const [variant] = await connection.query(
        'SELECT stock, price FROM product_variants WHERE id = ? AND status = 1',
        [item.product_variant_id]
      );
      if (!variant.length) throw new Error('Invalid variant');
      if (variant[0].stock < item.qty) throw new Error(`Not enough stock for item ${item.product_variant_id}`);

      await connection.query(
        'UPDATE product_variants SET stock = stock - ? WHERE id = ?',
        [item.qty, item.product_variant_id]
      );
    }

    // Fetch user mobile if not provided
    let userMobile = mobile;
    if (!userMobile) {
      const [userRow] = await connection.query('SELECT mobile FROM users WHERE id = ?', [userId]);
      userMobile = userRow[0]?.mobile || '';
    }

    const finalTotalToUse = final_total !== null ? parseFloat(final_total) : total;
    const notesToSave = [notes || '', paymentNote].filter(Boolean).join('\n');

    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        user_id, address_id, mobile, total, final_total, 
        payment_method, status, promo_code, promo_discount,
        wallet_balance, delivery_charge, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, 
        address_id || null, 
        userMobile, 
        total, 
        finalTotalToUse, 
        paymentMethod || payment_method,
        status,
        promo_code || null, 
        parseFloat(promo_discount) || 0,
        parseFloat(wallet_balance) || 0,
        parseFloat(delivery_charge) || 0,
        notesToSave
      ]
    );

    const orderId = orderResult.insertId;

    for (const item of items) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_variant_id, quantity, price) VALUES (?, ?, ?, ?)`,
        [orderId, item.product_variant_id, item.qty, item.price]
      );
    }

    await connection.query('DELETE FROM cart WHERE user_id = ?', [userId]);
    await connection.commit();

    return { orderId };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

export const createOrder = async (req, res) => {
  try {
    const paymentMethod = req.body.payment_method || 'cod';

    if (paymentMethod === 'razorpay' || paymentMethod === 'online') {
      return res.status(400).json({
        success: false,
        message: 'Please complete Razorpay payment before placing an online order',
      });
    }

    const paymentSettings = await getPaymentSettings();
    if (paymentMethod === 'cod' && !paymentSettings.cod_enabled) {
      return res.status(400).json({ success: false, message: 'Cash on Delivery is currently disabled' });
    }

    const { orderId } = await createOrderForUser({
      userId: req.user.id,
      body: req.body,
      paymentMethod: 'cod',
    });

    sendOrderEmail(orderId).catch(err => console.error('Async order email send error:', err));

    res.status(201).json({ success: true, orderId, message: 'Order created successfully' });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message || 'Failed to create order' });
  }
};

export const createRazorpayOrder = async (req, res) => {
  try {
    const orderPayload = req.body.order || {};
    const amount = Number(req.body.amount || orderPayload.final_total || 0);
    const amountInPaise = Math.round(amount * 100);

    const { gatewayOrder, keyId } = await createRazorpayGatewayOrder({
      amount,
      receipt: `rzp_${req.user.id}_${Date.now()}`,
      notes: {
        user_id: String(req.user.id),
        source: 'checkout',
        final_total: String(amount),
      },
    });

    const [userRows] = await pool.query(
      'SELECT username, email, mobile FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );
    const userRow = userRows[0] || {};

    await createPaymentLog({
      userId: req.user.id,
      razorpayOrderId: gatewayOrder.id,
      amount,
      amountPaise: gatewayOrder.amount ?? amountInPaise,
      currency: gatewayOrder.currency || 'INR',
      status: 'initiated',
      customerName: userRow.username || null,
      customerEmail: userRow.email || null,
      customerMobile: userRow.mobile || null,
      meta: {
        cart_total: orderPayload.total ?? null,
        promo_code: orderPayload.promo_code ?? null,
        promo_discount: orderPayload.promo_discount ?? null,
        delivery_charge: orderPayload.delivery_charge ?? null,
        wallet_balance: orderPayload.wallet_balance ?? null,
      },
    });

    res.json({
      success: true,
      keyId,
      order: {
        id: gatewayOrder.id,
        amount: gatewayOrder.amount,
        currency: gatewayOrder.currency || 'INR',
      },
    });
  } catch (err) {
    console.error('createRazorpayOrder error:', err.response?.data || err.message);
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.response?.data?.error?.description || err.message || 'Failed to create Razorpay order',
    });
  }
};

export const verifyRazorpayPaymentAndCreateOrder = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order) {
      return res.status(400).json({ success: false, message: 'Missing Razorpay payment verification details' });
    }

    const isValidSignature = await verifyRazorpaySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValidSignature) {
      await updatePaymentLogByRazorpayOrderId(razorpay_order_id, {
        status: 'failed',
        razorpayPaymentId: razorpay_payment_id,
        errorMessage: 'Razorpay payment verification failed (invalid signature)',
      });
      return res.status(400).json({ success: false, message: 'Razorpay payment verification failed' });
    }

    const gatewayOrder = await fetchRazorpayGatewayOrder(razorpay_order_id);
    const expectedAmount = Math.round(Number(order.final_total || 0) * 100);

    if (gatewayOrder.amount !== expectedAmount) {
      await updatePaymentLogByRazorpayOrderId(razorpay_order_id, {
        status: 'failed',
        razorpayPaymentId: razorpay_payment_id,
        errorMessage: `Amount mismatch: expected ${expectedAmount} paise, got ${gatewayOrder.amount}`,
      });
      return res.status(400).json({ success: false, message: 'Razorpay amount does not match checkout total' });
    }

    const { orderId } = await createOrderForUser({
      userId: req.user.id,
      body: {
        ...order,
        payment_method: 'razorpay',
      },
      paymentMethod: 'razorpay',
      status: 'pending',
      paymentNote: [
        `Razorpay Order ID: ${razorpay_order_id}`,
        `Razorpay Payment ID: ${razorpay_payment_id}`,
      ].join('\n'),
    });

    sendOrderEmail(orderId).catch(err => console.error('Async order email send error:', err));

    await updatePaymentLogByRazorpayOrderId(razorpay_order_id, {
      status: 'paid',
      storeOrderId: orderId,
      razorpayPaymentId: razorpay_payment_id,
      errorMessage: null,
      meta: { verified_at: new Date().toISOString() },
    });

    res.status(201).json({
      success: true,
      orderId,
      paymentId: razorpay_payment_id,
      message: 'Payment verified and order created successfully',
    });
  } catch (err) {
    if (req.body?.razorpay_order_id) {
      await updatePaymentLogByRazorpayOrderId(req.body.razorpay_order_id, {
        status: 'failed',
        razorpayPaymentId: req.body.razorpay_payment_id || null,
        errorMessage: err.message || 'Failed to verify Razorpay payment',
      }).catch(() => {});
    }
    console.error('verifyRazorpayPaymentAndCreateOrder error:', err.response?.data || err.message);
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.response?.data?.error?.description || err.message || 'Failed to verify Razorpay payment',
    });
  }
};

// ─── Customer: My Orders ──────────────────────────────────────────────────
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const [orders] = await pool.query(
      `SELECT o.id, o.total, o.final_total, o.payment_method, o.status, o.date_added,
              o.delivery_charge, o.promo_discount, o.wallet_balance, o.notes
       FROM orders o
       WHERE o.user_id = ?
       ORDER BY o.date_added DESC`,
      [userId]
    );

    // Fetch items for each order (product name, image, weight, qty, price)
    if (orders.length > 0) {
      const orderIds = orders.map(o => o.id);
      const [allItems] = await pool.query(
        `SELECT 
           oi.order_id,
           oi.quantity,
           oi.price,
           p.id        AS product_id,
           p.name      AS product_name,
           p.image     AS product_image,
           pv.weight   AS variant_weight,
           pv.id       AS variant_id
         FROM order_items oi
         LEFT JOIN product_variants pv ON oi.product_variant_id = pv.id
         LEFT JOIN products p          ON pv.product_id = p.id
         WHERE oi.order_id IN (?)`,
        [orderIds]
      );

      // Group items by order_id
      const itemsByOrder = {};
      for (const item of allItems) {
        if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
        itemsByOrder[item.order_id].push(item);
      }

      // Attach items to each order
      for (const order of orders) {
        order.items = itemsByOrder[order.id] || [];
      }
    }


    res.json({ success: true, orders });
  } catch (err) {
    console.error('getUserOrders error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }

};

// ─── Customer: Get Single Order ───────────────────────────────────────────
export const getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (!orders.length) return res.status(404).json({ success: false, message: 'Order not found' });

    const [items] = await pool.query(
      `SELECT oi.*, p.name, p.image, pv.price, pv.weight, pv.id as variant_id
       FROM order_items oi
       LEFT JOIN product_variants pv ON oi.product_variant_id = pv.id
       LEFT JOIN products p ON pv.product_id = p.id
       WHERE oi.order_id = ?`,
      [id]
    );

    res.json({ success: true, order: { ...orders[0], items } });
  } catch (err) {
    console.error('getOrderById error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Customer: Cancel Order ───────────────────────────────────────────────
export const cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [existing] = await pool.query(
      'SELECT status FROM orders WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (!existing.length) return res.status(404).json({ success: false, message: 'Order not found' });
    if (['delivered', 'cancelled', 'returned'].includes(existing[0].status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel an order that is already ${existing[0].status}` });
    }

    await pool.query(
      'UPDATE orders SET status = "cancelled" WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    res.json({ success: true, message: 'Order cancelled successfully' });
  } catch (err) {
    console.error('cancelOrder error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Admin: Get ALL Orders (with filters) ─────────────────────────────────
export const getAllOrdersAdmin = async (req, res) => {
  try {
    const { status, payment_method, search, from_date, to_date, page = 1, limit = 10 } = req.query;

    const whereClauses = [];
    const params = [];

    if (status && status !== 'all') {
      whereClauses.push('o.status = ?');
      params.push(status);
    }
    if (payment_method && payment_method !== 'all') {
      whereClauses.push('o.payment_method = ?');
      params.push(payment_method);
    }
    if (search) {
      whereClauses.push('(CAST(o.id AS CHAR) LIKE ? OR u.username LIKE ? OR o.mobile LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (from_date) {
      whereClauses.push('DATE(o.date_added) >= ?');
      params.push(from_date);
    }
    if (to_date) {
      whereClauses.push('DATE(o.date_added) <= ?');
      params.push(to_date);
    }

    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // First query: count total filtered orders
    const [countRows] = await pool.query(`
      SELECT COUNT(DISTINCT o.id) as total
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ${whereSQL}
    `, params);
    const total = countRows[0]?.total || 0;

    // Second query: fetch paginated page rows
    const paginatedSQL = `
      SELECT
        o.id,
        o.user_id,
        o.mobile,
        o.total,
        o.delivery_charge,
        o.wallet_balance,
        o.promo_code,
        o.promo_discount,
        o.discount,
        o.final_total,
        o.payment_method,
        o.status,
        o.active_status,
        o.date_added,
        o.notes,
        o.seller_notes,
        o.is_pos_order,
        o.is_local_pickup,
        o.delivery_date,
        o.delivery_time,
        o.address,
        u.username  AS customer_name,
        u.email     AS customer_email,
        u.mobile    AS customer_mobile,
        u.image     AS customer_image
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ${whereSQL}
      ORDER BY o.date_added DESC
      LIMIT ? OFFSET ?
    `;

    const paginatedParams = [...params, Number(limit), (Number(page) - 1) * Number(limit)];
    const [rows] = await pool.query(paginatedSQL, paginatedParams);

    res.json({ success: true, orders: rows, total });
  } catch (err) {
    console.error('getAllOrdersAdmin error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

// ─── Admin: Update Order Status ────────────────────────────────────────────
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, active_status } = req.body;

    const validStatuses = ['pending', 'ready', 'awaiting', 'processed', 'shipped', 'delivered', 'cancelled', 'returned'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const setClauses = [];
    const params = [];
    if (status)                 { setClauses.push('status = ?');        params.push(status); }
    if (active_status !== undefined) { setClauses.push('active_status = ?'); params.push(active_status); }

    if (!setClauses.length) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    params.push(id);
    await pool.query(`UPDATE orders SET ${setClauses.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'Order status updated successfully' });
  } catch (err) {
    console.error('updateOrderStatus error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Admin: Order Tracking ─────────────────────────────────────────────────
export const getOrderTrackingAdmin = async (req, res) => {
  try {
    const { search } = req.query;
    const whereClauses = [];
    const params = [];

    if (search) {
      whereClauses.push('(CAST(ot.order_id AS CHAR) LIKE ? OR CAST(ot.id AS CHAR) LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [rows] = await pool.query(`
      SELECT
        ot.*,
        o.status   AS order_status,
        o.total,
        o.final_total,
        o.payment_method,
        o.date_added AS order_date,
        u.username AS customer_name,
        u.mobile   AS customer_mobile,
        u.email    AS customer_email
      FROM order_tracking ot
      LEFT JOIN orders o ON ot.order_id = o.id
      LEFT JOIN users u ON o.user_id = u.id
      ${whereSQL}
      ORDER BY ot.id DESC
    `, params);

    res.json({ success: true, tracking: rows });
  } catch (err) {
    console.error('getOrderTrackingAdmin error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Admin: Delete Order ──────────────────────────────────────────────────
export const deleteOrderAdmin = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;

    // Delete associated order tracking
    await connection.query('DELETE FROM order_tracking WHERE order_id = ?', [id]);

    // Delete order items
    await connection.query('DELETE FROM order_items WHERE order_id = ?', [id]);

    // Delete order
    const [result] = await connection.query('DELETE FROM orders WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    await connection.commit();
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (err) {
    await connection.rollback();
    console.error('deleteOrderAdmin error:', err.message);
    res.status(500).json({ success: false, message: 'Server error deleting order' });
  } finally {
    connection.release();
  }
};

// ─── Admin: Get Single Order (with items) ─────────────────────────────────
export const getOrderByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );
    if (!orders.length) return res.status(404).json({ success: false, message: 'Order not found' });

    const [items] = await pool.query(
      `SELECT oi.*, p.name, pv.price, pv.id as variant_id, pv.weight
       FROM order_items oi
       LEFT JOIN product_variants pv ON oi.product_variant_id = pv.id
       LEFT JOIN products p ON pv.product_id = p.id
       WHERE oi.order_id = ?`,
      [id]
    );

    const [tracking] = await pool.query(
      'SELECT courier_agency, tracking_id, url FROM order_tracking WHERE order_id = ? LIMIT 1',
      [id]
    );
    const trackingInfo = tracking.length ? tracking[0] : { courier_agency: '', tracking_id: '', url: '' };

    res.json({ success: true, order: { ...orders[0], items, ...trackingInfo } });
  } catch (err) {
    console.error('getOrderByIdAdmin error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Admin: Update Order details ──────────────────────────────────────────
export const updateOrderAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      active_status,
      delivery_boy_id,
      otp,
      is_pos_order,
      delivery_charge,
      is_delivery_charge_returnable,
      mobile,
      email,
      address,
      delivery_date,
      delivery_time,
      is_local_pickup,
      pickup_time,
      latitude,
      longitude,
      notes,
      seller_notes,
      attachments,
      courier_agency,
      tracking_id,
      url
    } = req.body;

    const fields = [];
    const params = [];

    const addField = (name, val) => {
      if (typeof val !== 'undefined') {
        fields.push(`${name} = ?`);
        params.push(val);
      }
    };

    addField('status', status);
    addField('active_status', active_status);
    addField('delivery_boy_id', delivery_boy_id ? parseInt(delivery_boy_id, 10) : null);
    addField('otp', otp ? parseInt(otp, 10) : 0);
    addField('is_pos_order', typeof is_pos_order !== 'undefined' ? (is_pos_order ? 1 : 0) : undefined);
    addField('delivery_charge', delivery_charge ? parseFloat(delivery_charge) : 0);
    addField('is_delivery_charge_returnable', typeof is_delivery_charge_returnable !== 'undefined' ? (is_delivery_charge_returnable ? 1 : 0) : undefined);
    addField('mobile', mobile);
    addField('email', email);
    addField('address', address);
    addField('delivery_date', delivery_date || null);
    addField('delivery_time', delivery_time || null);
    addField('is_local_pickup', typeof is_local_pickup !== 'undefined' ? (is_local_pickup ? 1 : 0) : undefined);
    addField('pickup_time', pickup_time || null);
    addField('latitude', latitude);
    addField('longitude', longitude);
    addField('notes', notes);
    addField('seller_notes', seller_notes);
    addField('attachments', attachments);

    if (fields.length > 0) {
      params.push(id);
      await pool.query(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`, params);
    }

    // Save/Update order tracking details
    if (typeof courier_agency !== 'undefined' || typeof tracking_id !== 'undefined' || typeof url !== 'undefined') {
      const [existing] = await pool.query('SELECT id FROM order_tracking WHERE order_id = ? LIMIT 1', [id]);
      if (existing.length) {
        await pool.query(
          'UPDATE order_tracking SET courier_agency = ?, tracking_id = ?, url = ? WHERE order_id = ?',
          [courier_agency || '', tracking_id || '', url || '', id]
        );
      } else {
        await pool.query(
          `INSERT INTO order_tracking (
            order_id, courier_agency, tracking_id, url,
            order_item_id, pickup_status, pickup_scheduled_date, pickup_token_number,
            status, pickup_generated_date, data, date,
            manifest_url, label_url, invoice_url
          ) VALUES (?, ?, ?, ?, '', 0, '', '', 0, '', '', '', '', '', '')`,
          [id, courier_agency || '', tracking_id || '', url || '']
        );
      }
    }

    res.json({ success: true, message: 'Order updated successfully' });
  } catch (err) {
    console.error('updateOrderAdmin error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Admin: Get Inventory Report (aggregated order items) ──────────────────────────────────
export const getInventoryReportAdmin = async (req, res) => {
  try {
    const { search } = req.query;

    const whereClauses = [];
    const params = [];

    whereClauses.push("o.status != 'cancelled'");

    if (search) {
      whereClauses.push("(p.name LIKE ? OR CAST(pv.id AS CHAR) LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [rows] = await pool.query(`
      SELECT
        p.name AS product_name,
        pv.id AS product_variant_id,
        pv.weight AS unit_of_measure,
        SUM(oi.quantity) AS total_units_sold,
        SUM(oi.quantity * oi.price) AS total_sales
      FROM order_items oi
      INNER JOIN orders o ON oi.order_id = o.id
      LEFT JOIN product_variants pv ON oi.product_variant_id = pv.id
      LEFT JOIN products p ON pv.product_id = p.id
      ${whereSQL}
      GROUP BY p.name, pv.id, pv.weight
      ORDER BY total_sales DESC
    `, params);

    res.json({ success: true, report: rows, total: rows.length });
  } catch (err) {
    console.error('getInventoryReportAdmin error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch inventory report' });
  }
};

let payuTableReady = false;
async function ensurePayuTransactionsTable() {
  if (payuTableReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payu_transactions (
      txnid VARCHAR(100) PRIMARY KEY,
      user_id INT NOT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      order_payload LONGTEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'initiated',
      mihpayid VARCHAR(100) DEFAULT NULL,
      store_order_id INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  payuTableReady = true;
}

export const createPayuOrderHash = async (req, res) => {
  try {
    const { amount, order, frontend_url } = req.body;
    if (!amount || !order || !frontend_url) {
      return res.status(400).json({ success: false, message: 'Missing required parameters: amount, order, and frontend_url are required' });
    }

    const settings = await getPaymentSettings();
    if (!settings.payu_enabled || !settings.payu_configured) {
      return res.status(400).json({ success: false, message: 'PayU is not active or configured' });
    }

    const txnid = `payu_${req.user.id}_${Date.now()}`;
    const user_id = req.user.id;

    // Get user details
    const [userRows] = await pool.query('SELECT username, email, mobile FROM users WHERE id = ? LIMIT 1', [user_id]);
    const userRow = userRows[0] || {};

    const formattedAmount = Number(amount).toFixed(2);
    const firstname = (userRow.username || 'Customer').trim().replace(/[^a-zA-Z0-9 ]/g, '') || 'Customer';
    const email = (userRow.email || 'customer@example.com').trim();
    
    let phone = (userRow.mobile || '').trim().replace(/\D/g, '');
    if (phone.length > 10) {
      phone = phone.slice(-10);
    }
    if (phone.length < 10) {
      phone = '9999999999';
    }

    const productinfo = `Order_${txnid}`.replace(/[^a-zA-Z0-9_]/g, '');

    // Calculate Hash: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt)
    const key = settings.payu_merchant_key;
    const salt = settings.payu_merchant_salt;
    
    const udf1 = '';
    const udf2 = '';
    const udf3 = '';
    const udf4 = '';
    const udf5 = '';

    const hashString = `${key}|${txnid}|${formattedAmount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    // Create a transaction log
    await ensurePayuTransactionsTable();
    await pool.query(
      `INSERT INTO payu_transactions (txnid, user_id, amount, order_payload, status)
       VALUES (?, ?, ?, ?, 'initiated')`,
      [txnid, user_id, Number(formattedAmount), JSON.stringify(order)]
    );

    // PayU Checkout Action Target URL
    const actionUrl = settings.payu_environment === 'live' 
      ? 'https://secure.payu.in/_payment' 
      : 'https://test.payu.in/_payment';

    // surl and furl point back to our backend callback URL
    const host = req.get('host') || '';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    const protocol = isLocal ? req.protocol : 'https';
    const backendUrl = `${protocol}://${host}`;
    const callbackBase = `${backendUrl}/api/orders/payu/callback`;
    const surl = `${callbackBase}?frontend_url=${encodeURIComponent(frontend_url)}&status=success`;
    const furl = `${callbackBase}?frontend_url=${encodeURIComponent(frontend_url)}&status=failed`;

    res.json({
      success: true,
      actionUrl,
      params: {
        key,
        txnid,
        amount: formattedAmount,
        productinfo,
        firstname,
        email,
        phone,
        surl,
        furl,
        hash,
        service_provider: 'payu_paisa'
      }
    });
  } catch (err) {
    console.error('createPayuOrderHash error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to initiate PayU payment' });
  }
};

export const handlePayuCallback = async (req, res) => {
  let frontend_url = req.query.frontend_url || 'https://theaquamachine.com';
  
  try {
    const settings = await getPaymentSettings();
    const salt = settings.payu_merchant_salt;
    
    // PayU sends the callback parameters in req.body
    const {
      key,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      status,
      hash: payuHash,
      mihpayid,
      udf1 = '',
      udf2 = '',
      udf3 = '',
      udf4 = '',
      udf5 = '',
      error_Message = ''
    } = req.body || {};

    if (!txnid || !key || !payuHash) {
      console.error('PayU callback missing key parameters:', req.body);
      return res.redirect(`${frontend_url}/checkout?error=payment_failed&msg=${encodeURIComponent('Invalid callback parameters')}`);
    }

    // Verify Hash: sha512(salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    const reverseHashString = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
    const calculatedHash = crypto.createHash('sha512').update(reverseHashString).digest('hex');

    if (calculatedHash !== payuHash) {
      console.error('PayU callback signature verification failed. Calculated:', calculatedHash, 'Received:', payuHash);
      return res.redirect(`${frontend_url}/checkout?error=payment_failed&msg=${encodeURIComponent('Signature verification failed')}`);
    }

    await ensurePayuTransactionsTable();

    // Check if the transaction is already success
    const [txRows] = await pool.query('SELECT * FROM payu_transactions WHERE txnid = ? LIMIT 1', [txnid]);
    if (!txRows.length) {
      console.error('PayU transaction not found for txnid:', txnid);
      return res.redirect(`${frontend_url}/checkout?error=payment_failed&msg=${encodeURIComponent('Transaction not found')}`);
    }

    const tx = txRows[0];

    if (status === 'success') {
      if (tx.status === 'success' && tx.store_order_id) {
        return res.redirect(`${frontend_url}?payment_success=1&order_id=${tx.store_order_id}`);
      }

      // Parse order payload
      const orderPayload = typeof tx.order_payload === 'string' ? JSON.parse(tx.order_payload) : tx.order_payload;

      // Create order
      const { orderId } = await createOrderForUser({
        userId: tx.user_id,
        body: {
          ...orderPayload,
          payment_method: 'payu',
        },
        paymentMethod: 'payu',
        status: 'pending',
        paymentNote: [
          `PayU Transaction ID: ${txnid}`,
          `PayU mihpayid: ${mihpayid}`,
        ].join('\n'),
      });

      // Send confirmation email
      sendOrderEmail(orderId).catch(err => console.error('Async order email send error:', err));

      // Update transaction status
      await pool.query(
        'UPDATE payu_transactions SET status = "success", mihpayid = ?, store_order_id = ? WHERE txnid = ?',
        [mihpayid, orderId, txnid]
      );

      const checkoutUrl = frontend_url.includes('/checkout') ? frontend_url : `${frontend_url.replace(/\/$/, '')}/checkout`;
      return res.redirect(`${checkoutUrl}?payment_success=1&order_id=${orderId}`);
    } else {
      // Payment failed
      await pool.query(
        'UPDATE payu_transactions SET status = "failed", mihpayid = ? WHERE txnid = ?',
        [mihpayid, txnid]
      );
      const checkoutUrl = frontend_url.includes('/checkout') ? frontend_url : `${frontend_url.replace(/\/$/, '')}/checkout`;
      return res.redirect(`${checkoutUrl}?error=payment_failed&msg=${encodeURIComponent(error_Message || 'Payment failed')}`);
    }
  } catch (err) {
    console.error('handlePayuCallback error:', err.message);
    return res.redirect(`${frontend_url}/checkout?error=payment_failed&msg=${encodeURIComponent(err.message || 'Internal server error')}`);
  }
};
