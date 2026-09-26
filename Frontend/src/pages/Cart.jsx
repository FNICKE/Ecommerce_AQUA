import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useToastStore } from '../store/toastStore';
import CartItem from '../components/CartItem';
import Loader from '../components/Loader';
import { ShoppingBag, ArrowLeft, ArrowRight, Lock, Truck, ShieldCheck } from 'lucide-react';

export default function Cart() {
  const { isAuthenticated } = useAuthStore();
  const { cartItems, loading, fetchCart, updateCartItem, removeFromCart } = useCartStore();
  const { showToast } = useToastStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleQtyChange = async (itemId, newQty) => {
    if (newQty < 1) return;
    try {
      await updateCartItem(itemId, newQty);
    } catch {
      showToast('Failed to update quantity', 'error');
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await removeFromCart(itemId);
      showToast('Item removed from cart', 'success');
    } catch {
      showToast('Failed to remove item', 'error');
    }
  };

  // Use effectivePrice (discounted) — set by cartStore normalization
  const subtotal = cartItems.reduce((sum, item) => {
    const price = Number(item.effectivePrice ?? item.price ?? 0);
    const qty   = Number(item.qty || 1);
    return sum + price * qty;
  }, 0);

  // MRP subtotal to show total savings
  const mrpSubtotal = cartItems.reduce((sum, item) => {
    return sum + Number(item.price || 0) * Number(item.qty || 1);
  }, 0);

  const totalSavings = mrpSubtotal - subtotal;

  const formattedSubtotal = subtotal.toLocaleString('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 2,
  });



  // --- STATE: LOADING ---
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#fcfcfd]">
        <Loader size="large" />
        <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Bag...</p>
      </div>
    );
  }

  // --- STATE: EMPTY CART ---
  if (cartItems.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#fcfcfd] px-4">
        <div className="text-center">
          <div className="relative inline-block mb-8">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag className="text-slate-300" size={40} />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
               <span className="text-slate-900 font-bold text-xs">0</span>
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Your cart is empty</h2>
          <p className="text-slate-500 text-lg mb-10 max-w-sm mx-auto">
            Looks like you haven't added anything to your bag yet.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition shadow-xl shadow-indigo-100"
          >
            Explore Collection <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    );
  }

  // --- STATE: NORMAL CART ---
  return (
    <div className="bg-[#fcfcfd] min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-6 pt-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <nav className="flex items-center text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400 mb-4">
                <Link to="/products" className="hover:text-indigo-600 transition-colors">Shop</Link>
                <span className="mx-3">/</span>
                <span className="text-slate-900">Cart</span>
            </nav>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Shopping Bag</h1>
          </div>
          <p className="text-slate-500 font-medium">
            Items in your bag are not reserved — check out now to make them yours.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Items List */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Bag Items ({cartItems.length})</h3>
                <Link to="/products" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 uppercase tracking-wider">
                   <ArrowLeft size={14} /> Continue Shopping
                </Link>
              </div>
              <div className="divide-y divide-slate-100 px-4 md:px-8">
                {cartItems.map((item) => (
                  <div key={item.id} className="py-8">
                    <CartItem
                        item={item}
                        onQtyChange={handleQtyChange}
                        onRemove={handleRemove}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Info Badges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <Truck size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Shipping</p>
                        <p className="text-sm font-bold text-slate-700">Fast Delivery</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Warranty</p>
                        <p className="text-sm font-bold text-slate-700">Secure Purchase</p>
                    </div>
                </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-4 sticky top-24">
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-10 border border-slate-100 relative overflow-hidden">
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 blur-3xl" />

              <h2 className="text-2xl font-black mb-8 text-slate-900 relative">Order Summary</h2>

              <div className="space-y-5 relative">
                <div className="flex justify-between items-center text-slate-500">
                  <span className="font-medium">Subtotal ({cartItems.length} items)</span>
                  <span className="font-bold text-slate-900">{formattedSubtotal}</span>
                </div>

                {totalSavings > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-600">You Save 🎉</span>
                    <span className="font-bold text-green-600">
                      -₹{totalSavings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-slate-500">
                  <span className="font-medium">Shipping Fee</span>
                  <span className="text-emerald-600 font-bold text-sm uppercase tracking-wider">Calculated next</span>
                </div>

                <div className="flex justify-between items-center text-slate-500">
                  <span className="font-medium">Estimated Tax</span>
                  <span className="font-bold text-slate-900">₹0.00</span>
                </div>

                <div className="h-[1px] bg-slate-100 my-6" />

                <div className="flex justify-between items-end mb-10">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1">Total Amount</p>
                    <p className="text-4xl font-black text-slate-900 tracking-tighter">
                       {formattedSubtotal}
                    </p>
                  </div>
                </div>

                {isAuthenticated ? (
                  <Link
                    to="/checkout"
                    onClick={() => {
                      sessionStorage.removeItem('is_buy_now');
                      sessionStorage.removeItem('buy_now_item');
                    }}
                    className="group relative flex items-center justify-center w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-lg hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
                  >
                    Proceed to Checkout
                    <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      sessionStorage.removeItem('is_buy_now');
                      sessionStorage.removeItem('buy_now_item');
                      navigate('/login?redirect=checkout');
                    }}
                    className="group relative flex items-center justify-center w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-lg hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 border-none cursor-pointer"
                  >
                    Proceed to Checkout
                    <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}

                <div className="mt-8 pt-6 border-t border-slate-50">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                        <ShieldCheck size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">SSL Secure Payment</span>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}