import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  RefreshCw,
  Search,
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  Loader2,
  ExternalLink,
  IndianRupee,
} from 'lucide-react';
import api from '../../../lib/api';
import { useToastStore } from '../../../store/toastStore';

const STATUS_META = {
  paid: { label: 'Paid', className: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-800', icon: XCircle },
  cancelled: { label: 'Cancelled', className: 'bg-slate-100 text-slate-700', icon: Ban },
  initiated: { label: 'Pending', className: 'bg-amber-100 text-amber-800', icon: Clock },
};

function fmtINR(val) {
  const n = parseFloat(val);
  if (Number.isNaN(n)) return '₹0.00';
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function RazorpayPaymentLogs() {
  const { showToast } = useToastStore();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/razorpay-payment-logs', {
        params: {
          status,
          search: search.trim() || undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          page,
          limit: 25,
        },
      });
      setLogs(res.data.logs || []);
      setStats(res.data.stats || null);
      setPagination(res.data.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load payment logs', 'error');
    } finally {
      setLoading(false);
    }
  }, [status, search, fromDate, toDate, page, showToast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const statCards = [
    { key: 'paid', label: 'Successful', value: stats?.paid ?? 0, amount: stats?.paid_amount },
    { key: 'initiated', label: 'Pending', value: stats?.initiated ?? 0 },
    { key: 'failed', label: 'Failed', value: stats?.failed ?? 0 },
    { key: 'cancelled', label: 'Cancelled', value: stats?.cancelled ?? 0 },
  ];

  return (
    <div className="h-screen bg-[#F7F8FA] p-4 font-sans text-[#455560] overflow-hidden flex flex-col">
      <div className="mb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white rounded shadow-sm">
            <QrCode size={16} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#334257]">Razorpay Payment Logs</h1>
            <p className="text-[10px] text-gray-400 font-medium">History of online payments — paid, failed, or cancelled</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/payment-methods"
            className="px-3 py-2 bg-white border border-gray-200 rounded text-[10px] font-bold text-slate-600 hover:border-purple-300"
          >
            Payment Gateways
          </Link>
          <button
            onClick={fetchLogs}
            className="px-3 py-2 bg-[#004BB9] text-white rounded text-[10px] font-bold flex items-center gap-1.5"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4 shrink-0">
        {statCards.map((card) => {
          const Icon = STATUS_META[card.key]?.icon || Clock;
          return (
            <div key={card.key} className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-500 uppercase">{card.label}</p>
                <Icon size={14} className="text-purple-500" />
              </div>
              <p className="text-xl font-black text-slate-800 mt-1">{card.value}</p>
              {card.amount != null && (
                <p className="text-[10px] font-semibold text-emerald-700 mt-0.5">
                  Collected: {fmtINR(card.amount)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col flex-1 min-h-0">
        <div className="p-4 border-b border-gray-50 flex flex-wrap gap-3 items-end shrink-0">
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="bg-[#F9FBFC] border border-[#E8ECEF] px-3 py-2 rounded text-[11px] font-bold"
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="initiated">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (setPage(1), fetchLogs())}
                placeholder="Order ID, Razorpay ID, customer..."
                className="w-full pl-9 pr-3 py-2 bg-[#F9FBFC] border border-[#E8ECEF] rounded text-[11px] font-semibold"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">From</label>
            <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} className="px-3 py-2 bg-[#F9FBFC] border rounded text-[11px] font-bold" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">To</label>
            <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} className="px-3 py-2 bg-[#F9FBFC] border rounded text-[11px] font-bold" />
          </div>
          <button
            onClick={() => { setPage(1); fetchLogs(); }}
            className="px-4 py-2 bg-purple-600 text-white rounded text-[11px] font-bold"
          >
            Apply
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="animate-spin text-purple-600" size={28} />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm font-semibold">No payment logs found</div>
          ) : (
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 font-bold text-slate-500">Date</th>
                  <th className="px-4 py-3 font-bold text-slate-500">Customer</th>
                  <th className="px-4 py-3 font-bold text-slate-500">Amount</th>
                  <th className="px-4 py-3 font-bold text-slate-500">Status</th>
                  <th className="px-4 py-3 font-bold text-slate-500">Razorpay Order</th>
                  <th className="px-4 py-3 font-bold text-slate-500">Payment ID</th>
                  <th className="px-4 py-3 font-bold text-slate-500">Store Order</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const meta = STATUS_META[log.status] || STATUS_META.initiated;
                  const StatusIcon = meta.icon;
                  return (
                    <tr key={log.id} className="border-t border-gray-50 hover:bg-purple-50/30">
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmtDate(log.created_at)}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800">{log.customer_name || log.user_username || '—'}</p>
                        <p className="text-[10px] text-slate-400">{log.customer_mobile || log.user_email || ''}</p>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">
                        <span className="inline-flex items-center gap-0.5">
                          <IndianRupee size={12} />
                          {Number(log.amount).toFixed(2)}
                        </span>
                        <p className="text-[9px] text-slate-400 font-mono">{log.amount_paise} paise</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.className}`}>
                          <StatusIcon size={11} />
                          {meta.label}
                        </span>
                        {log.error_message && (
                          <p className="text-[9px] text-red-500 mt-1 max-w-[160px] truncate" title={log.error_message}>
                            {log.error_message}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-600 max-w-[120px] truncate" title={log.razorpay_order_id}>
                        {log.razorpay_order_id || '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-600 max-w-[120px] truncate" title={log.razorpay_payment_id}>
                        {log.razorpay_payment_id || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {log.store_order_id ? (
                          <Link
                            to="/orders"
                            className="inline-flex items-center gap-1 text-purple-700 font-bold hover:underline"
                          >
                            #{log.store_order_id}
                            <ExternalLink size={10} />
                          </Link>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between shrink-0 text-[11px] font-bold text-slate-500">
          <span>
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} records
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border rounded disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 border rounded disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
