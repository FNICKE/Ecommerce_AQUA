import {
  listPaymentLogsForAdmin,
  getPaymentLogStats,
  updatePaymentLogByRazorpayOrderId,
  listPayuPaymentLogsForAdmin,
  getPayuPaymentLogStats,
} from '../services/paymentLogService.js';

export const getAdminRazorpayPaymentLogs = async (req, res) => {
  try {
    const { status, search, fromDate, toDate, page, limit } = req.query;
    const [result, stats] = await Promise.all([
      listPaymentLogsForAdmin({ status, search, fromDate, toDate, page, limit }),
      getPaymentLogStats(),
    ]);

    res.json({
      success: true,
      logs: result.logs,
      pagination: result.pagination,
      stats,
    });
  } catch (err) {
    console.error('getAdminRazorpayPaymentLogs error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load Razorpay payment logs' });
  }
};

export const getAdminPayuPaymentLogs = async (req, res) => {
  try {
    const { status, search, fromDate, toDate, page, limit } = req.query;
    const [result, stats] = await Promise.all([
      listPayuPaymentLogsForAdmin({ status, search, fromDate, toDate, page, limit }),
      getPayuPaymentLogStats(),
    ]);

    res.json({
      success: true,
      logs: result.logs,
      pagination: result.pagination,
      stats,
    });
  } catch (err) {
    console.error('getAdminPayuPaymentLogs error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load PayU payment logs' });
  }
};

export const logRazorpayPaymentCancelled = async (req, res) => {
  try {
    const { razorpay_order_id: razorpayOrderId } = req.body;

    if (!razorpayOrderId) {
      return res.status(400).json({ success: false, message: 'razorpay_order_id is required' });
    }

    await updatePaymentLogByRazorpayOrderId(razorpayOrderId, {
      status: 'cancelled',
      errorMessage: 'Payment cancelled by customer',
    });

    res.json({ success: true, message: 'Payment marked as cancelled' });
  } catch (err) {
    console.error('logRazorpayPaymentCancelled error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update payment log' });
  }
};
