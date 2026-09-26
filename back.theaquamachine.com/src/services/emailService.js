// services/emailService.js
import nodemailer from 'nodemailer';
import pool from '../config/db.js';

let templatesTableReady = false;
let logsTableReady = false;

export async function ensureEmailTemplatesTable() {
  if (templatesTableReady) return;
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_templates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(100) NOT NULL UNIQUE,
      subject VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'customer',
      is_default TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Seed default templates if empty
  const [rows] = await pool.query('SELECT COUNT(*) AS count FROM email_templates');
  if (rows[0].count === 0) {
    const DEFAULT_CUSTOMER_CONTENT = `Dear {customer_name},<br/><br/>Thank you for shopping with us! We are excited to let you know that your order has been received and is being processed. Below are your order details:`;
    const DEFAULT_ADMIN_CONTENT = `Hello Admin,<br/><br/>This order has been successfully placed by the customer <strong>{customer_name}</strong> ({customer_email}).`;

    await pool.query(`
      INSERT INTO email_templates (name, code, subject, content, type, is_default)
      VALUES 
        ('Customer Order Receipt', 'order_confirmation', 'Order Confirmed - Order #{order_id}', ?, 'customer', 1),
        ('Admin New Order Alert', 'admin_order_alert', '[New Order] Received Order #{order_id}', ?, 'admin', 1)
    `, [DEFAULT_CUSTOMER_CONTENT, DEFAULT_ADMIN_CONTENT]);
    console.log('[SMTP] Seeded default email templates into database.');
  }

  templatesTableReady = true;
}

export async function ensureEmailLogsTable() {
  if (logsTableReady) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      template_code VARCHAR(100) NOT NULL,
      recipient VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL,
      error_message TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  logsTableReady = true;
}

// Replaces all {placeholder} occurrences in template with actual data
const compileTemplate = (htmlTemplate, data) => {
  let template = htmlTemplate;
  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{${key}}`;
    template = template.replaceAll(placeholder, value !== undefined && value !== null ? String(value) : '');
  }
  return template;
};

// Logs an email transaction to the database
const logEmail = async (templateCode, recipient, subject, status, errorMessage = null) => {
  try {
    await ensureEmailLogsTable();
    await pool.query(
      `INSERT INTO email_logs (template_code, recipient, subject, status, error_message)
       VALUES (?, ?, ?, ?, ?)`,
      [templateCode, recipient, subject, status, errorMessage]
    );
  } catch (err) {
    console.error('Failed to write email log to database:', err.message);
  }
};

// HTML Layout Wrappers
const getCustomerHtmlWrapper = (storeName, customerName, orderId, orderDate, paymentMethod, itemsHtml, subtotal, discount, deliveryCharge, walletBalance, totalAmount, shippingAddress, adminEmail, currentYear, bodyContent) => {
  return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #334155;">
  <div style="background-color: #4f46e5; padding: 24px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 24px;">Order Confirmed!</h1>
    <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Thank you for shopping with ${storeName}</p>
  </div>
  <div style="padding: 24px;">
    <div style="font-size: 14px; line-height: 1.6; color: #334155; margin: 20px 0;">
      ${bodyContent}
    </div>
    
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0;"><strong>Order ID:</strong> #${orderId}</p>
      <p style="margin: 0 0 8px 0;"><strong>Date:</strong> ${orderDate}</p>
      <p style="margin: 0;"><strong>Payment Method:</strong> ${paymentMethod}</p>
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
        ${itemsHtml}
      </tbody>
    </table>

    <table style="width: 60%; margin-left: auto; margin-top: 20px; border-collapse: collapse; font-size: 14px;">
      <tr>
        <td style="padding: 6px 0; color: #64748b;">Subtotal:</td>
        <td style="padding: 6px 0; text-align: right;">₹${subtotal}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #16a34a;">Discount:</td>
        <td style="padding: 6px 0; text-align: right; color: #16a34a;">-₹${discount}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #64748b;">Delivery Charge:</td>
        <td style="padding: 6px 0; text-align: right;">₹${deliveryCharge}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #dc2626;">Wallet Balance Used:</td>
        <td style="padding: 6px 0; text-align: right; color: #dc2626;">-₹${walletBalance}</td>
      </tr>
      <tr style="border-top: 1px solid #e2e8f0; font-weight: bold; font-size: 16px;">
        <td style="padding: 12px 0 0 0; color: #1e293b;">Total Amount:</td>
        <td style="padding: 12px 0 0 0; text-align: right; color: #4f46e5;">₹${totalAmount}</td>
      </tr>
    </table>

    <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 32px;">Shipping Address</h3>
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6;">
      ${shippingAddress}
    </div>

    <p style="margin-top: 32px; font-size: 13px; color: #64748b; text-align: center;">
      If you have any questions, feel free to contact us at <a href="mailto:${adminEmail}" style="color: #4f46e5;">${adminEmail}</a>.
    </p>
  </div>
  <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
    &copy; ${currentYear} ${storeName}. All rights reserved.
  </div>
</div>`;
};

const getAdminHtmlWrapper = (storeName, customerName, customerEmail, customerPhone, orderId, totalAmount, paymentMethod, itemsHtml, shippingAddress, currentYear, bodyContent, frontendUrl) => {
  return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #334155;">
  <div style="background-color: #0f172a; padding: 24px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 24px;">New Order Received</h1>
    <p style="margin: 8px 0 0 0; font-size: 14px; color: #94a3b8;">Order #${orderId} needs processing</p>
  </div>
  <div style="padding: 24px;">
    <div style="font-size: 14px; line-height: 1.6; color: #334155; margin: 20px 0;">
      ${bodyContent}
    </div>
    
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0;"><strong>Order ID:</strong> #${orderId}</p>
      <p style="margin: 0 0 8px 0;"><strong>Total Value:</strong> ₹${totalAmount}</p>
      <p style="margin: 0 0 8px 0;"><strong>Payment Method:</strong> ${paymentMethod}</p>
      <p style="margin: 0;"><strong>Customer Phone:</strong> ${customerPhone}</p>
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
        ${itemsHtml}
      </tbody>
    </table>

    <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 32px;">Shipping Address</h3>
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6;">
      ${shippingAddress}
    </div>

    <div style="text-align: center; margin-top: 32px;">
      <a href="${frontendUrl}/admin/orders" style="background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
        View Order in Admin Panel
      </a>
    </div>
  </div>
</div>`;
};

// Get SMTP Transporter — prefers Brevo if BREVO_KEY is set, otherwise reads from DB
export const getTransporter = async () => {
  // ── Option 1: Brevo SMTP (best deliverability, inbox guaranteed) ──
  if (process.env.BREVO_KEY) {
    const brevoUser = process.env.BREVO_USER || process.env.SMTP_USER || 'aquamachine2426@gmail.com';
    console.log('[SMTP] Using Brevo relay → smtp-relay.brevo.com:587');
    return {
      transporter: nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: { user: brevoUser, pass: process.env.BREVO_KEY },
        tls: { rejectUnauthorized: false }
      }),
      senderEmail: process.env.BREVO_SENDER || brevoUser
    };
  }

  // ── Option 2: Settings saved in admin panel DB ──
  const keys = [
    'mail_mailer',
    'mail_host',
    'mail_driver',
    'mail_port',
    'mail_encryption',
    'mail_username',
    'mail_email_id',
    'mail_password'
  ];

  let settings = {};
  try {
    const [rows] = await pool.query('SELECT variable, value FROM settings WHERE variable IN (?)', [keys]);
    rows.forEach(row => {
      settings[row.variable] = row.value;
    });
  } catch (err) {
    console.error('Failed to load SMTP settings from DB, using env variables:', err.message);
  }

  const host = settings.mail_host || process.env.SMTP_HOST || 'mail.theaquamachine.com';
  const port = Number(settings.mail_port || process.env.SMTP_PORT || 465);
  const user = settings.mail_username || process.env.SMTP_USER || 'info@theaquamachine.com';
  const pass = settings.mail_password || process.env.SMTP_PASS || 'India@2026';
  const encryption = settings.mail_encryption || process.env.SMTP_ENCRYPTION || 'ssl';

  const isSecure = encryption.toLowerCase() === 'ssl' || port === 465;
  console.log(`[SMTP] Using DB/env settings → ${host}:${port} (${encryption.toUpperCase()})`);

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: isSecure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    }),
    senderEmail: settings.mail_email_id || user
  };
};

export const sendPasswordResetEmail = async (email, resetUrl) => {
  const { transporter, senderEmail } = await getTransporter();
  await transporter.sendMail({
    from: `"The Aqua Machine" <${senderEmail}>`,
    to: email,
    subject: 'Reset your The Aqua Machine password',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
      <h2 style="color: #4f46e5;">Password reset request</h2>
      <p>We received a request to reset your password.</p>
      <p><a href="${resetUrl}" style="background: #4f46e5; color: white; padding: 12px 20px; border-radius: 6px; text-decoration: none; display: inline-block;">Reset Password</a></p>
      <p>This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>
    </div>`
  });
};

/**
 * Send order confirmation emails to the customer and the store administrator.
 * @param {number} orderId - The ID of the order
 */
export const sendOrderEmail = async (orderId) => {
  try {
    // 1. Fetch order details
    const [orderRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!orderRows.length) {
      console.error(`Order #${orderId} not found for email notification`);
      return;
    }
    const order = orderRows[0];

    // 2. Fetch user details
    const [userRows] = await pool.query('SELECT username, email FROM users WHERE id = ?', [order.user_id]);
    const user = userRows[0] || {};

    // 3. Fetch address details
    let addressText = order.address || '';
    if (order.address_id) {
      const [addrRows] = await pool.query('SELECT * FROM addresses WHERE id = ?', [order.address_id]);
      if (addrRows.length) {
        const addr = addrRows[0];
        addressText = `
          <strong>${addr.name}</strong><br/>
          ${addr.address}, ${addr.landmark ? addr.landmark + ', ' : ''}${addr.area}<br/>
          ${addr.city}, ${addr.state} - ${addr.pincode}<br/>
          <strong>Phone:</strong> ${addr.mobile}${addr.alternate_mobile ? ', ' + addr.alternate_mobile : ''}
        `;
      }
    }

    // 4. Fetch order items
    const [items] = await pool.query(
      `SELECT oi.*, p.name AS product_name, pv.weight AS variant_weight
       FROM order_items oi
       LEFT JOIN product_variants pv ON oi.product_variant_id = pv.id
       LEFT JOIN products p ON pv.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    // 5. Fetch general settings and SMTP sender details
    const settingsKeys = ['site_name', 'support_email'];
    const [settingRows] = await pool.query("SELECT variable, value FROM settings WHERE variable IN (?)", [settingsKeys]);
    
    const settingsMap = {};
    settingRows.forEach(row => {
      settingsMap[row.variable] = row.value;
    });

    const storeName = settingsMap.site_name || 'The Aqua Machine';
    const primaryAdminEmail = 'aquamachine2426@gmail.com';
    const configuredAdminEmail = process.env.ORDER_ADMIN_EMAIL
      || settingsMap.support_email
      || settingsMap.contact_email
      || 'info@theaquamachine.com';
    
    // Support sending to both primary admin and configured admin (avoiding duplicates)
    const adminRecipients = Array.from(new Set([
      primaryAdminEmail,
      configuredAdminEmail
    ].filter(Boolean))).join(', ');

    const adminEmail = primaryAdminEmail;

    // 6. Fetch template details from email_templates table
    let customerSubjectTemplate = 'Order Confirmed - Order #{order_id}';
    let customerBodyTemplate = 'We are excited to let you know that your order has been received and is being processed. Below are your order details:';
    let adminSubjectTemplate = '[New Order] Received Order #{order_id}';
    let adminBodyTemplate = 'A new order has been successfully placed by <strong>{customer_name}</strong> ({customer_email}).';

    try {
      await ensureEmailTemplatesTable();
      const [templateRows] = await pool.query('SELECT code, subject, content FROM email_templates WHERE code IN (?)', [['order_confirmation', 'admin_order_alert']]);
      templateRows.forEach(row => {
        if (row.code === 'order_confirmation') {
          customerSubjectTemplate = row.subject;
          customerBodyTemplate = row.content;
        } else if (row.code === 'admin_order_alert') {
          adminSubjectTemplate = row.subject;
          adminBodyTemplate = row.content;
        }
      });
    } catch (dbErr) {
      console.error('Failed to load email templates from database, using code-defined defaults:', dbErr.message);
    }

    // 7. Generate items HTML rows
    let itemsHtml = '';
    items.forEach(item => {
      const itemPrice = parseFloat(item.price);
      const itemQty = parseInt(item.quantity);
      const sub = itemPrice * itemQty;
      itemsHtml += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">
            <strong>${item.product_name}</strong>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: center;">${itemQty}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: right;">₹${itemPrice.toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: right;">₹${sub.toFixed(2)}</td>
        </tr>
      `;
    });

    // 8. Calculate prices
    const subtotal = items.reduce((acc, item) => acc + (parseFloat(item.price) * parseInt(item.quantity)), 0);
    const discount = parseFloat(order.promo_discount || 0);
    const delivery = parseFloat(order.delivery_charge || 0);
    const walletUsed = parseFloat(order.wallet_balance || 0);
    const total = parseFloat(order.final_total || order.total || 0);

    // 9. Build template data
    const templateData = {
      store_name: storeName,
      customer_name: user.username || 'Customer',
      customer_email: user.email || 'N/A',
      customer_phone: order.mobile || 'N/A',
      order_id: orderId,
      order_date: new Date(order.date_added).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      payment_method: order.payment_method.toUpperCase(),
      items_table: itemsHtml,
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      delivery_charge: delivery.toFixed(2),
      wallet_balance: walletUsed.toFixed(2),
      total_amount: total.toFixed(2),
      shipping_address: addressText || 'Local Pickup / No Address Provided',
      admin_email: adminEmail,
      current_year: new Date().getFullYear(),
      frontend_url: process.env.FRONTEND_URL || 'http://localhost:5173'
    };

    // 10. Compile templates and subjects
    const customerSubject = compileTemplate(customerSubjectTemplate, templateData);
    const customerBody = compileTemplate(customerBodyTemplate, templateData);
    const adminSubject = compileTemplate(adminSubjectTemplate, templateData);
    const adminBody = compileTemplate(adminBodyTemplate, templateData);

    const customerHtml = getCustomerHtmlWrapper(
      storeName,
      templateData.customer_name,
      orderId,
      templateData.order_date,
      templateData.payment_method,
      itemsHtml,
      subtotal,
      discount,
      delivery,
      walletUsed,
      total,
      templateData.shipping_address,
      adminEmail,
      templateData.current_year,
      customerBody
    );

    const adminHtml = getAdminHtmlWrapper(
      storeName,
      templateData.customer_name,
      templateData.customer_email,
      templateData.customer_phone,
      orderId,
      total,
      templateData.payment_method,
      itemsHtml,
      templateData.shipping_address,
      templateData.current_year,
      adminBody,
      templateData.frontend_url
    );

    // 11. Get SMTP transporter and send emails
    const { transporter, senderEmail } = await getTransporter();

    // Send to Customer (if email exists)
    if (user.email) {
      try {
        await transporter.sendMail({
          from: `"${storeName}" <${senderEmail}>`,
          to: user.email,
          subject: customerSubject,
          html: customerHtml
        });
        console.log(`Order confirmation email sent to user: ${user.email} for order #${orderId}`);
        await logEmail('order_confirmation', user.email, customerSubject, 'sent');
      } catch (custErr) {
        console.error(`Failed to send order email to customer ${user.email}:`, custErr.message);
        await logEmail('order_confirmation', user.email, customerSubject, 'failed', custErr.message);
      }
    } else {
      console.log(`No email found for user ID ${order.user_id}, skipping customer email`);
      await logEmail('order_confirmation', 'N/A (No Email)', customerSubject, 'failed', 'No email found for customer user ID');
    }

    // Send to Admin
    try {
      await transporter.sendMail({
        from: `"${storeName} System" <${senderEmail}>`,
        to: adminRecipients,
        subject: adminSubject,
        html: adminHtml
      });
      console.log(`Admin order notification email sent to: ${adminRecipients} for order #${orderId}`);
      await logEmail('admin_order_alert', adminRecipients, adminSubject, 'sent');
    } catch (admErr) {
      console.error(`Failed to send order notification email to admin ${adminRecipients}:`, admErr.message);
      await logEmail('admin_order_alert', adminRecipients, adminSubject, 'failed', admErr.message);
    }

  } catch (globalErr) {
    console.error('sendOrderEmail global error:', globalErr.message);
  }
};
