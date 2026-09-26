import crypto from 'crypto';
import axios from 'axios';
import pool from '../config/db.js';

const PAYMENT_SETTING_KEYS = [
  'payment_cod_enabled',
  'payment_razorpay_enabled',
  'payment_razorpay_environment',
  'payment_razorpay_key_id',
  'payment_razorpay_key_secret',
  'payment_payu_enabled',
  'payment_payu_environment',
  'payment_payu_merchant_key',
  'payment_payu_merchant_salt',
];

const DEFAULT_SETTINGS = {
  payment_cod_enabled: '1',
  payment_razorpay_enabled: '0',
  payment_razorpay_environment: 'test',
  payment_razorpay_key_id: '',
  payment_razorpay_key_secret: '',
  payment_payu_enabled: '0',
  payment_payu_environment: 'test',
  payment_payu_merchant_key: '',
  payment_payu_merchant_salt: '',
};

const PLACEHOLDER_KEY_PATTERN = /your\s|placeholder|example|xxxx|enter\s/i;

const boolToSetting = (value) => (value ? '1' : '0');
const settingToBool = (value) => value === '1' || value === 1 || value === true || value === 'true';

function isRealRazorpayKeyId(key) {
  const value = String(key || '').trim();
  return value.startsWith('rzp_test_') || value.startsWith('rzp_live_');
}

function isRealRazorpaySecret(secret) {
  const value = String(secret || '').trim();
  if (value.length < 20) return false;
  if (PLACEHOLDER_KEY_PATTERN.test(value)) return false;
  return true;
}

function isRealPayuKey(val) {
  const v = String(val || '').trim();
  return v.length >= 4 && !PLACEHOLDER_KEY_PATTERN.test(v);
}

async function loadLegacyPaymentSettings() {
  try {
    const [rows] = await pool.query(
      `SELECT value FROM settings WHERE variable = 'payment_method' LIMIT 1`
    );
    if (!rows.length || !rows[0].value) return null;

    const parsed = typeof rows[0].value === 'string'
      ? JSON.parse(rows[0].value)
      : rows[0].value;

    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

async function getRawPaymentSettings() {
  const [rows] = await pool.query(
    `SELECT variable, value FROM settings WHERE variable IN (${PAYMENT_SETTING_KEYS.map(() => '?').join(',')})`,
    PAYMENT_SETTING_KEYS
  );

  const settings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    settings[row.variable] = row.value ?? '';
  }

  const legacy = await loadLegacyPaymentSettings();
  if (legacy) {
    const hasRzpKeyId = rows.some(r => r.variable === 'payment_razorpay_key_id');
    const hasRzpSecret = rows.some(r => r.variable === 'payment_razorpay_key_secret');
    const hasRzpEnabled = rows.some(r => r.variable === 'payment_razorpay_enabled');
    const hasCodEnabled = rows.some(r => r.variable === 'payment_cod_enabled');

    if (!hasRzpKeyId && !settings.payment_razorpay_key_id && legacy.razorpay_key_id) {
      settings.payment_razorpay_key_id = String(legacy.razorpay_key_id).trim();
    }
    if (!hasRzpSecret && !settings.payment_razorpay_key_secret && legacy.razorpay_secret_key) {
      settings.payment_razorpay_key_secret = String(legacy.razorpay_secret_key).trim();
    }
    if (!hasRzpEnabled && settings.payment_razorpay_enabled === '0' && settingToBool(legacy.razorpay_payment_method)) {
      settings.payment_razorpay_enabled = '1';
    }
    if (!hasCodEnabled && settings.payment_cod_enabled === '1' && legacy.cod_method === '0') {
      settings.payment_cod_enabled = '0';
    }
  }

  settings.payment_razorpay_key_id =
    settings.payment_razorpay_key_id || process.env.RAZORPAY_KEY_ID || '';
  settings.payment_razorpay_key_secret =
    settings.payment_razorpay_key_secret || process.env.RAZORPAY_KEY_SECRET || '';

  settings.payment_payu_merchant_key =
    settings.payment_payu_merchant_key || process.env.PAYU_MERCHANT_KEY || '';
  settings.payment_payu_merchant_salt =
    settings.payment_payu_merchant_salt || process.env.PAYU_MERCHANT_SALT || '';

  if (!isRealRazorpayKeyId(settings.payment_razorpay_key_id)) {
    settings.payment_razorpay_key_id = '';
  }
  if (!isRealRazorpaySecret(settings.payment_razorpay_key_secret)) {
    settings.payment_razorpay_key_secret = '';
  }

  if (!isRealPayuKey(settings.payment_payu_merchant_key)) {
    settings.payment_payu_merchant_key = '';
  }
  if (!isRealPayuKey(settings.payment_payu_merchant_salt)) {
    settings.payment_payu_merchant_salt = '';
  }

  return settings;
}

export async function getPaymentSettings() {
  const raw = await getRawPaymentSettings();
  const razorpayConfigured = Boolean(
    isRealRazorpayKeyId(raw.payment_razorpay_key_id) &&
    isRealRazorpaySecret(raw.payment_razorpay_key_secret)
  );

  const payuConfigured = Boolean(
    isRealPayuKey(raw.payment_payu_merchant_key) &&
    isRealPayuKey(raw.payment_payu_merchant_salt)
  );

  return {
    cod_enabled: settingToBool(raw.payment_cod_enabled),
    razorpay_enabled: settingToBool(raw.payment_razorpay_enabled),
    razorpay_environment: raw.payment_razorpay_environment === 'live' ? 'live' : 'test',
    razorpay_key_id: raw.payment_razorpay_key_id,
    razorpay_key_secret: raw.payment_razorpay_key_secret,
    razorpay_configured: razorpayConfigured,
    payu_enabled: settingToBool(raw.payment_payu_enabled),
    payu_environment: raw.payment_payu_environment === 'live' ? 'live' : 'test',
    payu_merchant_key: raw.payment_payu_merchant_key,
    payu_merchant_salt: raw.payment_payu_merchant_salt,
    payu_configured: payuConfigured,
    currency: 'INR',
  };
}

async function saveSetting(variable, value) {
  await pool.query(
    `INSERT INTO settings (variable, value)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [variable, value]
  );
}

export const getPublicPaymentMethods = async (req, res) => {
  try {
    const settings = await getPaymentSettings();
    const razorpayReady = settings.razorpay_enabled && settings.razorpay_configured;
    const payuReady = settings.payu_enabled && settings.payu_configured;

    res.json({
      success: true,
      methods: {
        cod: {
          enabled: settings.cod_enabled,
          title: 'Cash on Delivery',
        },
        razorpay: {
          enabled: settings.razorpay_enabled,
          configured: settings.razorpay_configured,
          ready: razorpayReady,
          title: 'Razorpay UPI QR',
          currency: settings.currency,
          environment: settings.razorpay_environment,
          setup_hint: razorpayReady
            ? null
            : 'Add valid Razorpay keys (rzp_test_...) in Admin → Payment Gateways and enable Razorpay.',
        },
        payu: {
          enabled: settings.payu_enabled,
          configured: settings.payu_configured,
          ready: payuReady,
          title: 'PayU Checkout',
          currency: settings.currency,
          environment: settings.payu_environment,
          setup_hint: payuReady
            ? null
            : 'Add valid PayU Merchant Key and Salt in Admin → Payment Gateways and enable PayU.',
        },
      },
    });
  } catch (err) {
    console.error('getPublicPaymentMethods error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load payment methods' });
  }
};

export const getAdminPaymentMethods = async (req, res) => {
  try {
    const settings = await getPaymentSettings();
    res.json({
      success: true,
      methods: {
        cod: {
          enabled: settings.cod_enabled,
          title: 'Cash on Delivery',
        },
        razorpay: {
          enabled: settings.razorpay_enabled,
          title: 'Razorpay UPI QR',
          environment: settings.razorpay_environment,
          key_id: settings.razorpay_key_id,
          key_secret_configured: settings.razorpay_configured,
          ready: settings.razorpay_enabled && settings.razorpay_configured,
        },
        payu: {
          enabled: settings.payu_enabled,
          title: 'PayU Checkout',
          environment: settings.payu_environment,
          merchant_key: settings.payu_merchant_key,
          merchant_salt_configured: settings.payu_configured,
          ready: settings.payu_enabled && settings.payu_configured,
        },
      },
    });
  } catch (err) {
    console.error('getAdminPaymentMethods error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load payment gateways' });
  }
};

export const updateAdminPaymentMethods = async (req, res) => {
  try {
    const { cod = {}, razorpay = {}, payu = {} } = req.body;
    
    const rzpEnvironment = razorpay.environment === 'live' ? 'live' : 'test';
    const rzpKeyId = (razorpay.key_id || '').trim();
    const rzpKeySecret = typeof razorpay.key_secret === 'string' ? razorpay.key_secret.trim() : '';

    const payuEnvironment = payu.environment === 'live' ? 'live' : 'test';
    const payuMerchantKey = (payu.merchant_key || '').trim();
    const payuMerchantSalt = typeof payu.merchant_salt === 'string' ? payu.merchant_salt.trim() : '';

    const existing = await getPaymentSettings();

    if (Boolean(razorpay.enabled)) {
      const finalKeyId = rzpKeyId || existing.razorpay_key_id;
      const finalSecret = rzpKeySecret || existing.razorpay_key_secret;

      if (!isRealRazorpayKeyId(finalKeyId)) {
        console.log('[PAYMENT CONFIG VALIDATION FAILED]: Invalid Razorpay Key ID:', finalKeyId);
        return res.status(400).json({
          success: false,
          message: 'Enter a valid Razorpay Key ID (starts with rzp_test_ or rzp_live_)',
        });
      }
      if (!isRealRazorpaySecret(finalSecret)) {
        console.log('[PAYMENT CONFIG VALIDATION FAILED]: Invalid Razorpay Key Secret (length:', finalSecret?.length || 0, ')');
        return res.status(400).json({
          success: false,
          message: 'Enter a valid Razorpay Key Secret from your Razorpay Dashboard',
        });
      }
    }

    if (Boolean(payu.enabled)) {
      const finalMerchantKey = payuMerchantKey || existing.payu_merchant_key;
      const finalMerchantSalt = payuMerchantSalt || existing.payu_merchant_salt;

      if (!isRealPayuKey(finalMerchantKey)) {
        console.log('[PAYMENT CONFIG VALIDATION FAILED]: Invalid PayU Merchant Key:', finalMerchantKey);
        return res.status(400).json({
          success: false,
          message: 'Enter a valid PayU Merchant Key',
        });
      }
      if (!isRealPayuKey(finalMerchantSalt)) {
        console.log('[PAYMENT CONFIG VALIDATION FAILED]: Invalid PayU Merchant Salt:', finalMerchantSalt);
        return res.status(400).json({
          success: false,
          message: 'Enter a valid PayU Merchant Salt',
        });
      }
    }

    await saveSetting('payment_cod_enabled', boolToSetting(Boolean(cod.enabled)));
    
    await saveSetting('payment_razorpay_enabled', boolToSetting(Boolean(razorpay.enabled)));
    await saveSetting('payment_razorpay_environment', rzpEnvironment);
    if (rzpKeyId) {
      await saveSetting('payment_razorpay_key_id', rzpKeyId);
    }
    if (rzpKeySecret) {
      await saveSetting('payment_razorpay_key_secret', rzpKeySecret);
    }

    await saveSetting('payment_payu_enabled', boolToSetting(Boolean(payu.enabled)));
    await saveSetting('payment_payu_environment', payuEnvironment);
    if (payuMerchantKey) {
      await saveSetting('payment_payu_merchant_key', payuMerchantKey);
    }
    if (payuMerchantSalt) {
      await saveSetting('payment_payu_merchant_salt', payuMerchantSalt);
    }

    const settings = await getPaymentSettings();
    res.json({
      success: true,
      message: 'Payment gateways updated successfully',
      methods: {
        cod: {
          enabled: settings.cod_enabled,
          title: 'Cash on Delivery',
        },
        razorpay: {
          enabled: settings.razorpay_enabled,
          title: 'Razorpay UPI QR',
          environment: settings.razorpay_environment,
          key_id: settings.razorpay_key_id,
          key_secret_configured: settings.razorpay_configured,
          ready: settings.razorpay_enabled && settings.razorpay_configured,
        },
        payu: {
          enabled: settings.payu_enabled,
          title: 'PayU Checkout',
          environment: settings.payu_environment,
          merchant_key: settings.payu_merchant_key,
          merchant_salt_configured: settings.payu_configured,
          ready: settings.payu_enabled && settings.payu_configured,
        },
      },
    });
  } catch (err) {
    console.error('updateAdminPaymentMethods error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update payment gateways' });
  }
};

export async function createRazorpayGatewayOrder({ amount, receipt, notes = {} }) {
  const settings = await getPaymentSettings();

  if (!settings.razorpay_enabled) {
    const error = new Error('Razorpay is disabled. Enable it in Admin → Payment Gateways');
    error.statusCode = 400;
    throw error;
  }

  if (!settings.razorpay_configured) {
    const error = new Error('Razorpay keys are missing. Add Key ID and Secret in Admin → Payment Gateways');
    error.statusCode = 400;
    throw error;
  }

  const amountInPaise = Math.round(Number(amount) * 100);
  if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
    const error = new Error('Invalid payment amount');
    error.statusCode = 400;
    throw error;
  }

  const response = await axios.post(
    'https://api.razorpay.com/v1/orders',
    {
      amount: amountInPaise,
      currency: 'INR',
      receipt: String(receipt || `order_${Date.now()}`).slice(0, 40),
      notes,
    },
    {
      auth: {
        username: settings.razorpay_key_id,
        password: settings.razorpay_key_secret,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  return {
    gatewayOrder: response.data,
    keyId: settings.razorpay_key_id,
  };
}

export async function fetchRazorpayGatewayOrder(razorpayOrderId) {
  const settings = await getPaymentSettings();
  const response = await axios.get(
    `https://api.razorpay.com/v1/orders/${encodeURIComponent(razorpayOrderId)}`,
    {
      auth: {
        username: settings.razorpay_key_id,
        password: settings.razorpay_key_secret,
      },
      timeout: 30000,
    }
  );

  return response.data;
}

export async function verifyRazorpaySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const settings = await getPaymentSettings();
  const expected = crypto
    .createHmac('sha256', settings.razorpay_key_secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const received = String(razorpay_signature || '');
  if (!received) return false;

  try {
    const expectedBuffer = Buffer.from(expected, 'utf8');
    const receivedBuffer = Buffer.from(received, 'utf8');
    if (expectedBuffer.length !== receivedBuffer.length) return false;
    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch {
    return false;
  }
}

export const testRazorpayConnection = async (req, res) => {
  try {
    const { key_id, key_secret } = req.body;
    const existing = await getPaymentSettings();

    // Use current input if provided, otherwise fall back to database values
    const finalKeyId = (key_id || '').trim() || existing.razorpay_key_id;
    const finalSecret = typeof key_secret === 'string' && key_secret.trim() !== ''
      ? key_secret.trim()
      : existing.razorpay_key_secret;

    if (!finalKeyId) {
      return res.status(400).json({
        success: false,
        message: 'Razorpay Key ID is required to test the connection.',
      });
    }
    if (!finalSecret) {
      return res.status(400).json({
        success: false,
        message: 'Razorpay Key Secret is required to test the connection.',
      });
    }

    if (!isRealRazorpayKeyId(finalKeyId)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid Razorpay Key ID (starts with rzp_test_ or rzp_live_).',
      });
    }
    if (!isRealRazorpaySecret(finalSecret)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid Razorpay Key Secret from your Razorpay Dashboard.',
      });
    }

    // Call Razorpay API to test connection
    const response = await axios.get('https://api.razorpay.com/v1/orders?count=1', {
      auth: {
        username: finalKeyId,
        password: finalSecret,
      },
      timeout: 10000,
    });

    res.json({
      success: true,
      message: 'Connection successful! Razorpay API credentials are valid.',
    });
  } catch (err) {
    console.error('testRazorpayConnection error:', err.response?.data || err.message);
    const description = err.response?.data?.error?.description 
      || err.response?.data?.error?.reason 
      || err.message 
      || 'Authentication failed';
    res.status(400).json({
      success: false,
      message: `Connection failed: ${description}. Please check your Key ID and Secret.`,
    });
  }
};

