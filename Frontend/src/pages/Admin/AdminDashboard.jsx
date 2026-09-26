import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import {
  ShoppingCart, Package, Users, RefreshCw, Truck,
  Search, AlertCircle, CheckCircle, RotateCcw, Settings, X,
  MessageSquare, Send, User, MoreVertical, ChevronLeft,
  Circle, Filter, ArrowUpDown, Eye, Clock
} from 'lucide-react';

// Helpers
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function fmtINR(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return '₹0';
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS_STYLES = {
  pending:   'bg-amber-100 text-amber-700',
  ready:     'bg-blue-100 text-blue-700',
  awaiting:  'bg-indigo-100 text-indigo-700',
  processed: 'bg-cyan-100 text-cyan-700',
  shipped:   'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  returned:  'bg-rose-100 text-rose-700',
};

// AdminDashboard
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ orders: 0, newSigns: 0, deliveryBoys: 0, products: 0 });
  const [orderOutlines, setOrderOutlines] = useState({
    pending: 0, ready: 0, awaiting: 0, processed: 0,
    shipped: 0, delivered: 0, cancelled: 0, returned: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  // ── Fetch dashboard data ─────────────────────────────────────
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, outlinesRes, recentRes, trendRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/orders/outlines'),
        api.get('/admin/orders/recent'),
        api.get('/admin/sales-trend'),
      ]);
      setStats(statsRes.data || {});
      setOrderOutlines(outlinesRes.data || {});
      setRecentOrders(recentRes.data || []);
      setSalesTrend(trendRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch unread badge count ──────────────────────────────────
  const fetchUnread = useCallback(async () => {
    try {
      const res = await api.get('/admin/chat/unread');
      setUnreadTotal(res.data.unread || 0);
    } catch { /* silent */ }
  }, []);

  // ── Fetch chat users list ─────────────────────────────────────
  const fetchChatUsers = useCallback(async () => {
    try {
      setChatLoading(true);
      const res = await api.get('/admin/chat/users');
      setChatUsers(res.data.users || []);
    } catch { /* silent */ } finally {
      setChatLoading(false);
    }
  }, []);

  // ── Fetch messages for a specific user ───────────────────────
  const fetchMessages = useCallback(async (userId) => {
    try {
      setMsgsLoading(true);
      const res = await api.get(`/admin/chat/${userId}/messages`);
      setMessages(res.data.messages || []);
      // Refresh chat users to update unread badge
      fetchChatUsers();
      fetchUnread();
    } catch { /* silent */ } finally {
      setMsgsLoading(false);
    }
  }, [fetchChatUsers, fetchUnread]);

  // ── Select a user to chat ────────────────────────────────────
  const handleSelectUser = useCallback((user) => {
    setSelectedUser(user);
    fetchMessages(user.id);
    // Start polling every 5 seconds
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      fetchMessages(user.id);
    }, 5000);
  }, [fetchMessages]);

  // ── Send a message ───────────────────────────────────────────
  const handleSend = async () => {
    if (!msgInput.trim() || !selectedUser || sending) return;
    const text = msgInput.trim();
    setMsgInput('');
    setSending(true);
    try {
      const res = await api.post(`/admin/chat/${selectedUser.id}/messages`, { message: text });
      setMessages(prev => [...prev, res.data.message]);
    } catch {
      setMsgInput(text); // restore on failure
    } finally {
      setSending(false);
    }
  };

  // ── Scroll to bottom when messages change ───────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Open chat panel ──────────────────────────────────────────
  useEffect(() => {
    if (isChatOpen) {
      fetchChatUsers();
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
      setSelectedUser(null);
      setMessages([]);
    }
  }, [isChatOpen, fetchChatUsers]);

  // ── On mount ─────────────────────────────────────────────────
  useEffect(() => {
    fetchDashboardData();
    fetchUnread();
    const unreadInterval = setInterval(fetchUnread, 30000);
    return () => {
      clearInterval(unreadInterval);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchUnread]);

  // ── Filtered orders ──────────────────────────────────────────
  const filteredOrders = recentOrders.filter(order => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      String(order.id).includes(q) ||
      (order.customer_name || '').toLowerCase().includes(q) ||
      (order.mobile || '').includes(q) ||
      (order.payment_method || '').toLowerCase().includes(q) ||
      (order.status || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Calculate 7 Days Sales & Orders Trend ───────────────────
  const getTrendData = () => {
    const data = [];
    const today = new Date();
    
    // Group backend trend data by YYYY-MM-DD date key
    const trendMap = {};
    salesTrend.forEach(row => {
      if (!row.date_key) return;
      const dKey = new Date(row.date_key).toISOString().split('T')[0];
      trendMap[dKey] = {
        sales: parseFloat(row.total_sales || 0),
        count: parseInt(row.order_count || 0, 10)
      };
    });

    // Generate last 7 days with live DB data and 0 fallback (absolutely NO mock/static fallback)
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      
      if (trendMap[dateKey]) {
        data.push({
          date: label,
          rawDate: dateKey,
          sales: trendMap[dateKey].sales,
          count: trendMap[dateKey].count
        });
      } else {
        data.push({
          date: label,
          rawDate: dateKey,
          sales: 0,
          count: 0
        });
      }
    }
    return data;
  };

  const trendData = getTrendData();

  // ── Loading / Error states ───────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
        <p className="text-gray-600 font-medium">Loading dashboard...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-8 text-center bg-white min-h-screen flex flex-col items-center justify-center">
      <AlertCircle size={64} className="text-red-500 mb-6" />
      <h2 className="text-2xl font-bold text-gray-800 mb-3">Something went wrong</h2>
      <p className="text-gray-600 max-w-md mb-8">{error}</p>
      <button onClick={fetchDashboardData}
        className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2">
        <RefreshCw size={18} /> Retry
      </button>
    </div>
  );

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen space-y-8">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back! Here's what's happening.</p>
        </div>
        <button onClick={fetchDashboardData}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium shadow-sm text-gray-700">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* ── Top Stat Cards ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Orders"   value={stats.orders?.toLocaleString() || '0'}       icon={ShoppingCart} color="from-purple-500 to-purple-700" />
        <StatCard title="New Sign Ups"   value={stats.newSigns?.toLocaleString() || '0'}      icon={Users}        color="from-blue-500 to-blue-700" />
        <StatCard title="Delivery Boys"  value={stats.deliveryBoys?.toLocaleString() || '0'}  icon={Truck}        color="from-emerald-500 to-emerald-700" />
        <StatCard title="Total Products" value={stats.products?.toLocaleString() || '0'}      icon={Package}      color="from-orange-500 to-orange-600" />
      </div>

      {/* ── Analytics Graphs Section ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
        <div className="lg:col-span-2">
          <TrendChart data={trendData} />
        </div>
        <div className="lg:col-span-1">
          <DonutChart outlines={orderOutlines} />
        </div>
      </div>

      {/* ── Order Status Overview ────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-500 mb-5 uppercase tracking-widest">Order Status Overview</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'Pending',        key: 'pending',   icon: Clock,        color: 'text-amber-600',   bg: 'bg-amber-50' },
            { label: 'Ready',          key: 'ready',     icon: Package,      color: 'text-blue-600',    bg: 'bg-blue-50' },
            { label: 'Awaiting',       key: 'awaiting',  icon: RefreshCw,    color: 'text-indigo-600',  bg: 'bg-indigo-50' },
            { label: 'Processed',      key: 'processed', icon: Settings,     color: 'text-cyan-600',    bg: 'bg-cyan-50' },
            { label: 'Shipped',        key: 'shipped',   icon: Truck,        color: 'text-orange-600',  bg: 'bg-orange-50' },
            { label: 'Delivered',      key: 'delivered', icon: CheckCircle,  color: 'text-green-600',   bg: 'bg-green-50' },
            { label: 'Cancelled',      key: 'cancelled', icon: X,            color: 'text-red-600',     bg: 'bg-red-50' },
            { label: 'Returned',       key: 'returned',  icon: RotateCcw,    color: 'text-rose-600',    bg: 'bg-rose-50' },
          ].map(({ label, key, icon: Icon, color, bg }) => (
            <button key={key} onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
              className={`p-4 rounded-xl border-2 flex flex-col gap-2 hover:shadow-md transition-all ${
                statusFilter === key ? 'border-purple-500 shadow-md shadow-purple-100' : 'border-gray-100'
              }`}>
              <div className={`${bg} ${color} w-9 h-9 rounded-lg flex items-center justify-center self-start`}>
                <Icon size={17} />
              </div>
              <p className="text-2xl font-bold text-gray-800">{orderOutlines[key] || 0}</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-tight">{label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Recent Orders Table ──────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Recent Orders</h3>
            <p className="text-gray-400 text-xs mt-0.5">{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} shown</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search by ID, name, status..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </div>
            {/* Status filter dropdown */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 font-medium">
              <option value="all">All Status</option>
              {['pending','ready','awaiting','processed','shipped','delivered','cancelled','returned'].map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <button onClick={fetchDashboardData}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm font-semibold shadow-sm">
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Order ID', 'Customer', 'Mobile', 'Amount', 'Payment', 'Status', 'Date', 'Action'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-purple-50/40 transition-colors group">
                    {/* Order ID */}
                    <td className="px-5 py-3.5 font-bold text-purple-600 whitespace-nowrap">
                      #{order.id}
                    </td>
                    {/* Customer */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {(order.customer_name || order.mobile || 'G')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm leading-tight">
                            {order.customer_name || 'Guest'}
                          </p>
                          {order.customer_email && (
                            <p className="text-[11px] text-gray-400 truncate max-w-[140px]">{order.customer_email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Mobile */}
                    <td className="px-5 py-3.5 text-gray-600 text-sm whitespace-nowrap">
                      {order.customer_mobile || order.mobile || '—'}
                    </td>
                    {/* Amount */}
                    <td className="px-5 py-3.5 font-bold text-gray-800 whitespace-nowrap">
                      {fmtINR(order.final_total || order.total)}
                    </td>
                    {/* Payment */}
                    <td className="px-5 py-3.5">
                      <span className="uppercase text-[10px] font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 tracking-wide">
                        {order.payment_method || '—'}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        STATUS_STYLES[order.status?.toLowerCase()] || 'bg-gray-100 text-gray-600'
                      }`}>
                        {order.status || '—'}
                      </span>
                    </td>
                    {/* Date */}
                    <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                      {fmtDate(order.date_added)}
                    </td>
                    {/* Action */}
                    <td className="px-5 py-3.5">
                      <button 
                        onClick={() => navigate('/admin/orders', { state: { searchOrderId: order.id } })}
                        title="View Order Details"
                        className="p-1.5 hover:bg-purple-100 rounded-lg text-gray-400 hover:text-purple-600 transition-all opacity-0 group-hover:opacity-100 border-none bg-transparent cursor-pointer"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <ShoppingCart size={44} className="text-gray-200" />
                      <p className="text-gray-500 font-semibold">
                        {searchQuery || statusFilter !== 'all' ? 'No orders match your search' : 'No orders yet'}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {searchQuery || statusFilter !== 'all'
                          ? 'Try a different search term or filter'
                          : 'Orders will appear here once customers start purchasing.'}
                      </p>
                      {(searchQuery || statusFilter !== 'all') && (
                        <button onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                          className="mt-2 text-purple-600 text-sm font-semibold hover:underline">
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Floating Chat Button ─────────────────────────── */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-full shadow-2xl shadow-purple-300 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40">
        <MessageSquare size={24} />
        {unreadTotal > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold">
            {unreadTotal > 99 ? '99+' : unreadTotal}
          </span>
        )}
      </button>

      {/* ── Chat Drawer ──────────────────────────────────── */}
      {isChatOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40" onClick={() => setIsChatOpen(false)} />

          {/* Drawer */}
          <div className="fixed top-0 right-0 h-full w-full sm:w-[380px] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-100"
            style={{ animation: 'slideInRight 0.25s ease' }}>

            {/* ─ No user selected: user list ─ */}
            {!selectedUser ? (
              <>
                {/* Header */}
                <div className="p-5 bg-gradient-to-r from-purple-600 to-purple-800 text-white flex items-center justify-between shrink-0">
                  <div>
                    <h4 className="font-bold text-lg leading-tight">Messages</h4>
                    <p className="text-purple-200 text-xs mt-0.5">
                      {unreadTotal > 0 ? `${unreadTotal} unread message${unreadTotal > 1 ? 's' : ''}` : 'All caught up!'}
                    </p>
                  </div>
                  <button onClick={() => setIsChatOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {/* User list */}
                <div className="flex-1 overflow-y-auto">
                  {chatLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
                    </div>
                  ) : chatUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
                      <MessageSquare size={48} className="text-gray-200" />
                      <p className="text-gray-500 font-semibold">No conversations yet</p>
                      <p className="text-gray-400 text-xs">Messages from customers will appear here.</p>
                    </div>
                  ) : (
                    chatUsers.map(user => (
                      <button key={user.id} onClick={() => handleSelectUser(user)}
                        className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center font-bold text-sm">
                            {(user.username || 'U')[0].toUpperCase()}
                          </div>
                          {user.unread_count > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white">
                              {user.unread_count}
                            </span>
                          )}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-gray-800 text-sm truncate">{user.username || 'Unknown'}</p>
                            <span className="text-[10px] text-gray-400 shrink-0 ml-2">{timeAgo(user.last_message_time)}</span>
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {user.last_message || user.email || user.mobile || '—'}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Refresh chat list */}
                <div className="p-3 border-t border-gray-100 shrink-0">
                  <button onClick={fetchChatUsers}
                    className="w-full py-2 text-purple-600 text-sm font-semibold hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>
              </>
            ) : (
              /* ─ User selected: message thread ─ */
              <>
                {/* Chat Header */}
                <div className="p-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white flex items-center gap-3 shrink-0">
                  <button onClick={() => { setSelectedUser(null); setMessages([]); if (pollRef.current) clearInterval(pollRef.current); }}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors shrink-0">
                    <ChevronLeft size={20} />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm shrink-0">
                    {(selectedUser.username || 'U')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base leading-tight truncate">{selectedUser.username}</p>
                    <p className="text-purple-200 text-xs">{selectedUser.mobile || selectedUser.email || 'Customer'}</p>
                  </div>
                  <button onClick={() => setIsChatOpen(false)}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors shrink-0">
                    <X size={18} />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/60">
                  {msgsLoading ? (
                    <div className="flex items-center justify-center h-24">
                      <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
                      <MessageSquare size={32} className="text-gray-300" />
                      <p className="text-gray-400 text-sm">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isAdmin = msg.from_id !== selectedUser.id;
                      return (
                        <div key={msg.id || idx} className={`flex items-end gap-2 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isAdmin ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {isAdmin ? 'AD' : (selectedUser.username || 'U')[0].toUpperCase()}
                          </div>
                          <div className={`max-w-[75%] ${isAdmin ? 'items-end' : 'items-start'} flex flex-col`}>
                            <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              isAdmin
                                ? 'bg-purple-600 text-white rounded-tr-none shadow-md'
                                : 'bg-white text-gray-800 rounded-tl-none shadow-sm border border-gray-100'
                            }`}>
                              {msg.message}
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1 font-medium">
                              {timeAgo(msg.date_created)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-gray-100 bg-white shrink-0">
                  <div className="flex gap-2 p-2 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-400 transition-all">
                    <input
                      type="text"
                      value={msgInput}
                      onChange={e => setMsgInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      placeholder="Type a message..."
                      disabled={sending}
                      className="flex-1 bg-transparent border-none outline-none px-2 py-1 text-sm text-gray-800 placeholder-gray-400"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!msgInput.trim() || sending}
                      className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95">
                      <Send size={17} />
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 text-center mt-2">Press Enter to send</p>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Slide-in animation */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Reusable Components
// ─────────────────────────────────────────────────────────────────

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white p-6 rounded-2xl flex items-center gap-5 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className={`bg-gradient-to-br ${color} p-4 rounded-xl text-white shadow-lg shrink-0`}>
        <Icon size={26} />
      </div>
      <div className="min-w-0">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
        <p className="text-3xl font-extrabold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

// ── Custom Interactive SVG Trend Chart ──────────────────────────────────────
function TrendChart({ data }) {
  const [activeTab, setActiveTab] = useState('sales');
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const width = 600;
  const height = 250;
  const paddingX = 65;
  const paddingY = 30;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const values = data.map(d => activeTab === 'sales' ? d.sales : d.count);
  const maxVal = Math.max(...values, activeTab === 'sales' ? 1000 : 5) * 1.15;

  const points = data.map((d, idx) => {
    const x = paddingX + (idx * chartWidth) / (data.length - 1);
    const val = activeTab === 'sales' ? d.sales : d.count;
    const y = height - paddingY - (val * chartHeight) / maxVal;
    return { x, y, val, label: d.date, raw: d };
  });

  let pathD = '';
  let areaD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX1 = curr.x + chartWidth / (data.length - 1) / 3;
      const cpY1 = curr.y;
      const cpX2 = next.x - chartWidth / (data.length - 1) / 3;
      const cpY2 = next.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }
    areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;
  }

  const gridLinesCount = 4;
  const gridLines = Array.from({ length: gridLinesCount + 1 }).map((_, idx) => {
    const val = (maxVal * idx) / gridLinesCount;
    const y = height - paddingY - (val * chartHeight) / maxVal;
    return { y, val };
  });

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full select-none">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Performance Trend</h3>
          <p className="text-xs text-gray-400 mt-0.5">Sales & orders over the last 7 days</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => { setActiveTab('sales'); setHoveredIdx(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
              activeTab === 'sales' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Sales (₹)
          </button>
          <button
            onClick={() => { setActiveTab('count'); setHoveredIdx(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
              activeTab === 'count' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Orders
          </button>
        </div>
      </div>

      <div className="relative flex-1">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
          </defs>

          {gridLines.map((line, idx) => (
            <g key={idx}>
              <line
                x1={paddingX}
                y1={line.y}
                x2={width - paddingX}
                y2={line.y}
                stroke="#F3F4F6"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text
                x={paddingX - 12}
                y={line.y + 3.5}
                textAnchor="end"
                className="fill-gray-400 font-sans font-semibold text-[10px] tracking-wide"
              >
                {activeTab === 'sales'
                  ? `₹${Math.round(line.val).toLocaleString('en-IN')}`
                  : Math.round(line.val)}
              </text>
            </g>
          ))}

          {points.map((p, idx) => (
            <text
              key={idx}
              x={p.x}
              y={height - paddingY + 18}
              textAnchor="middle"
              className="fill-gray-400 font-sans font-semibold text-[10px] tracking-wide"
            >
              {p.label}
            </text>
          ))}

          {areaD && <path d={areaD} fill="url(#areaGradient)" />}

          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {points.map((p, idx) => {
            const stepWidth = chartWidth / (data.length - 1);
            const startX = p.x - stepWidth / 2;
            return (
              <rect
                key={idx}
                x={startX}
                y={paddingY}
                width={stepWidth}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}

          {hoveredIdx !== null && (
            <g>
              <line
                x1={points[hoveredIdx].x}
                y1={paddingY}
                x2={points[hoveredIdx].x}
                y2={height - paddingY}
                stroke="#8B5CF6"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle
                cx={points[hoveredIdx].x}
                cy={points[hoveredIdx].y}
                r="6.5"
                fill="#FFFFFF"
                stroke="#8B5CF6"
                strokeWidth="3"
                className="shadow-sm"
              />
            </g>
          )}
        </svg>

        {hoveredIdx !== null && (
          <div
            className="absolute bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs flex flex-col gap-1 z-20 pointer-events-none transform -translate-x-1/2 -translate-y-[110%] backdrop-blur-sm"
            style={{
              left: `${(points[hoveredIdx].x / width) * 100}%`,
              top: `${(points[hoveredIdx].y / height) * 100}%`,
              transition: 'left 0.08s ease, top 0.08s ease'
            }}
          >
            <p className="font-bold text-slate-300 border-b border-slate-800 pb-1 mb-1 whitespace-nowrap">
              {points[hoveredIdx].raw.date}
            </p>
            <p className="flex justify-between gap-4 whitespace-nowrap">
              <span className="text-slate-400 font-medium">Revenue:</span>
              <span className="font-bold text-emerald-400">₹{points[hoveredIdx].raw.sales.toLocaleString('en-IN')}</span>
            </p>
            <p className="flex justify-between gap-4 whitespace-nowrap">
              <span className="text-slate-400 font-medium">OrdersCount:</span>
              <span className="font-bold text-purple-300">{points[hoveredIdx].raw.count}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Custom Interactive SVG Donut Chart ──────────────────────────────────────
function DonutChart({ outlines }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const statusConfig = [
    { label: 'Pending',   key: 'pending',   color: '#F59E0B' },
    { label: 'Delivered', key: 'delivered', color: '#10B981' },
    { label: 'Shipped',   key: 'shipped',   color: '#F97316' },
    { label: 'Cancelled', key: 'cancelled', color: '#EF4444' },
    { label: 'Other',     key: 'other',     color: '#6366F1' },
  ];

  const data = statusConfig.map(status => {
    let count = 0;
    if (status.key === 'other') {
      count = (outlines.ready || 0) + (outlines.awaiting || 0) + (outlines.processed || 0) + (outlines.returned || 0);
    } else {
      count = outlines[status.key] || 0;
    }
    return { ...status, count };
  });

  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (total === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full select-none justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Order Distribution</h3>
          <p className="text-xs text-gray-400 mt-0.5">Share by order status</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-3 min-h-[180px]">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
            <ShoppingCart size={28} />
          </div>
          <div>
            <p className="font-semibold text-gray-700 text-sm">No orders recorded yet</p>
            <p className="text-xs text-gray-400 max-w-[180px] mt-1">Once sales are placed on your storefront, the distribution breakdown will display here.</p>
          </div>
        </div>
      </div>
    );
  }

  const size = 200;
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = 17;
  const center = size / 2;

  let currentOffset = 0;
  const segments = data.map((item, idx) => {
    const percentage = (item.count / total) * 100;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = currentOffset;
    currentOffset -= (percentage / 100) * circumference;

    return {
      ...item,
      percentage,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeSegment = hoveredIdx !== null ? segments[hoveredIdx] : null;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full select-none">
      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Order Distribution</h3>
        <p className="text-xs text-gray-400 mt-0.5">Share by order status</p>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center justify-center gap-6 mt-4">
        <div className="relative w-[150px] h-[150px] shrink-0">
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full transform -rotate-90 overflow-visible">
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#F3F4F6"
              strokeWidth={strokeWidth}
            />

            {segments.map((seg, idx) => (
              <circle
                key={idx}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={hoveredIdx === idx ? strokeWidth + 3 : strokeWidth}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            ))}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-2xl font-extrabold text-gray-800 leading-tight">
              {activeSegment ? activeSegment.count : total}
            </span>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
              {activeSegment ? activeSegment.label : 'Total Orders'}
            </span>
            {activeSegment && (
              <span className="text-[9px] text-gray-500 font-medium">
                ({activeSegment.percentage.toFixed(1)}%)
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0 w-full xl:w-auto xl:min-w-[120px] max-w-[160px]">
          {segments.map((seg, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between gap-4 p-1 rounded-lg transition-colors cursor-pointer ${
                hoveredIdx === idx ? 'bg-gray-50' : ''
              }`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="text-[11px] font-semibold text-gray-600">{seg.label}</span>
              </div>
              <span className="text-[11px] font-bold text-gray-800">{seg.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}