import { useEffect, useState, useCallback } from 'react';
import api from '../lib/api';
import { useToastStore } from '../store/toastStore';
import { Package, Loader2, Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToastStore();

  // Flip card tracking states
  const [flippedCardId, setFlippedCardId] = useState(null);
  const [orderDetails, setOrderDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders');
        setOrders(res.data.orders || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleFlip = useCallback(async (orderId) => {
    if (flippedCardId === orderId) {
      setFlippedCardId(null);
      return;
    }

    setFlippedCardId(orderId);

    if (!orderDetails[orderId]) {
      setLoadingDetails(prev => ({ ...prev, [orderId]: true }));
      try {
        const res = await api.get(`/orders/${orderId}`);
        if (res.data?.success) {
          setOrderDetails(prev => ({ ...prev, [orderId]: res.data.order }));
        }
      } catch (err) {
        console.error('Failed to load order details:', err);
        showToast('Failed to load order details', 'error');
      } finally {
        setLoadingDetails(prev => ({ ...prev, [orderId]: false }));
      }
    }
  }, [flippedCardId, orderDetails, showToast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={32} />
          <p className="text-slate-500 text-sm font-medium">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package size={30} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">No Orders Yet</h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Looks like you haven't placed any orders yet. Start shopping and fill your kitchen with healthy organic goodies!
          </p>
          <a
            href="/products"
            className="inline-flex items-center justify-center w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3.5 px-6 rounded-xl hover:shadow-lg hover:shadow-indigo-100 transition duration-300 hover:scale-[1.02]"
          >
            Browse Products
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-16 bg-slate-50 min-h-screen">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">My Orders</h1>
          <p className="text-slate-500 text-sm mt-1">Manage, view details, and track your recent transactions.</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 text-indigo-700 text-xs font-bold uppercase tracking-wider w-fit shrink-0">
          {orders.length} Total Orders
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {orders.map((order) => {
          const isFlipped = flippedCardId === order.id;
          const details = orderDetails[order.id];
          const isLoading = loadingDetails[order.id];
          
          // Style based on status
          const status = order.status?.toLowerCase() || 'pending';
          let statusColor = 'from-amber-400 to-amber-500 shadow-amber-100';
          let statusText = 'text-amber-700 bg-amber-50 border-amber-100';
          let glowDot = 'bg-amber-500';
          
          if (status === 'delivered') {
            statusColor = 'from-emerald-400 to-emerald-500 shadow-emerald-100';
            statusText = 'text-emerald-700 bg-emerald-50 border-emerald-100';
            glowDot = 'bg-emerald-500';
          } else if (status === 'cancelled') {
            statusColor = 'from-rose-400 to-rose-500 shadow-rose-100';
            statusText = 'text-rose-700 bg-rose-50 border-rose-100';
            glowDot = 'bg-rose-500';
          }

          return (
            <div 
              key={order.id} 
              className="flip-card perspective-1000 w-full h-[360px]"
            >
              <div className={`flip-card-inner relative w-full h-full duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                
                {/* ── CARD FRONT ── */}
                <div className="flip-card-front absolute w-full h-full backface-hidden rounded-2xl bg-white border border-slate-100 shadow-md shadow-slate-100/30 flex flex-col overflow-hidden">
                  
                  {/* Glowing header strip based on status */}
                  <div className={`h-2 bg-gradient-to-r ${statusColor}`} />
                  
                  {/* Front Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Order ID</span>
                        <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">#{order.id}</h3>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusText}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${glowDot} animate-pulse`} />
                        {order.status || 'PENDING'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 font-semibold mb-6">
                      Placed: <span className="text-slate-600 font-bold">{new Date(order.date_added).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>

                    {/* Pricing Display */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-500 font-semibold">Payment Mode:</span>
                        <span className="text-xs text-slate-700 font-bold uppercase tracking-wider">{order.payment_method || 'COD'}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-200/50 pt-2.5 mt-2">
                        <span className="text-xs text-slate-500 font-bold">Total Paid:</span>
                        <span className="text-base font-black text-indigo-600">
                          ₹{Number(order.final_total || order.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <button
                      onClick={() => handleFlip(order.id)}
                      className="mt-auto w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition duration-200 flex items-center justify-center gap-2"
                    >
                      <Package size={14} /> View Items & Details
                    </button>
                  </div>
                </div>

                {/* ── CARD BACK ── */}
                <div className="flip-card-back absolute w-full h-full backface-hidden rounded-2xl bg-white border border-slate-100 shadow-lg flex flex-col overflow-hidden rotate-y-180">
                  
                  {/* Back Header */}
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Ordered Items</span>
                    <button 
                      onClick={() => handleFlip(order.id)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-extrabold uppercase tracking-wider cursor-pointer"
                    >
                      Summary
                    </button>
                  </div>

                  {/* Back Content Area (Scrollable) */}
                  <div className="flex-1 overflow-y-auto p-6 custom-scroll">
                    {isLoading ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <Loader2 className="animate-spin text-indigo-500" size={24} />
                        <span className="text-xs text-slate-400 font-medium">Loading items...</span>
                      </div>
                    ) : details?.items ? (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          {details.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                              <div className="min-w-0 flex-1 pr-3">
                                <p className="text-xs font-bold text-slate-800 leading-tight truncate">{item.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold mt-1">Qty: {item.quantity} · Price: ₹{Number(item.price).toFixed(2)}</p>
                              </div>
                              <span className="text-xs font-extrabold text-slate-700">₹{(item.quantity * item.price).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Calculations Breakdown */}
                        <div className="border-t border-slate-150/70 pt-3.5 mt-3.5 space-y-1.5 text-[11px] text-slate-500 font-medium">
                          {order.promo_discount > 0 && (
                            <div className="flex justify-between">
                              <span>Promo Discount:</span>
                              <span className="text-red-500 font-bold">-₹{Number(order.promo_discount).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Delivery Charge:</span>
                            <span>{order.delivery_charge > 0 ? `₹${Number(order.delivery_charge).toFixed(2)}` : 'FREE'}</span>
                          </div>
                          <div className="flex justify-between font-bold text-slate-800 pt-2 border-t border-slate-100">
                            <span>Final Paid:</span>
                            <span>₹{Number(order.final_total || order.total).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-xs text-slate-400 font-bold py-10">Failed to load details</div>
                    )}
                  </div>

                  {/* Back Actions */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                    <button
                      onClick={() => handleFlip(order.id)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-4 py-2.5 rounded-lg transition duration-200 cursor-pointer"
                    >
                      Back
                    </button>
                    {order.status !== 'cancelled' && order.status !== 'delivered' && (
                      <button
                        onClick={async () => {
                          if (window.confirm('Cancel this order?')) {
                            try {
                              await api.put(`/orders/${order.id}/cancel`);
                              showToast('Order cancelled successfully', 'success');
                              setTimeout(() => {
                                window.location.reload();
                              }, 1000);
                            } catch (err) {
                              showToast('Failed to cancel order', 'error');
                            }
                          }
                        }}
                        className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 border border-red-100 hover:bg-red-100 px-4 py-2.5 rounded-lg transition duration-200 cursor-pointer"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Styled Embed for Flip Animation and scrollbar styles */}
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        /* Custom scrollbar for items list */
        .custom-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 4px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
