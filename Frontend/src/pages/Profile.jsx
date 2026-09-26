import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useWishlistStore } from '../store/wishlistStore';
import api from '../lib/api';
import { getImageUrl, NO_IMAGE_SVG } from '../lib/imageUrl';
import { 
  LogOut, ShoppingBag, MapPin, User, Mail, Phone, ChevronRight, 
  CheckCircle2, AlertCircle, ShieldCheck, LayoutDashboard, 
  Heart, Trash2, Headphones, Clipboard
} from 'lucide-react';
import { useToastStore } from '../store/toastStore';

export default function Profile() {
  const { user, logout, setUser } = useAuthStore();
  const { wishlistItems: wishlist, fetchWishlist, toggleWishlist } = useWishlistStore();
  const { showToast } = useToastStore();
  const navigate = useNavigate();

  // Active Tab State
  const [activeTab, setActiveTab] = useState('Dashboard');

  // Profile Form State
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    mobile: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Core Data Lists
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(true);

  // Address Modal / Add New State
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    name: '',
    mobile: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    type: 'Home',
    is_default: false
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        mobile: user.mobile || '',
      });
      fetchWishlist();
      fetchOrdersData();
      fetchAddressesData();
    }
  }, [user]);

  const fetchOrdersData = async () => {
    try {
      setOrdersLoading(true);
      const res = await api.get('/orders');
      const orderList = res.data.orders || [];

      // If backend /orders didn't include items, fetch them for each order
      const ordersWithItems = await Promise.all(
        orderList.map(async (order) => {
          if (order.items && order.items.length > 0) return order;
          try {
            const detailRes = await api.get(`/orders/${order.id}`);
            const fetchedItems = (detailRes.data?.order?.items || []).map(it => ({
              ...it,
              product_name: it.name || it.product_name,
              product_image: it.image || it.product_image,
              variant_weight: it.weight || it.variant_weight,
            }));
            return { ...order, items: fetchedItems };
          } catch (err) {
            console.warn(`Could not fetch details for order #${order.id}`, err);
            return order;
          }
        })
      );

      setOrders(ordersWithItems);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchAddressesData = async () => {
    try {
      setAddressesLoading(true);
      const res = await api.get('/addresses');
      setAddresses(res.data.addresses || []);
    } catch (err) {
      console.error('Failed to load addresses', err);
    } finally {
      setAddressesLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);

    try {
      const res = await api.put('/users/update', formData);
      setUser(res.data.user);
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogoutClick = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      logout();
      showToast('Signed out successfully', 'info');
      navigate('/login');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await api.put(`/orders/${orderId}/cancel`);
        showToast('Order cancelled successfully', 'success');
        fetchOrdersData();
      } catch (err) {
        showToast('Failed to cancel order', 'error');
      }
    }
  };

  const handleAddAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/addresses', addressForm);
      showToast('Address added successfully!', 'success');
      setShowAddAddress(false);
      setAddressForm({
        name: '',
        mobile: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        type: 'Home',
        is_default: false
      });
      fetchAddressesData();
    } catch (err) {
      showToast('Failed to add address', 'error');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (window.confirm('Delete this address?')) {
      try {
        await api.delete(`/addresses/${addressId}`);
        showToast('Address deleted successfully!', 'success');
        fetchAddressesData();
      } catch (err) {
        showToast('Failed to delete address', 'error');
      }
    }
  };


  // Sidebar Menu Config
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Orders', icon: Clipboard },
    { name: 'Address', icon: MapPin },
    { name: 'Account Detail', icon: User },
    { name: 'Wishlist', icon: Heart },
    { name: 'Customer Support', icon: Headphones },
    { name: 'Delete Account', icon: Trash2 },
    { name: 'Logout', icon: LogOut, action: handleLogoutClick }
  ];

  // 3x3 Grid Dashboard Cards Config
  const dashboardCards = [
    { name: 'Orders', icon: Clipboard, desc: 'Track your aquarium shipments', tab: 'Orders' },
    { name: 'Address', icon: MapPin, desc: 'Manage your doorstep delivery pins', tab: 'Address' },
    { name: 'Account Details', icon: User, desc: 'Update name, phone, and passwords', tab: 'Account Detail' },
    { name: 'Wishlist', icon: Heart, desc: 'Manage products you loved', tab: 'Wishlist' },
    { name: 'Customer Support', icon: Headphones, desc: 'Get help from our support team', tab: 'Customer Support' },
    { name: 'Logout', icon: LogOut, desc: 'Exit safely from your session', action: handleLogoutClick }
  ];

  return (
    <div className="bg-[#f8f9fc] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Modern Account Sidebar */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-6">
            <h2 className="text-xl font-extrabold text-gray-900 border-b border-gray-100 pb-4">
              My Account
            </h2>
            
            {/* Nav Menu Lists - Responsive vertical scroll on desktop, horizontal scroll on mobile */}
            <nav className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none whitespace-nowrap">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.name;

                return (
                  <button
                    key={item.name}
                    onClick={() => item.action ? item.action() : setActiveTab(item.name)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold tracking-wide transition-all select-none border-none bg-transparent cursor-pointer
                      ${isActive 
                        ? 'bg-[#f3e8ff] text-purple-700 shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon size={18} className={isActive ? 'text-purple-700 animate-pulse' : 'text-gray-400'} />
                    {item.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* RIGHT COLUMN: Interactive Tab Content Panel */}
          <div className="lg:col-span-9 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 min-h-[500px]">
            
            {/* TABS 1: Dashboard Content */}
            {activeTab === 'Dashboard' && (
              <div className="space-y-8">
                {/* Welcome Mock Header */}
                <div>
                  <h1 className="text-xl font-bold text-gray-800">
                    Hello <span className="text-[#6d28d9]">{user?.username || 'Administrator'}</span>
                  </h1>
                  <p className="text-gray-500 text-sm mt-3 leading-relaxed font-semibold">
                    From your account dashboard you can view your <span className="text-purple-700 underline cursor-pointer font-bold" onClick={() => setActiveTab('Orders')}>recent orders</span>, manage your <span className="text-purple-700 underline cursor-pointer font-bold" onClick={() => setActiveTab('Address')}>shipping and billing addresses</span>, And <span className="text-purple-700 underline cursor-pointer font-bold" onClick={() => setActiveTab('Account Detail')}>edit your password and account details</span>.
                  </p>
                </div>

                {/* 3x3 Responsive Grid of Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {dashboardCards.map((card) => {
                    const Icon = card.icon;

                    return (
                      <div
                        key={card.name}
                        onClick={() => card.action ? card.action() : setActiveTab(card.tab)}
                        className="bg-white border border-gray-200 hover:border-purple-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                      >
                        <div className="w-14 h-14 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center mb-4">
                          <Icon size={26} />
                        </div>
                        <h4 className="font-extrabold text-gray-800 text-base">
                          {card.name}
                        </h4>
                        <p className="text-[11px] text-gray-400 mt-2 font-semibold leading-relaxed">
                          {card.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TABS 2: Orders Content */}
            {activeTab === 'Orders' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">My Orders</h3>

                {ordersLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                    <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                    <p className="text-sm font-semibold">Loading your orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-16 flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center">
                      <Clipboard size={36} className="text-purple-300" />
                    </div>
                    <div>
                      <p className="text-gray-700 font-bold text-base">No orders yet</p>
                      <p className="text-gray-400 text-xs font-semibold mt-1">Your order history will appear here once you shop.</p>
                    </div>
                    <Link to="/products" className="bg-[#6d28d9] text-white text-xs font-extrabold px-6 py-3 rounded-lg hover:bg-[#5b21b6] transition shadow-sm uppercase">
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {orders.map(order => {
                      const statusConfig = {
                        pending:    { bg: 'bg-yellow-50',  text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500' },
                        confirmed:  { bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500' },
                        processing: { bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
                        shipped:    { bg: 'bg-indigo-50',  text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
                        delivered:  { bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-500' },
                        cancelled:  { bg: 'bg-rose-50',    text: 'text-rose-700',   border: 'border-rose-200',   dot: 'bg-rose-500' },
                        returned:   { bg: 'bg-gray-100',   text: 'text-gray-600',   border: 'border-gray-200',   dot: 'bg-gray-400' },
                      };
                      const sc = statusConfig[order.status] || statusConfig.pending;
                      const items = order.items || [];
                      const canCancel = !['cancelled', 'delivered', 'returned'].includes(order.status);

                      return (
                        <div key={order.id} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">

                          {/* ── Order Header ── */}
                          <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-4">
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order ID</p>
                                <p className="text-sm font-extrabold text-gray-800">#{order.id}</p>
                              </div>
                              <div className="h-8 w-px bg-gray-200 hidden sm:block" />
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</p>
                                <p className="text-sm font-bold text-gray-700">
                                  {new Date(order.date_added).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                              </div>
                              <div className="h-8 w-px bg-gray-200 hidden sm:block" />
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment</p>
                                <p className="text-sm font-bold text-gray-700 capitalize">{order.payment_method || 'COD'}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Status Badge */}
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${sc.bg} ${sc.text} ${sc.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                {order.status}
                              </span>

                              {/* Cancel Button */}
                              {canCancel && (
                                <button
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="text-xs font-bold text-rose-500 hover:text-rose-700 border border-rose-200 hover:border-rose-400 hover:bg-rose-50 rounded-lg px-3 py-1 transition cursor-pointer bg-transparent"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>

                          {/* ── Products List ── */}
                          <div className="divide-y divide-gray-100">
                            {items.length === 0 ? (
                              <p className="text-xs text-gray-400 font-semibold italic px-5 py-4">No product details available.</p>
                            ) : (
                              items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 px-5 py-4">
                                  {/* Product Image */}
                                  <div className="w-16 h-16 flex-shrink-0 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                                    <img
                                      src={getImageUrl(item.display_image || item.product_image)}
                                      alt={item.product_name}
                                      className="w-full h-full object-contain p-1"
                                      onError={e => { e.target.src = NO_IMAGE_SVG; }}
                                    />
                                  </div>

                                  {/* Product Details */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-800 truncate">{item.product_name || 'Product'}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                      <span className="text-[10px] font-semibold text-gray-400">Qty: {item.quantity}</span>
                                    </div>
                                  </div>

                                  {/* Item Price */}
                                  <div className="text-right flex-shrink-0">
                                    <p className="text-sm font-extrabold text-purple-700">₹{Number(item.price * item.quantity).toFixed(2)}</p>
                                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">₹{Number(item.price).toFixed(2)} × {item.quantity}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* ── Order Footer / Total ── */}
                          <div className="bg-gray-50 border-t border-gray-100 px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap gap-4 text-xs text-gray-500 font-semibold">
                              {Number(order.delivery_charge) > 0 && (
                                <span>Delivery: <span className="text-gray-700 font-bold">₹{Number(order.delivery_charge).toFixed(2)}</span></span>
                              )}
                              {Number(order.promo_discount) > 0 && (
                                <span>Promo Discount: <span className="text-green-600 font-bold">-₹{Number(order.promo_discount).toFixed(2)}</span></span>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-gray-400 font-semibold">Order Total: </span>
                              <span className="text-base font-extrabold text-gray-900">₹{Number(order.final_total || order.total).toFixed(2)}</span>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}





            {/* TABS 4: Address Content */}
            {activeTab === 'Address' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="text-lg font-bold text-gray-900">Address Book</h3>
                  {!showAddAddress && (
                    <button 
                      onClick={() => setShowAddAddress(true)}
                      className="bg-[#6d28d9] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#5b21b6] transition shadow-sm uppercase cursor-pointer"
                    >
                      Add Address
                    </button>
                  )}
                </div>

                {showAddAddress ? (
                  <form onSubmit={handleAddAddressSubmit} className="space-y-4 bg-gray-50 p-5 border border-gray-200 rounded-xl">
                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2">New Shipping Address</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input 
                        type="text" 
                        placeholder="Recipient Name" 
                        required
                        value={addressForm.name}
                        onChange={e => setAddressForm({...addressForm, name: e.target.value})}
                        className="px-4 py-2.5 rounded-lg border border-gray-300 outline-none text-xs font-semibold focus:ring-1 focus:ring-purple-600 focus:border-purple-600"
                      />
                      <input 
                        type="text" 
                        placeholder="Mobile Phone" 
                        required
                        value={addressForm.mobile}
                        onChange={e => setAddressForm({...addressForm, mobile: e.target.value})}
                        className="px-4 py-2.5 rounded-lg border border-gray-300 outline-none text-xs font-semibold focus:ring-1 focus:ring-purple-600 focus:border-purple-600"
                      />
                    </div>
                    
                    <input 
                      type="text" 
                      placeholder="Street Address, Building, House No." 
                      required
                      value={addressForm.address}
                      onChange={e => setAddressForm({...addressForm, address: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 outline-none text-xs font-semibold focus:ring-1 focus:ring-purple-600 focus:border-purple-600"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <input 
                        type="text" 
                        placeholder="City" 
                        required
                        value={addressForm.city}
                        onChange={e => setAddressForm({...addressForm, city: e.target.value})}
                        className="px-4 py-2.5 rounded-lg border border-gray-300 outline-none text-xs font-semibold focus:ring-1 focus:ring-purple-600 focus:border-purple-600"
                      />
                      <input 
                        type="text" 
                        placeholder="State" 
                        required
                        value={addressForm.state}
                        onChange={e => setAddressForm({...addressForm, state: e.target.value})}
                        className="px-4 py-2.5 rounded-lg border border-gray-300 outline-none text-xs font-semibold focus:ring-1 focus:ring-purple-600 focus:border-purple-600"
                      />
                      <input 
                        type="text" 
                        placeholder="Pincode" 
                        required
                        value={addressForm.pincode}
                        onChange={e => setAddressForm({...addressForm, pincode: e.target.value})}
                        className="px-4 py-2.5 rounded-lg border border-gray-300 outline-none text-xs font-semibold focus:ring-1 focus:ring-purple-600 focus:border-purple-600"
                      />
                    </div>

                    <div className="flex gap-4">
                      <select 
                        value={addressForm.type}
                        onChange={e => setAddressForm({...addressForm, type: e.target.value})}
                        className="px-4 py-2.5 rounded-lg border border-gray-300 outline-none text-xs font-bold text-gray-700 bg-white"
                      >
                        <option value="Home">Home</option>
                        <option value="Office">Office</option>
                        <option value="Other">Other</option>
                      </select>
                      
                      <button 
                        type="submit"
                        className="bg-[#6d28d9] hover:bg-[#5b21b6] text-white text-xs font-bold px-6 py-2.5 rounded-lg transition uppercase cursor-pointer"
                      >
                        Save Address
                      </button>
                      <button 
                        type="button"
                        onClick={() => setShowAddAddress(false)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-6 py-2.5 rounded-lg transition uppercase cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : null}

                {addressesLoading ? (
                  <div className="text-center py-10 text-gray-400 font-semibold">Loading addresses...</div>
                ) : addresses.length === 0 ? (
                  <p className="text-gray-500 font-semibold text-center py-8">No shipping addresses added yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map(addr => (
                      <div key={addr.id} className="border border-gray-200 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-sm bg-white">
                        <div className="text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-gray-800 text-sm">{addr.name}</span>
                            <span className="text-[10px] font-bold tracking-wider uppercase bg-purple-50 text-purple-700 px-2 py-0.5 rounded">{addr.type}</span>
                          </div>
                          <p className="text-gray-600 mt-1 font-medium leading-relaxed">{addr.address}</p>
                          <p className="text-gray-500 mt-0.5 font-semibold">{addr.city}, {addr.state} - {addr.pincode}</p>
                          <p className="text-gray-500 mt-2 font-semibold">Phone: {addr.mobile}</p>
                        </div>
                        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                          <button 
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-xs font-bold text-red-600 hover:text-red-800 bg-transparent border-none cursor-pointer p-0"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TABS 5: Account Detail Content */}
            {activeTab === 'Account Detail' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Account Details</h3>
                
                <form onSubmit={handleProfileSubmit} className="space-y-5 max-w-xl">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200 focus-within:border-purple-600 focus-within:bg-white transition-all shadow-sm">
                      <User size={18} className="text-gray-400" />
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleProfileChange}
                        className="w-full bg-transparent outline-none text-xs font-bold text-gray-800"
                        placeholder="Administrator"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200 focus-within:border-purple-600 focus-within:bg-white transition-all shadow-sm">
                      <Mail size={18} className="text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleProfileChange}
                        className="w-full bg-transparent outline-none text-xs font-bold text-gray-800"
                        placeholder="aquamachine2426@gmail.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Mobile Phone</label>
                    <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200 focus-within:border-purple-600 focus-within:bg-white transition-all shadow-sm">
                      <Phone size={18} className="text-gray-400" />
                      <input
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleProfileChange}
                        className="w-full bg-transparent outline-none text-xs font-bold text-gray-800"
                        placeholder="9876543210"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="bg-[#6d28d9] hover:bg-[#5b21b6] text-white text-xs font-bold px-6 py-3 rounded-lg transition uppercase disabled:opacity-50 cursor-pointer"
                  >
                    {profileLoading ? 'Saving...' : 'Save Account Details'}
                  </button>
                </form>
              </div>
            )}

            {/* TABS 6: Wishlist Content */}
            {activeTab === 'Wishlist' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">My Wishlist</h3>
                
                {wishlist.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 font-bold mb-4">No items saved in wishlist.</p>
                    <Link to="/products" className="bg-[#6d28d9] text-white text-xs font-extrabold px-6 py-3 rounded-lg hover:bg-[#5b21b6] transition shadow-sm uppercase">Explore Collection</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {wishlist.map(prod => (
                      <div key={prod.id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between items-center text-center">
                        <img 
                          src={getImageUrl(prod.image)} 
                          alt={prod.name}
                          className="w-20 h-20 object-contain p-1"
                          onError={(e) => { e.target.src = NO_IMAGE_SVG; }}
                        />
                        <div className="mt-3">
                          <h4 className="text-xs font-bold text-gray-800 uppercase truncate max-w-[120px]">{prod.name}</h4>
                          <p className="text-xs font-bold text-purple-700 mt-1">₹{Number(prod.price).toFixed(2)}</p>
                        </div>
                        <div className="flex gap-2 w-full mt-4">
                          <button 
                            onClick={() => toggleWishlist(prod)}
                            className="flex-1 py-1.5 border border-red-200 text-red-600 rounded-lg text-[10px] font-bold bg-transparent hover:bg-red-50 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}


            {/* TABS 8: Customer Support Content */}
            {activeTab === 'Customer Support' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Customer Support Helpline</h3>
                
                <div className="p-6 bg-purple-50/50 border border-purple-100 rounded-xl text-center space-y-4 max-w-md mx-auto">
                  <Headphones size={48} className="text-purple-600 mx-auto" />
                  <div>
                    <p className="text-base font-bold text-purple-950">Need Help with Aquarium Ordering?</p>
                    <p className="text-xs text-purple-700 mt-1 font-semibold">Contact our support center. We are active 10 AM to 7 PM.</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-purple-200">
                    <p className="text-xs font-bold text-gray-500">Helpline Phone:</p>
                    <p className="text-sm font-extrabold text-purple-800 mt-0.5">8454064310</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-purple-200">
                    <p className="text-xs font-bold text-gray-500">Support Email:</p>
                    <p className="text-sm font-extrabold text-purple-800 mt-0.5">aquamachine2426@gmail.com</p>
                  </div>
                </div>
              </div>
            )}


            {/* TABS 9: Delete Account Content */}
            {activeTab === 'Delete Account' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 text-red-600">Delete Account</h3>
                
                <div className="p-6 bg-red-50 border border-red-100 rounded-xl space-y-4 max-w-lg">
                  <p className="text-sm font-bold text-red-950">⚠️ WARNING: permanent Account Deletion</p>
                  <p className="text-xs text-red-700 leading-relaxed font-semibold">
                    Deleting your account will permanently wipe out all order history logs, stored shipping addresses, active coupon privileges, wallet balances, and items saved inside your Aquarium Wishlist. This action is irreversible.
                  </p>
                  
                  <div className="pt-3 border-t border-red-100">
                    <button 
                      onClick={() => {
                        if (window.confirm('WARNING: Are you absolutely certain you want to permanently delete your account? This is irreversible!')) {
                          showToast('Account delete request sent to admin', 'info');
                        }
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold px-6 py-3 rounded-lg transition uppercase cursor-pointer"
                    >
                      Permanently Delete My Account
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
