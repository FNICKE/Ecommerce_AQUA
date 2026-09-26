// services/policyService.js
import pool from '../config/db.js';

export const ensurePoliciesTable = async () => {
  try {
    // 1. Create table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS policies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(50) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        content LONGTEXT,
        status TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Default initial policies
    const defaultPolicies = [
      {
        type: 'privacy_policy',
        title: 'Privacy Policy',
        content: `<h3>Privacy Policy</h3>
<p>Customers ACCESSING, BROWSING OR OTHERWISE USING THE WEBSITE indicates user is in AGREEMENT with all the terms and privacy conditions mentioned henceforth.</p>
<p>We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you visit our store or place an order.</p>
<ul>
  <li><strong>Information We Collect:</strong> Name, contact details, shipping address, and order transaction history.</li>
  <li><strong>How We Use It:</strong> To process your orders, provide customer support, and communicate important service updates.</li>
  <li><strong>Security:</strong> All sensitive transaction data is encrypted and securely processed through certified payment gateways.</li>
</ul>`
      },
      {
        type: 'terms_conditions',
        title: 'Terms & Conditions',
        content: `<h3>Terms and Conditions</h3>
<p>Welcome to our online store. By accessing or using our website, services, and products, you agree to be bound by the following terms and conditions.</p>
<h4>1. User Account & Security</h4>
<p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
<h4>2. Product Availability & Pricing</h4>
<p>All product specifications, images, and prices are subject to change without prior notice. We make every effort to display accurate descriptions.</p>
<h4>3. Order Cancellation</h4>
<p>Orders can be cancelled before they are dispatched for shipping by reaching out to our support team.</p>`
      },
      {
        type: 'return_policy',
        title: 'Return & Refund Policy',
        content: `<h3>Return & Refund Policy</h3>
<p>We want you to be completely satisfied with your purchase. If you are not satisfied with your order, please review our return and refund guidelines below.</p>
<h4>1. Return Window</h4>
<p>Items can be returned within <strong>7 days</strong> of delivery in their original, unused condition with all tags and original packaging intact.</p>
<h4>2. Damaged or Defective Items</h4>
<p>If you receive a damaged or defective product, please notify our customer support team within <strong>48 hours</strong> of delivery with clear photos or unboxing video.</p>
<h4>3. Refund Process</h4>
<p>Once your return is received and inspected, refunds are initiated back to your original payment method or store wallet within <strong>5-7 business days</strong>.</p>`
      },
      {
        type: 'shipping_policy',
        title: 'Shipping Policy',
        content: `<h3>Shipping & Delivery Policy</h3>
<p>We strive to deliver your orders promptly and in pristine condition.</p>
<h4>1. Order Processing Time</h4>
<p>All standard orders are processed and packed within <strong>24 to 48 hours</strong> (excluding Sundays and national holidays).</p>
<h4>2. Estimated Delivery Time</h4>
<ul>
  <li><strong>Local & Metro Cities:</strong> 2 to 4 business days</li>
  <li><strong>Rest of India:</strong> 4 to 7 business days</li>
</ul>
<h4>3. Tracking Your Order</h4>
<p>Once your order has been dispatched, you will receive a tracking link via SMS and email to monitor real-time shipment status.</p>`
      }
    ];

    // 3. Seed missing policies from existing settings table or defaults
    for (const policy of defaultPolicies) {
      const [existing] = await pool.query('SELECT id, content FROM policies WHERE type = ?', [policy.type]);
      if (existing.length === 0) {
        // Check if settings table has existing content
        const [settingRow] = await pool.query('SELECT value FROM settings WHERE variable = ?', [policy.type]);
        const initialContent = (settingRow[0]?.value && settingRow[0].value.trim().length > 10) 
          ? settingRow[0].value 
          : policy.content;

        await pool.query(
          'INSERT INTO policies (type, title, content) VALUES (?, ?, ?)',
          [policy.type, policy.title, initialContent]
        );
      }
    }
  } catch (err) {
    console.error('[ensurePoliciesTable] Error:', err.message);
  }
};
