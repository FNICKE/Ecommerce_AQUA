import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search, RefreshCw, Download, RotateCcw, Layers, Settings,
  Truck, User, X, ChevronDown, Calendar, CheckCircle, Trash2,
  Clock, Package, AlertCircle, ShoppingCart, Edit2, Check, Eye, MapPin, DollarSign, FileText, ClipboardList
} from 'lucide-react';
import api from '../../../lib/api';

// ─────────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  pending:   { bg: 'bg-amber-100',  text: 'text-amber-700',   dot: 'bg-amber-500' },
  ready:     { bg: 'bg-blue-100',   text: 'text-blue-700',    dot: 'bg-blue-500' },
  awaiting:  { bg: 'bg-indigo-100', text: 'text-indigo-700',  dot: 'bg-indigo-500' },
  processed: { bg: 'bg-cyan-100',   text: 'text-cyan-700',    dot: 'bg-cyan-500' },
  shipped:   { bg: 'bg-orange-100', text: 'text-orange-700',  dot: 'bg-orange-500' },
  delivered: { bg: 'bg-green-100',  text: 'text-green-700',   dot: 'bg-green-500' },
  cancelled: { bg: 'bg-red-100',    text: 'text-red-700',     dot: 'bg-red-500' },
  returned:  { bg: 'bg-rose-100',   text: 'text-rose-700',    dot: 'bg-rose-500' },
};

const ALL_STATUSES = ['pending','ready','awaiting','processed','shipped','delivered','cancelled','returned'];

function fmtINR(val) {
  const n = parseFloat(val);
  if (typeof val === 'undefined' || isNaN(n)) return '₹0.00';
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

const PAGE_SIZE = 10;

// ─────────────────────────────────────────────────────────────────
export default function Orders() {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderOutlines, setOrderOutlines] = useState({});

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Inline status edit
  const [editingId, setEditingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // View/Edit Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('status'); // 'status' | 'billing' | 'shipping' | 'notes' | 'items'
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Edit Form State
  const [formData, setFormData] = useState({
    status: '',
    active_status: '',
    delivery_boy_id: '',
    otp: '',
    is_pos_order: false,
    delivery_charge: '',
    is_delivery_charge_returnable: false,
    mobile: '',
    email: '',
    address: '',
    delivery_date: '',
    delivery_time: '',
    is_local_pickup: false,
    pickup_time: '',
    latitude: '',
    longitude: '',
    notes: '',
    seller_notes: '',
    attachments: '',
    courier_agency: '',
    tracking_id: '',
    url: ''
  });

  // ── Fetch orders ─────────────────────────────────────────────
  const fetchOrders = useCallback(async (pageToFetch = page) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== 'all')  params.set('status', statusFilter);
      if (paymentFilter !== 'all') params.set('payment_method', paymentFilter);
      if (search)     params.set('search', search);
      if (fromDate)   params.set('from_date', fromDate);
      if (toDate)     params.set('to_date', toDate);
      params.set('limit', '10');
      params.set('page', String(pageToFetch));

      const [ordersRes, outlinesRes] = await Promise.all([
        api.get(`/orders/admin/all?${params.toString()}`),
        api.get('/admin/orders/outlines'),
      ]);
      setOrders(ordersRes.data?.orders || []);
      setTotalCount(ordersRes.data?.total || 0);
      setOrderOutlines(outlinesRes.data || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, paymentFilter, search, fromDate, toDate, page]);

  useEffect(() => {
    fetchOrders(page);
  }, [page]);

  useEffect(() => {
    if (location.state?.searchOrderId) {
      const orderId = location.state.searchOrderId;
      setSearch(String(orderId));
      openOrderModal(orderId);
    }
  }, [location.state]);

  // ── Inline status update ─────────────────────────────────────
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      await api.put(`/orders/admin/${orderId}/status`, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      // Refresh outlines count
      const res = await api.get('/admin/orders/outlines');
      setOrderOutlines(res.data || {});
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingId(null);
      setEditingId(null);
    }
  };

  // ── Fetch Single Order Details for Modal ────────────────────
  const openOrderModal = async (orderId) => {
    try {
      setModalLoading(true);
      setActiveTab('status');
      setShowModal(true);
      
      const res = await api.get(`/orders/admin/${orderId}`);
      if (res.data?.success) {
        const order = res.data.order;
        setSelectedOrder(order);
        
        // Populate form data
        setFormData({
          status: order.status || 'pending',
          active_status: order.active_status || '',
          delivery_boy_id: order.delivery_boy_id || '',
          otp: order.otp || 0,
          is_pos_order: order.is_pos_order === 1,
          delivery_charge: order.delivery_charge || 0,
          is_delivery_charge_returnable: order.is_delivery_charge_returnable === 1,
          mobile: order.mobile || '',
          email: order.email || '',
          address: order.address || '',
          delivery_date: order.delivery_date ? order.delivery_date.split('T')[0] : '',
          delivery_time: order.delivery_time || '',
          is_local_pickup: order.is_local_pickup === 1,
          pickup_time: order.pickup_time ? order.pickup_time.substring(0, 16) : '',
          latitude: order.latitude || '',
          longitude: order.longitude || '',
          notes: order.notes || '',
          seller_notes: order.seller_notes || '',
          attachments: order.attachments || '',
          courier_agency: order.courier_agency || '',
          tracking_id: order.tracking_id || '',
          url: order.url || ''
        });
      } else {
        alert("Failed to load order details");
        setShowModal(false);
      }
    } catch (err) {
      console.error(err);
      alert("Error loading order: " + (err.response?.data?.message || err.message));
      setShowModal(false);
    } finally {
      setModalLoading(false);
    }
  };

  // ── Save Order Edits ─────────────────────────────────────────
  const handleSaveEdits = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      setLoading(true);
      const res = await api.put(`/orders/admin/${selectedOrder.id}`, formData);
      if (res.data?.success) {
        setShowModal(false);
        fetchOrders();
      } else {
        alert(res.data?.message || "Failed to update order");
      }
    } catch (err) {
      console.error("Error saving edits:", err);
      alert(err.response?.data?.message || "Error updating order");
    } finally {
      setLoading(false);
    }
  };

  // ── Delete Order ─────────────────────────────────────────────
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to permanently delete Order #${orderId}? This cannot be undone.`)) return;
    try {
      setLoading(true);
      const res = await api.delete(`/orders/admin/${orderId}`);
      if (res.data?.success) {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        // Refresh outlines count
        const outlinesRes = await api.get('/admin/orders/outlines');
        setOrderOutlines(outlinesRes.data || {});
      } else {
        alert(res.data?.message || "Failed to delete order");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting order: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // ── Export CSV ───────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ['Order ID','Customer','Mobile','Total','Del.Charge','Wallet','Promo Disc','Final Total','Payment','Status','Date'];
    const rows = orders.map(o => [
      o.id, o.customer_name || 'Guest', o.customer_mobile || o.mobile || '',
      o.total, o.delivery_charge || 0, o.wallet_balance || 0,
      o.promo_discount || 0, o.final_total || o.total,
      o.payment_method, o.status,
      new Date(o.date_added).toLocaleString()
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `orders_${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // ── Pagination ───────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const paginatedOrders = orders;

  // ── Stat outline cards config ────────────────────────────────
  const outlineCards = [
    { label: 'Pending',   key: 'pending',   icon: Clock,        color: 'text-amber-600',   bg: 'bg-amber-50'   },
    { label: 'Ready',     key: 'ready',     icon: Package,      color: 'text-blue-600',    bg: 'bg-blue-50'    },
    { label: 'Awaiting',  key: 'awaiting',  icon: RotateCcw,    color: 'text-indigo-600',  bg: 'bg-indigo-50'  },
    { label: 'Processed', key: 'processed', icon: Settings,     color: 'text-cyan-600',    bg: 'bg-cyan-50'    },
    { label: 'Shipped',   key: 'shipped',   icon: Truck,        color: 'text-orange-600',  bg: 'bg-orange-50'  },
    { label: 'Delivered', key: 'delivered', icon: CheckCircle,  color: 'text-green-600',   bg: 'bg-green-50'   },
    { label: 'Cancelled', key: 'cancelled', icon: X,            color: 'text-red-600',     bg: 'bg-red-50'     },
    { label: 'Returned',  key: 'returned',  icon: RotateCcw,    color: 'text-rose-600',    bg: 'bg-rose-50'    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-700">Manage Orders</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {orders.length} total order{orders.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Home</span>
          <ChevronDown size={14} className="-rotate-90 text-gray-300" />
          <span className="font-semibold text-purple-600">Orders</span>
        </div>
      </div>

      {/* ── Status Outline Cards ────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {outlineCards.map(({ label, key, icon: Icon, color, bg }) => (
          <button key={key}
            onClick={() => { setStatusFilter(statusFilter === key ? 'all' : key); setPage(1); }}
            className={`bg-white p-4 rounded-xl border-2 flex flex-col gap-2 hover:shadow-md hover:scale-[1.02] transition-all text-left ${
              statusFilter === key ? 'border-purple-500 shadow-md shadow-purple-100 bg-purple-50/5' : 'border-gray-100'
            }`}>
            <div className={`${bg} ${color} w-9 h-9 rounded-lg flex items-center justify-center`}>
              <Icon size={17} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{orderOutlines[key] || 0}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
          </button>
        ))}
      </div>

      {/* ── Filters ─────────────────────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              placeholder="Search order ID, name, mobile..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchOrders()}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50 outline-none transition"
            />
          </div>

          {/* Status filter */}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 font-medium">
            <option value="all">All Status</option>
            {ALL_STATUSES.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          {/* Payment filter */}
          <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 font-medium">
            <option value="all">All Payments</option>
            <option value="cod">COD</option>
            <option value="online">Online</option>
            <option value="wallet">Wallet</option>
            <option value="razorpay">Razorpay</option>
            <option value="payu">PayU</option>
          </select>

          {/* Date from */}
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            placeholder="From date"
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-600 font-medium"
          />

          {/* Date to */}
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            placeholder="To date"
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-600 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
          <button onClick={() => { setPage(1); fetchOrders(1); }}
            className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors shadow-sm">
            Apply Filters
          </button>
          <button onClick={() => { setSearch(''); setStatusFilter('all'); setPaymentFilter('all'); setFromDate(''); setToDate(''); setPage(1); }}
            className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors bg-white">
            Clear
          </button>
          <button onClick={exportCSV}
            className="ml-auto flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors bg-white">
            <Download size={15} /> Export CSV
          </button>
          <button onClick={() => fetchOrders(page)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors bg-white">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Error banner */}
        {error && (
          <div className="mx-6 mt-5 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 animate-pulse">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <p className="text-red-700 text-sm font-medium">{error}</p>
            <button onClick={fetchOrders} className="ml-auto text-red-600 text-xs font-bold hover:underline">Retry</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px] whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                {[
                  'Order ID', 'Customer', 'Mobile', 'O.Notes',
                  'Total (₹)', 'Del.Charge', 'Wallet Used', 'Promo Disc.',
                  'Final Total', 'Payment', 'Status', 'Date', 'Action'
                ].map(h => (
                  <th key={h} className="px-4 py-4 border-r border-gray-100 last:border-r-0 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="13" className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
                      <p className="text-gray-400 font-medium text-sm">Loading orders...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan="13" className="py-24 text-center bg-gray-50/10">
                    <div className="flex flex-col items-center gap-3">
                      <ShoppingCart size={44} className="text-gray-200" />
                      <p className="text-gray-500 font-bold">No orders found</p>
                      <p className="text-gray-400 text-xs">
                        {search || statusFilter !== 'all' || paymentFilter !== 'all'
                          ? 'Try adjusting your filters'
                          : 'Orders will appear here once placed'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map(order => {
                  const ss = STATUS_STYLES[order.status?.toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
                  const isEditing = editingId === order.id;
                  const isUpdating = updatingId === order.id;
                  return (
                    <tr key={order.id} className="hover:bg-purple-50/10 transition-colors group">
                      {/* Order ID */}
                      <td className="px-4 py-3.5 border-r border-gray-50">
                        <button 
                          onClick={() => openOrderModal(order.id)}
                          className="font-bold text-purple-600 hover:underline hover:text-purple-700 block text-left"
                        >
                          #{order.id}
                        </button>
                        {order.is_pos_order == 1 && (
                          <span className="mt-1 text-[8px] bg-blue-100 text-blue-600 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider block w-fit">POS</span>
                        )}
                        {order.is_local_pickup == 1 && (
                          <span className="mt-1 text-[8px] bg-emerald-100 text-emerald-600 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider block w-fit">PICKUP</span>
                        )}
                      </td>
                      {/* Customer */}
                      <td className="px-4 py-3.5 border-r border-gray-50">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                            {(order.customer_name || order.mobile || 'G')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 truncate max-w-[110px]">
                              {order.customer_name || 'Guest'}
                            </p>
                            {order.customer_email && (
                              <p className="text-[10px] text-gray-400 truncate max-w-[110px]">{order.customer_email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      {/* Mobile */}
                      <td className="px-4 py-3.5 border-r border-gray-50 text-gray-600 font-medium">
                        {order.customer_mobile || order.mobile || '—'}
                      </td>
                      {/* Notes */}
                      <td className="px-4 py-3.5 border-r border-gray-50 text-gray-500 max-w-[120px] truncate" title={order.notes || order.seller_notes}>
                        {order.notes || order.seller_notes || '—'}
                      </td>
                      {/* Total */}
                      <td className="px-4 py-3.5 border-r border-gray-50 font-bold text-slate-700">
                        {fmtINR(order.total)}
                      </td>
                      {/* Delivery Charge */}
                      <td className="px-4 py-3.5 border-r border-gray-50 text-gray-600 font-semibold">
                        {order.delivery_charge > 0 ? fmtINR(order.delivery_charge) : <span className="text-green-600 font-bold text-[10px] tracking-wide bg-green-50 border border-green-100 px-1.5 py-0.5 rounded">FREE</span>}
                      </td>
                      {/* Wallet Used */}
                      <td className="px-4 py-3.5 border-r border-gray-50 text-gray-600 font-semibold">
                        {fmtINR(order.wallet_balance)}
                      </td>
                      {/* Promo Discount */}
                      <td className="px-4 py-3.5 border-r border-gray-50 text-gray-600">
                        {order.promo_discount > 0
                          ? <span className="text-orange-600 font-bold">-{fmtINR(order.promo_discount)}</span>
                          : '—'}
                      </td>
                      {/* Final Total */}
                      <td className="px-4 py-3.5 border-r border-gray-50 font-extrabold text-slate-800 bg-purple-50/10">
                        {fmtINR(order.final_total || order.total)}
                      </td>
                      {/* Payment */}
                      <td className="px-4 py-3.5 border-r border-gray-50">
                        <span className="uppercase text-[9px] font-extrabold px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 tracking-wider">
                          {order.payment_method || '—'}
                        </span>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3.5 border-r border-gray-50">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <select
                              defaultValue={order.status}
                              disabled={isUpdating}
                              autoFocus
                              onChange={e => handleStatusUpdate(order.id, e.target.value)}
                              onBlur={() => setEditingId(null)}
                              className="text-[11px] border border-purple-300 rounded-lg py-1 px-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white font-semibold">
                              {ALL_STATUSES.map(s => (
                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                              ))}
                            </select>
                            {isUpdating && <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />}
                          </div>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${ss.bg} ${ss.text}`}>
                            {order.status || '—'}
                          </span>
                        )}
                      </td>
                      {/* Date */}
                      <td className="px-4 py-3.5 border-r border-gray-50 text-gray-500 font-medium">
                        {fmtDate(order.date_added)}
                      </td>
                      {/* Action */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openOrderModal(order.id)}
                            title="View / Edit Details"
                            className="p-1.5 hover:bg-purple-50 rounded-lg text-gray-400 hover:text-purple-600 transition-all">
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => setEditingId(isEditing ? null : order.id)}
                            title="Edit Status"
                            className="p-1.5 hover:bg-purple-50 rounded-lg text-gray-400 hover:text-purple-600 transition-all">
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            title="Delete Order"
                            className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ──────────────────────────────────── */}
        {!loading && totalCount > PAGE_SIZE && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
                ← Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 text-sm rounded-lg font-medium transition-colors ${
                      page === p ? 'bg-purple-600 text-white' : 'hover:bg-gray-50 text-gray-600 border border-gray-200'
                    }`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── View / Edit Details Modal ───────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] scale-in duration-300">
            
            {/* Modal Header */}
            <div className="bg-purple-600 px-6 py-4 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-2">
                <ClipboardList size={18} className="text-purple-200" />
                <h3 className="font-bold text-lg">Order Details #{selectedOrder?.id}</h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white p-1 hover:bg-purple-700/50 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Tabs Row */}
            <div className="bg-slate-50 border-b border-gray-100 px-6 py-2 flex items-center gap-1 overflow-x-auto scrollbar-hide shrink-0">
              {[
                { id: 'status', label: 'Order Status & Tracking', icon: Clock },
                { id: 'billing', label: 'Billing Summary', icon: DollarSign },
                { id: 'shipping', label: 'Shipping & Logistics', icon: Truck },
                { id: 'notes', label: 'Notes & Attachments', icon: FileText },
                { id: 'items', label: 'Ordered Items', icon: Package },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-all tracking-wider flex items-center gap-1.5 ${
                    activeTab === tab.id 
                      ? 'bg-purple-100 text-purple-700 shadow-sm'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon size={13} /> {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Form Content */}
            {modalLoading ? (
              <div className="flex-1 py-32 flex flex-col items-center justify-center gap-3">
                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
                <p className="text-gray-400 font-medium text-sm">Loading details...</p>
              </div>
            ) : (
              <form onSubmit={handleSaveEdits} className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* TAB 1: ORDER STATUS */}
                {activeTab === 'status' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Order Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                          className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 outline-none bg-white font-semibold"
                        >
                          {ALL_STATUSES.map(status => (
                            <option key={status} value={status}>{status.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Active Status (Detail)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Order received, out for delivery..."
                          value={formData.active_status}
                          onChange={(e) => setFormData({...formData, active_status: e.target.value})}
                          className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-semibold"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Delivery Boy ID</label>
                          <input 
                            type="number" 
                            placeholder="delivery_boy_id"
                            value={formData.delivery_boy_id}
                            onChange={(e) => setFormData({...formData, delivery_boy_id: e.target.value})}
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Delivery Verification OTP</label>
                          <input 
                            type="number" 
                            placeholder="OTP code"
                            value={formData.otp}
                            onChange={(e) => setFormData({...formData, otp: e.target.value})}
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-semibold"
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 border border-gray-150 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-700">Point of Sale (POS) Order</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Identified as local checkout counter order</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, is_pos_order: !formData.is_pos_order})}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            formData.is_pos_order ? 'bg-purple-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            formData.is_pos_order ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: BILLING SUMMARY */}
                {activeTab === 'billing' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Subtotal Total (₹)</label>
                          <input 
                            type="text" 
                            disabled
                            value={fmtINR(selectedOrder?.total)}
                            className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm font-semibold text-gray-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Delivery Charge (₹)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            value={formData.delivery_charge}
                            onChange={(e) => setFormData({...formData, delivery_charge: e.target.value})}
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-semibold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Wallet Balance Used (₹)</label>
                          <input 
                            type="text" 
                            disabled
                            value={fmtINR(selectedOrder?.wallet_balance)}
                            className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm font-semibold text-gray-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Promo Discount (₹)</label>
                          <input 
                            type="text" 
                            disabled
                            value={fmtINR(selectedOrder?.promo_discount)}
                            className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm font-semibold text-gray-500 outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Used Promo Code</label>
                          <span className="block border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm font-extrabold text-purple-700 tracking-wider">
                            {selectedOrder?.promo_code || 'NONE'}
                          </span>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Net Payable Amount (₹)</label>
                          <span className="block border border-purple-200 bg-purple-50/20 rounded-xl p-3 text-sm font-extrabold text-purple-800">
                            {fmtINR(selectedOrder?.final_total || selectedOrder?.total)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Payment Method</label>
                        <span className="block border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm font-extrabold text-slate-700 uppercase tracking-widest">
                          {selectedOrder?.payment_method || '—'}
                        </span>
                      </div>

                      <div className="p-4 bg-slate-50 border border-gray-150 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-700">Delivery Charge Returnable</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Toggle if shipping fees can be refunded on cancellations</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, is_delivery_charge_returnable: !formData.is_delivery_charge_returnable})}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            formData.is_delivery_charge_returnable ? 'bg-purple-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            formData.is_delivery_charge_returnable ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: SHIPPING & LOGISTICS */}
                {activeTab === 'shipping' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Mobile Number</label>
                          <input 
                            type="text" 
                            value={formData.mobile}
                            onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Email Address</label>
                          <input 
                            type="email" 
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-semibold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Shipping Address</label>
                        <textarea 
                          rows="3"
                          value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all resize-none font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Latitude</label>
                          <input 
                            type="text" 
                            placeholder="Coordinates Lat"
                            value={formData.latitude}
                            onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Longitude</label>
                          <input 
                            type="text" 
                            placeholder="Coordinates Lng"
                            value={formData.longitude}
                            onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 border border-gray-150 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-700">Self Local Pickup</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Toggle if the customer picks up the order locally</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, is_local_pickup: !formData.is_local_pickup})}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            formData.is_local_pickup ? 'bg-purple-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            formData.is_local_pickup ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      {formData.is_local_pickup ? (
                        <div className="animate-in slide-in-from-top duration-200">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Local Pickup Time</label>
                          <input 
                            type="datetime-local" 
                            value={formData.pickup_time}
                            onChange={(e) => setFormData({...formData, pickup_time: e.target.value})}
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-semibold"
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top duration-200">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Delivery Date</label>
                            <input 
                              type="date" 
                              value={formData.delivery_date}
                              onChange={(e) => setFormData({...formData, delivery_date: e.target.value})}
                              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-semibold text-gray-700"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Delivery Time Slot</label>
                            <input 
                              type="text" 
                              placeholder="e.g. 10:00 AM - 01:00 PM"
                              value={formData.delivery_time}
                              onChange={(e) => setFormData({...formData, delivery_time: e.target.value})}
                              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-semibold text-gray-750"
                            />
                          </div>
                        </div>
                      )}

                      {!formData.is_local_pickup && (
                        <div className="border-t border-gray-100 pt-4 mt-4 space-y-4 animate-in slide-in-from-top duration-200">
                          <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">Logistics & Tracking Details</p>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Courier Agency</label>
                              <input 
                                type="text" 
                                placeholder="e.g. FedEx, BlueDart..."
                                value={formData.courier_agency}
                                onChange={(e) => setFormData({...formData, courier_agency: e.target.value})}
                                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-semibold text-gray-750"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Tracking ID</label>
                              <input 
                                type="text" 
                                placeholder="e.g. TRACK12345"
                                value={formData.tracking_id}
                                onChange={(e) => setFormData({...formData, tracking_id: e.target.value})}
                                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-semibold text-gray-750"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Tracking URL</label>
                            <input 
                              type="text" 
                              placeholder="e.g. https://fedex.com/track"
                              value={formData.url}
                              onChange={(e) => setFormData({...formData, url: e.target.value})}
                              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-semibold text-gray-750"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 4: NOTES & ATTACHMENTS */}
                {activeTab === 'notes' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Customer Ordering Notes</label>
                        <textarea 
                          rows="3"
                          placeholder="Customer left notes..."
                          value={formData.notes}
                          onChange={(e) => setFormData({...formData, notes: e.target.value})}
                          className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all resize-none font-medium"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Seller Internal Notes</label>
                        <textarea 
                          rows="3"
                          placeholder="Internal admin comments..."
                          value={formData.seller_notes}
                          onChange={(e) => setFormData({...formData, seller_notes: e.target.value})}
                          className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all resize-none font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Order Attachments / Document links</label>
                      <input 
                        type="text" 
                        placeholder="Files, PDFs, or receipts links"
                        value={formData.attachments}
                        onChange={(e) => setFormData({...formData, attachments: e.target.value})}
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-semibold text-slate-700"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 5: ORDERED ITEMS */}
                {activeTab === 'items' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <ClipboardList size={16} className="text-purple-500" /> Items List
                    </h4>
                    
                    <div className="overflow-x-auto border border-gray-100 rounded-xl">
                      <table className="w-full text-left text-[12px] whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3 border-r border-gray-100">Product Name</th>
                            <th className="px-4 py-3 border-r border-gray-100">Variant Weight</th>
                            <th className="px-4 py-3 border-r border-gray-100 text-right">Price</th>
                            <th className="px-4 py-3 border-r border-gray-100 text-center">Quantity</th>
                            <th className="px-4 py-3 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 font-medium">
                          {selectedOrder?.items?.length === 0 || !selectedOrder?.items ? (
                            <tr>
                              <td colSpan="5" className="px-4 py-8 text-center text-gray-400 italic">No items found in this order</td>
                            </tr>
                          ) : (
                            selectedOrder.items.map((item, idx) => (
                              <tr key={idx} className="hover:bg-purple-50/5">
                                <td className="px-4 py-3.5 border-r border-gray-50 text-slate-800 font-bold">{item.name}</td>
                                <td className="px-4 py-3.5 border-r border-gray-50 text-gray-500 font-semibold">{item.weight || 'Single Variant'}</td>
                                <td className="px-4 py-3.5 border-r border-gray-50 text-right font-bold text-slate-700">{fmtINR(item.price)}</td>
                                <td className="px-4 py-3.5 border-r border-gray-50 text-center font-bold text-purple-600">{item.quantity}</td>
                                <td className="px-4 py-3.5 text-right font-bold text-slate-800">{fmtINR(item.price * item.quantity)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div className="flex justify-between items-center pt-6 border-t border-gray-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDeleteOrder(selectedOrder.id)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs uppercase transition shadow-sm"
                  >
                    <Trash2 size={14} /> Delete Order
                  </button>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-bold hover:bg-gray-50 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-purple-700 transition-colors text-sm shadow-sm"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>

              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
