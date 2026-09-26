import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useToastStore } from '../store/toastStore';
import api from '../lib/api';
import { getImageUrl, NO_IMAGE_SVG } from '../lib/imageUrl';
import { 
  CheckCircle, XCircle, Edit, Truck, Wallet, 
  HelpCircle, Ticket, Info, Loader2, Plus, QrCode, ShieldCheck,
  CreditCard
} from 'lucide-react';

const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Checkout() {
  const { isAuthenticated, user } = useAuthStore();
  const { cartItems, fetchCart, clearCart } = useCartStore();
  const { showToast } = useToastStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isBuyNow = sessionStorage.getItem('is_buy_now') === 'true';
  const buyNowItemJson = sessionStorage.getItem('buy_now_item');
  const buyNowItem = isBuyNow && buyNowItemJson ? JSON.parse(buyNowItemJson) : null;
  const checkoutItems = buyNowItem ? [buyNowItem] : cartItems;

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [paymentConfig, setPaymentConfig] = useState({
    cod: { enabled: true },
    razorpay: { enabled: false, configured: false },
    payu: { enabled: false, configured: false },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Custom Form & Interactive States
  const [specialNote, setSpecialNote] = useState('');
  const [useWallet, setUseWallet] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0.00);

  // Promo Code / Coupon state
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [showOffersList, setShowOffersList] = useState(false);
  
  const [whatsappPhone, setWhatsappPhone] = useState('918454064310');

 
  // Delivery Charges Config
  const deliveryChargeCOD = 0.00;
  const deliveryChargeNoCOD = 0.00;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      try {
        const [, addrRes, paymentRes, configRes] = await Promise.all([
          fetchCart(),
          api.get('/addresses'),
          api.get('/orders/payment-methods'),
          api.get('/config/public').catch(() => null)
        ]);

        if (configRes?.data?.contact_info?.phone) {
          let cleanPhone = configRes.data.contact_info.phone.replace(/\D/g, '');
          if (cleanPhone.length === 10) {
            cleanPhone = '91' + cleanPhone;
          }
          if (cleanPhone) {
            setWhatsappPhone(cleanPhone);
          }
        }

        // Parse search params for payment errors
        const params = new URLSearchParams(location.search);
        const errorParam = params.get('error');
        const msgParam = params.get('msg');
        const paymentSuccess = params.get('payment_success');
        const paymentOrderId = params.get('order_id');
        if (errorParam === 'payment_failed') {
          showToast(msgParam || 'Payment failed. Please try again.', 'error');
        }
        if (paymentSuccess === '1' && paymentOrderId) {
          setOrderSuccess(paymentOrderId);
        }

        const methods = paymentRes.data?.methods || {};
        const nextPaymentConfig = {
          cod: methods.cod || { enabled: true },
          razorpay: methods.razorpay || { enabled: false, configured: false, setup_hint: null },
          payu: methods.payu || { enabled: false, configured: false, setup_hint: null },
        };

        setPaymentConfig(nextPaymentConfig);
        if (!nextPaymentConfig.cod.enabled) {
          if (nextPaymentConfig.razorpay.enabled && nextPaymentConfig.razorpay.configured) {
            setPaymentMethod('razorpay');
          } else if (nextPaymentConfig.payu.enabled && nextPaymentConfig.payu.configured) {
            setPaymentMethod('payu');
          }
        }

        setAddresses(addrRes.data.addresses || []);
        if (addrRes.data.addresses?.length > 0) {
          const defaultAddr = addrRes.data.addresses.find(a => a.is_default);
          setSelectedAddressId(defaultAddr?.id || addrRes.data.addresses[0].id);
        }
        
        // Dynamic wallet balance check (fallbacks to mock or database user.wallet_balance if available)
        if (user && user.wallet_balance !== undefined) {
          setWalletBalance(parseFloat(user.wallet_balance) || 0.00);
        } else {
          setWalletBalance(0.00);
        }

        // Check for stored promo code
        const storedPromo = localStorage.getItem('applied_promo_code');
        if (storedPromo) {
          setPromoCodeInput(storedPromo);
          const calcSubtotal = isBuyNow && buyNowItem
            ? (Number(buyNowItem.price) || 0) * Number(buyNowItem.qty)
            : (useCartStore.getState().cartItems || []).reduce((sum, item) => sum + (item.price || 0) * item.qty, 0);

          if (calcSubtotal > 0) {
            try {
              const promoRes = await api.post('/promo-codes/validate', {
                promo_code: storedPromo.trim().toUpperCase(),
                amount: calcSubtotal
              });
              if (promoRes.data?.success) {
                setAppliedPromo({
                  coupon: promoRes.data.coupon,
                  discountAmount: promoRes.data.discountAmount
                });
                setPromoSuccess(promoRes.data.message || 'Coupon applied successfully!');
                showToast('Coupon Applied successfully!', 'success');
              }
            } catch (pErr) {
              console.error('Failed to validate pre-applied promo code:', pErr);
              localStorage.removeItem('applied_promo_code');
            }
          }
        }
      } catch (err) {
        setError('Failed to load checkout data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, navigate, fetchCart, user]);

  useEffect(() => {
    const fromNew = location.state?.selectedAddressId;
    if (fromNew) {
      setSelectedAddressId(fromNew);
    }
  }, [location.state]);

  useEffect(() => {
    if (orderSuccess) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      clearCart();
      localStorage.removeItem('applied_promo_code');
      const timer = window.setTimeout(() => {
        navigate('/my-orders');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [orderSuccess, clearCart, navigate]);

  // Subtotal Calculation
  const subtotal = checkoutItems.reduce((sum, item) => {
    const price = Number(item.effectivePrice ?? item.price ?? 0);
    const qty = Number(item.qty || 1);
    return sum + price * qty;
  }, 0);

  // Active delivery charge depending on Cash on Delivery status
  const activeDeliveryCharge = paymentMethod === 'cod' ? deliveryChargeCOD : deliveryChargeNoCOD;

  // Promo discount amount calculation
  const discountVal = appliedPromo ? parseFloat(appliedPromo.discountAmount) : 0;

  // Temp total before wallet
  const tempTotal = Math.max(0, subtotal + activeDeliveryCharge - discountVal);

  // Wallet deduction calculation
  const walletUsed = useWallet ? Math.min(walletBalance, tempTotal) : 0;

  // Final Grand Total
  const grandTotal = Math.max(0, tempTotal - walletUsed);

  const razorpayReady = Boolean(
    paymentConfig.razorpay?.enabled && paymentConfig.razorpay?.configured
  );

  const payuReady = Boolean(
    paymentConfig.payu?.enabled && paymentConfig.payu?.configured
  );

  // Apply Coupon action
  const handleApplyCouponDirectly = async (codeToApply) => {
    const code = codeToApply || promoCodeInput;
    if (!code || !code.trim()) {
      setPromoError('Please enter a coupon code.');
      return;
    }

    setPromoLoading(true);
    setPromoError('');
    setPromoSuccess('');

    try {
      const res = await api.post('/promo-codes/validate', {
        promo_code: code.trim().toUpperCase(),
        amount: subtotal
      });

      if (res.data?.success) {
        setAppliedPromo({
          coupon: res.data.coupon,
          discountAmount: res.data.discountAmount
        });
        setPromoSuccess(res.data.message || 'Coupon applied successfully!');
        showToast('Coupon Applied successfully!', 'success');
        localStorage.removeItem('applied_promo_code');
      } else {
        setPromoError(res.data?.message || 'Invalid coupon code');
      }
    } catch (err) {
      console.error(err);
      setPromoError(err.response?.data?.message || 'Invalid coupon code or not eligible');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleApplyCoupon = () => {
    handleApplyCouponDirectly(promoCodeInput);
  };

  const handleRemoveCoupon = () => {
    setAppliedPromo(null);
    setPromoCodeInput('');
    setPromoSuccess('');
    setPromoError('');
    localStorage.removeItem('applied_promo_code');
    showToast('Coupon removed', 'info');
  };

  const selectOfferCode = (code) => {
    setPromoCodeInput(code);
    setShowOffersList(false);
    setPromoError('');
    // Automatically apply coupon immediately
    handleApplyCouponDirectly(code);
  };

  const buildOrderPayload = () => ({
    address_id: selectedAddressId,
    items: checkoutItems.map(item => ({
      product_variant_id: item.product_variant_id,
      qty: item.qty,
      price: Number(item.effectivePrice ?? item.price ?? 0),
    })),
    total: subtotal,
    final_total: grandTotal,
    promo_code: appliedPromo ? appliedPromo.coupon.promo_code : null,
    promo_discount: discountVal,
    wallet_balance: walletUsed,
    delivery_charge: activeDeliveryCharge,
    notes: specialNote,
    payment_method: paymentMethod,
  });

  const openRazorpayCheckout = async (orderPayload) => {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error('Unable to load Razorpay checkout. Please check your internet connection.');
    }

    const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
    const orderRes = await api.post('/orders/razorpay/create-order', {
      amount: orderPayload.final_total,
      order: orderPayload,
    });

    const razorpayOrder = orderRes.data.order;

    return new Promise((resolve, reject) => {
      const razorpay = new window.Razorpay({
        key: orderRes.data.keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || 'INR',
        name: 'AQUA MACHINE',
        description: `Order payment of Rs. ${Number(orderPayload.final_total).toFixed(2)}`,
        order_id: razorpayOrder.id,
        prefill: {
          name: selectedAddress?.name || user?.username || '',
          email: user?.email || '',
          contact: selectedAddress?.mobile || user?.mobile || '',
        },
        notes: {
          address_id: String(selectedAddressId),
        },
        theme: {
          color: '#5b21b6',
        },
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/orders/razorpay/verify', {
              ...response,
              order: {
                ...orderPayload,
                payment_method: 'razorpay',
              },
            });
            resolve(verifyRes.data);
          } catch (err) {
            reject(err);
          }
        },
        modal: {
          ondismiss: async () => {
            try {
              await api.post('/orders/razorpay/log-cancelled', {
                razorpay_order_id: razorpayOrder.id,
              });
            } catch {
              // ignore logging errors on dismiss
            }
            reject(new Error('Payment cancelled'));
          },
        },
      });

      razorpay.on('payment.failed', (response) => {
        const description = response?.error?.description
          || response?.error?.reason
          || 'Payment failed. Please try again or use another method.';
        reject(new Error(description));
      });

      razorpay.open();
    });
  };

  // Place Order action
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      showToast('Please select a delivery address', 'warning');
      return;
    }

    if (checkoutItems.length === 0) {
      showToast('No items selected for order', 'warning');
      return;
    }

    if (!paymentMethod) {
      showToast('Please select a payment method', 'warning');
      return;
    }

    if (promoCodeInput.trim() && !appliedPromo) {
      showToast('Please apply your coupon code by clicking "Apply Coupon" first, or clear the input to place order without a discount.', 'warning');
      return;
    }

    if (paymentMethod === 'razorpay' && (!paymentConfig.razorpay.enabled || !paymentConfig.razorpay.configured)) {
      showToast('Razorpay is not ready. Please configure it in Admin > Payment Gateways.', 'warning');
      return;
    }

    if (paymentMethod === 'payu' && (!paymentConfig.payu.enabled || !paymentConfig.payu.configured)) {
      showToast('PayU is not ready. Please configure it in Admin > Payment Gateways.', 'warning');
      return;
    }

    try {
      setPlacingOrder(true);
      const payload = buildOrderPayload();

      let res;
      if (grandTotal === 0) {
        res = (await api.post('/orders', { ...payload, payment_method: 'cod' })).data;
      } else if (paymentMethod === 'razorpay') {
        res = await openRazorpayCheckout({ ...payload, payment_method: 'razorpay' });
      } else if (paymentMethod === 'payu') {
        const origin = window.location.origin.startsWith('http://localhost') || window.location.origin.startsWith('http://127.0.0.1')
          ? window.location.origin
          : window.location.origin.replace(/^http:/, 'https:');

        const initRes = await api.post('/orders/payu/hash', {
          amount: payload.final_total,
          order: payload,
          frontend_url: origin + window.location.pathname,
        });

        if (initRes.data.success) {
          const { actionUrl, params } = initRes.data;
          const form = document.createElement('form');
          form.setAttribute('method', 'POST');
          form.setAttribute('action', actionUrl);

          for (const [key, value] of Object.entries(params)) {
            const input = document.createElement('input');
            input.setAttribute('type', 'hidden');
            input.setAttribute('name', key);
            input.setAttribute('value', value);
            form.appendChild(input);
          }

          document.body.appendChild(form);
          form.submit();
          return;
        } else {
          throw new Error('Failed to initiate PayU payment');
        }
      } else {
        res = (await api.post('/orders', { ...payload, payment_method: 'cod' })).data;
      }

      setOrderSuccess(res.orderId);
      localStorage.removeItem('applied_promo_code');
      if (isBuyNow) {
        sessionStorage.removeItem('is_buy_now');
        sessionStorage.removeItem('buy_now_item');
      } else {
        clearCart();
      }
      window.setTimeout(() => navigate('/my-orders'), 2200);
    } catch (err) {
      const message = err.message === 'Payment cancelled'
        ? 'Payment cancelled'
        : err.response?.data?.message || err.message || 'Failed to place order';
      showToast(message, err.message === 'Payment cancelled' ? 'info' : 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (orderSuccess) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 text-center shadow-xl">
        <CheckCircle className="mx-auto mb-5 text-green-600" size={64} />
        <h1 className="text-3xl font-bold text-gray-900">Thank you for your order!</h1>
        <p className="mt-3 text-gray-600">Your order #{orderSuccess} has been placed successfully.</p>
        <p className="mt-2 text-sm text-gray-400">Taking you to your orders...</p>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
      <p className="text-gray-500 font-semibold">Preparing Checkout...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="text-center bg-white p-8 rounded-2xl shadow-md border border-gray-100 max-w-md w-full">
        <XCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Checkout Error</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <button onClick={() => navigate('/cart')} className="bg-purple-700 text-white font-bold px-6 py-3 rounded-lg hover:bg-purple-800 transition border-none cursor-pointer">
          Return to Cart
        </button>
      </div>
    </div>
  );

  const getWhatsAppMessage = () => {
    let msg = `Hi! I am interested in placing an order for:\n\n`;
    
    checkoutItems.forEach((item, index) => {
      msg += `*${index + 1}. ${item.name}*\n`;
      msg += `   Qty: ${item.qty}\n`;
      msg += `   Price: ₹${Number(item.effectivePrice ?? item.price ?? 0).toFixed(2)}\n\n`;
    });

    msg += `*Order Summary:*\n`;
    msg += `- Subtotal: ₹${Number(subtotal).toFixed(2)}\n`;
    if (discountVal > 0) {
      msg += `- Coupon Discount: -₹${Number(discountVal).toFixed(2)}\n`;
    }
    if (walletUsed > 0) {
      msg += `- Wallet Used: -₹${Number(walletUsed).toFixed(2)}\n`;
    }
    msg += `*Grand Total: ₹${Number(grandTotal).toFixed(2)}*\n`;
    msg += `_Note: Shipping charges will be confirmed separately after order placement_\n\n`;

    const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
    if (selectedAddress) {
      msg += `*Delivery Address:*\n`;
      msg += `${selectedAddress.name}\n`;
      msg += `${selectedAddress.address}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}\n`;
      msg += `Phone: ${selectedAddress.mobile}\n\n`;
    }

    msg += `*Special Note:* ${specialNote || 'None'}\n\n`;
    msg += `Please confirm my order details!`;
    return msg;
  };

  return (
    <div className="bg-[#f8f9fc] min-h-screen pb-16 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Checkout Progress Banner */}
        <div className="bg-[#5b21b6] text-white py-6 px-4 md:px-8 rounded-2xl mb-8 flex items-center justify-center shadow-md select-none">
          <div className="flex items-center gap-3 sm:gap-6 md:gap-10 font-bold uppercase tracking-widest text-[10px] sm:text-xs md:text-sm">
            <span className="text-purple-200">Shopping Cart</span>
            <span className="text-purple-300">→</span>
            <span className="underline decoration-2 underline-offset-[10px] text-white font-extrabold">Checkout</span>
            <span className="text-purple-300">→</span>
            <span className="text-purple-200">ORDER COMPLETE</span>
          </div>
        </div>

        {/* Two-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Billing, Address, Wallet, Payment Details */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Billing Details Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-6">
              <h2 className="text-lg font-bold text-gray-900">Billing Details</h2>
              
              {/* Door Step Delivery Header */}
              <div className="w-full bg-[#6d28d9] text-white py-3 rounded-lg text-center font-bold text-sm tracking-wider uppercase shadow-sm">
                Door Step Delivery
              </div>

              {/* Shipping Notice Banner */}
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-xl text-xs flex items-center gap-2.5 font-semibold">
                <Truck size={18} className="text-amber-600 flex-shrink-0" />
                <span>Shipping charges will be confirmed separately after order placement</span>
              </div>

              {/* Shipping Address Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Shipping Address</h3>
                  <button 
                    onClick={() => navigate('/addresses', { state: { returnTo: '/checkout' } })}
                    className="p-1.5 text-purple-700 hover:bg-purple-50 rounded-lg transition"
                    title="Manage Addresses"
                  >
                    <Edit size={16} />
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="p-6 bg-amber-50 border border-amber-100 rounded-xl text-center">
                    <p className="text-sm font-medium text-amber-700 mb-3">No addresses found in your account.</p>
                    <button
                      onClick={() => navigate('/addresses', { state: { returnTo: '/checkout' } })}
                      className="inline-flex items-center gap-1 bg-[#6d28d9] hover:bg-[#5b21b6] text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition"
                    >
                      <Plus size={14} /> Add New Address
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`p-4 border rounded-xl cursor-pointer transition flex items-start gap-3 ${
                          selectedAddressId === addr.id
                            ? 'border-purple-600 bg-purple-50/50'
                            : 'border-gray-200 hover:border-purple-300 bg-white'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="addressRadio" 
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-1 accent-[#6d28d9]"
                        />
                        <div className="text-sm">
                          <p className="font-extrabold text-gray-900">{addr.name} <span className="ml-1 text-[10px] font-bold tracking-wider uppercase bg-gray-100 px-2 py-0.5 rounded text-gray-500">{addr.type}</span></p>
                          <p className="text-gray-600 mt-1 text-xs leading-relaxed">{addr.address}</p>
                          <p className="text-gray-500 text-xs mt-0.5">
                            {addr.city}, {addr.state} - <span className="font-semibold">{addr.pincode}</span>
                          </p>
                          <p className="text-gray-500 text-xs mt-1 font-medium">Phone: {addr.mobile}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {!selectedAddressId && addresses.length > 0 && (
                  <p className="text-xs font-bold text-red-500 mt-1 animate-pulse">
                    Please select address.
                  </p>
                )}
              </div>

              {/* Special Note Input */}
              <div className="space-y-2">
                <input 
                  type="text" 
                  placeholder="Special Note for Order"
                  value={specialNote}
                  onChange={e => setSpecialNote(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none text-sm font-semibold transition bg-white shadow-sm"
                />
              </div>
            </div>

            {/* Wallet Balance Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Wallet Balance</h2>
              <div className="flex items-center gap-3 p-3 bg-purple-50/50 border border-purple-100 rounded-xl">
                <input 
                  type="checkbox"
                  id="walletCheckbox"
                  checked={useWallet}
                  disabled={walletBalance <= 0}
                  onChange={e => setUseWallet(e.target.checked)}
                  className="w-4 h-4 accent-[#6d28d9] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label htmlFor="walletCheckbox" className="text-sm font-bold text-gray-700 cursor-pointer flex items-center gap-1.5 select-none">
                  <Wallet size={16} className="text-purple-600" />
                  Available balance : <span className="text-purple-700">₹{walletBalance.toFixed(2)}</span>
                </label>
              </div>
            </div>

            {/* Select Payment Method Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Select Payment Method</h2>
              
              <div className="grid grid-cols-1 gap-3">
                {/* Cash on Delivery option */}
                {paymentConfig.cod?.enabled && (
                  <label className={`p-4 border rounded-xl transition flex items-center justify-between cursor-pointer ${
                    paymentMethod === 'cod'
                      ? 'border-purple-600 bg-purple-50/50'
                      : 'border-gray-200 hover:border-purple-300 bg-white'
                  }`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="paymentRadio"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="accent-[#6d28d9]"
                      />
                      <span className="text-sm font-bold text-gray-800">
                        Cash on Delivery
                      </span>
                    </div>
                    
                    {/* COD Logo Representing mockup */}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-[#6d28d9] rounded-md font-extrabold text-[10px] uppercase tracking-wider">
                      <Truck size={12} /> COD
                    </span>
                  </label>
                )}

                {/* Online Payment option */}
                {paymentConfig.razorpay?.enabled && (
                  <label className={`p-4 border rounded-xl transition flex items-center justify-between ${
                    paymentMethod === 'razorpay'
                      ? 'border-purple-600 bg-purple-50/50'
                      : 'border-gray-200 hover:border-purple-300 bg-white'
                  } ${razorpayReady ? 'cursor-pointer' : 'opacity-60 cursor-pointer'}`}
                    onClick={() => {
                      if (razorpayReady) {
                        setPaymentMethod('razorpay');
                      } else {
                        showToast(
                          paymentConfig.razorpay?.setup_hint || 'Admin > Payment Gateways: enable Razorpay, add Key ID + Secret, then Save.',
                          'warning'
                        );
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="paymentRadio"
                        value="razorpay"
                        checked={paymentMethod === 'razorpay'}
                        readOnly
                        className="accent-[#6d28d9] pointer-events-none"
                      />
                      <span className="text-sm font-bold text-gray-800">
                        Razorpay UPI QR
                        {!razorpayReady && (
                          <span className="block text-[10px] text-red-500 font-semibold mt-0.5">{paymentConfig.razorpay?.setup_hint || 'Set up in Admin > Payment Gateways'}</span>
                        )}
                      </span>
                    </div>
                     
                    <div className="flex items-center gap-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 border rounded text-[9px] font-bold text-gray-500">
                        <QrCode size={11} /> QR
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 border rounded text-[9px] font-bold text-gray-500">INR</span>
                    </div>
                  </label>
                )}

                {/* PayU Payment option */}
                {paymentConfig.payu?.enabled && (
                  <label className={`p-4 border rounded-xl transition flex items-center justify-between ${
                    paymentMethod === 'payu'
                      ? 'border-purple-600 bg-purple-50/50'
                      : 'border-gray-200 hover:border-purple-300 bg-white'
                  } ${payuReady ? 'cursor-pointer' : 'opacity-60 cursor-pointer'}`}
                    onClick={() => {
                      if (payuReady) {
                        setPaymentMethod('payu');
                      } else {
                        showToast(
                          paymentConfig.payu?.setup_hint || 'Admin > Payment Gateways: enable PayU, add Merchant Key + Salt, then Save.',
                          'warning'
                        );
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="paymentRadio"
                        value="payu"
                        checked={paymentMethod === 'payu'}
                        readOnly
                        className="accent-[#6d28d9] pointer-events-none"
                      />
                      <span className="text-sm font-bold text-gray-800">
                        PayU Checkout
                        {!payuReady && (
                          <span className="block text-[10px] text-red-500 font-semibold mt-0.5">{paymentConfig.payu?.setup_hint || 'Set up in Admin > Payment Gateways'}</span>
                        )}
                      </span>
                    </div>
                     
                    <div className="flex items-center gap-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 border rounded text-[9px] font-bold text-gray-500">
                        <CreditCard size={11} /> PayU
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 border rounded text-[9px] font-bold text-gray-500">INR</span>
                    </div>
                  </label>
                )}

                {/* No payment methods warning */}
                {!paymentConfig.cod?.enabled && !paymentConfig.razorpay?.enabled && !paymentConfig.payu?.enabled && (
                  <div className="p-4 border border-red-200 bg-red-50 rounded-xl text-center">
                    <p className="text-sm font-bold text-red-700">No payment methods are currently available.</p>
                    <p className="text-[11px] text-red-500 font-semibold mt-1">Please contact store support to complete your order.</p>
                  </div>
                )}
              </div>

                {paymentMethod === 'razorpay' && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-800 flex gap-2">
                    <ShieldCheck size={16} className="shrink-0" />
                    <span>
                      Razorpay will open for Rs. {grandTotal.toFixed(2)} (exact total). In the payment window, select UPI and use Scan QR or UPI ID.
                    </span>
                  </div>
                )}

                {paymentMethod === 'payu' && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-800 flex gap-2">
                    <ShieldCheck size={16} className="shrink-0" />
                    <span>
                      You will be redirected to PayU secure checkout page to pay Rs. {grandTotal.toFixed(2)}.
                    </span>
                  </div>
                )}
              </div>
            </div>

          {/* RIGHT: Order Summary, Items, Coupon Codes */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* My Orders / Summary Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-5 sm:p-6 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -mr-12 -mt-12 blur-2xl pointer-events-none" />
              
              <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">My Orders</h2>

              {/* Items list */}
              <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto pr-1">
                {checkoutItems.map((item, idx) => (
                  <div key={item.id || item.product_variant_id || idx} className="py-4 first:pt-0 last:pb-0 flex items-start gap-3">
                    <img 
                      src={getImageUrl(item.image)} 
                      alt={item.name} 
                      className="w-14 h-14 object-contain rounded-lg border border-gray-200 p-1 flex-shrink-0"
                      onError={(e) => { e.target.src = NO_IMAGE_SVG; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 uppercase truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Qty : <span className="font-semibold text-gray-700">{item.qty}</span>
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Tax Amount (₹) : 0
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-purple-700">
                        ₹{Number(item.price * item.qty).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cost Calculations */}
              <div className="border-t border-gray-100 pt-4 space-y-3 text-sm">
                <div className="flex justify-between items-center text-gray-500 font-medium">
                  <span>Subtotal</span>
                  <span className="font-bold text-purple-800">₹{subtotal.toFixed(2)}</span>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2.5">
                  <Truck size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Shipping Notice:</span>
                    <p className="mt-0.5 text-amber-700">Shipping charges will be confirmed separately after order placement.</p>
                  </div>
                </div>

                {discountVal > 0 && (
                  <div className="flex justify-between items-center text-green-600 font-semibold text-xs bg-green-50 px-2 py-1.5 rounded-lg border border-green-100">
                    <span>Coupon Discount</span>
                    <span>-₹{discountVal.toFixed(2)}</span>
                  </div>
                )}

                {walletUsed > 0 && (
                  <div className="flex justify-between items-center text-purple-600 font-semibold text-xs bg-purple-50/50 px-2 py-1.5 rounded-lg border border-purple-100">
                    <span>Wallet Balance Used</span>
                    <span>-₹{walletUsed.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline">
                  <div>
                    <span className="text-base font-extrabold text-gray-900">Total</span>
                    <p className="text-[10px] text-amber-600 font-semibold italic mt-0.5">
                      * Shipping charges will be confirmed separately after order placement
                    </p>
                  </div>
                  <span className="text-xl font-black text-[#5b21b6]">
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Coupon Form inside Checkout */}
              <div className="border-t border-gray-100 pt-4 space-y-2">
                {!appliedPromo ? (
                  <div className="flex rounded-lg overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-purple-600 focus-within:border-purple-600 bg-white shadow-sm">
                    <input 
                      type="text" 
                      placeholder="Coupon Code"
                      value={promoCodeInput}
                      onChange={e => {
                        setPromoCodeInput(e.target.value);
                        if (promoError) setPromoError('');
                      }}
                      className="flex-1 px-3 py-2 text-xs outline-none text-gray-700 font-semibold uppercase placeholder-gray-400"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                    />
                    <button 
                      onClick={handleApplyCoupon}
                      disabled={promoLoading}
                      className="bg-purple-700 hover:bg-purple-800 disabled:bg-purple-400 text-white text-[11px] font-bold px-4 py-2 transition flex-shrink-0 flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed uppercase"
                    >
                      {promoLoading && <Loader2 size={10} className="animate-spin" />}
                      Apply Coupon
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-black">
                        %
                      </span>
                      <div className="text-[11px]">
                        <p className="font-extrabold text-purple-900 tracking-wider">
                          {appliedPromo.coupon.promo_code} APPLIED
                        </p>
                        <p className="font-semibold text-purple-700">
                          Saved ₹{Number(appliedPromo.discountAmount).toFixed(2)} on this order!
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={handleRemoveCoupon}
                      className="p-1 text-purple-400 hover:text-purple-600 transition cursor-pointer"
                      title="Remove Coupon"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                )}

                {promoError && (
                  <p className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                    <span>❌</span> {promoError}
                  </p>
                )}
                {promoSuccess && !appliedPromo && (
                  <p className="text-[11px] font-bold text-green-600 mt-1 flex items-center gap-1">
                    <span>✅</span> {promoSuccess}
                  </p>
                )}
                
                {/* See All Offers Section */}
                <div className="relative pt-1">
                  <button 
                    onClick={() => setShowOffersList(!showOffersList)}
                    className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1 bg-transparent border-none cursor-pointer p-0"
                  >
                    <Ticket size={13} /> See All Offers(%)
                  </button>

                  {showOffersList && (
                    <div className="absolute left-0 bottom-full mb-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl p-3 space-y-2.5 z-30 animate-slide-up">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                        <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Spices Coupons</span>
                        <button onClick={() => setShowOffersList(false)} className="text-[10px] text-gray-400 font-extrabold hover:text-gray-600">Close</button>
                      </div>
                      <div className="space-y-2 max-h-[150px] overflow-y-auto">
                        {availableOffers.map(offer => (
                          <div 
                            key={offer.code}
                            onClick={() => selectOfferCode(offer.code)}
                            className="p-2 border border-dashed border-purple-300 rounded-lg hover:bg-purple-50/55 transition cursor-pointer flex items-center justify-between"
                          >
                            <div>
                              <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider bg-purple-100 px-2 py-0.5 rounded">{offer.code}</span>
                              <p className="text-[10px] text-gray-500 mt-1 font-semibold">{offer.description}</p>
                            </div>
                            <span className="text-[10px] font-bold text-purple-700">Apply</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Place Order CTA Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder || addresses.length === 0 || checkoutItems.length === 0 || !selectedAddressId}
                className="w-full bg-[#5b21b6] text-white py-4 rounded-xl font-bold text-sm tracking-wider hover:bg-purple-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-200 uppercase cursor-pointer flex items-center justify-center gap-2"
              >
                {placingOrder && <Loader2 size={16} className="animate-spin" />}
                {placingOrder ? 'Processing Payment...' : 'Place Order'}
              </button>

              {/* WhatsApp checkout request button */}
              <a
                href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(getWhatsAppMessage())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 w-full bg-[#25D366] hover:bg-[#1fae53] text-white py-4 rounded-xl font-bold text-sm tracking-wider flex items-center justify-center gap-2 shadow-md uppercase no-underline transition-all cursor-pointer border-none"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.473 1.452 5.38 1.453 5.485 0 9.948-4.463 9.952-9.953.002-2.661-1.03-5.163-2.906-7.039C17.2 1.74 14.7.708 12.036.708c-5.461 0-9.92 4.45-9.927 9.947-.001 1.916.504 3.79 1.464 5.394l-.963 3.517 3.606-.946zm11.52-7.112c-.27-.135-1.597-.788-1.848-.879-.25-.09-.433-.135-.615.135-.18.27-.7.879-.857 1.057-.158.18-.316.2-.586.065-.27-.135-1.14-.42-2.17-1.337-.8-.713-1.34-1.594-1.497-1.864-.158-.27-.017-.417.118-.552.121-.12.27-.315.405-.473.135-.158.18-.27.27-.45.09-.18.045-.338-.022-.473-.068-.135-.615-1.482-.843-2.029-.222-.534-.444-.46-.615-.468-.158-.007-.338-.007-.518-.007-.18 0-.473.068-.72.338-.248.27-.946.924-.946 2.251s.965 2.613 1.1 2.793c.135.18 1.899 2.9 4.6 4.067.643.277 1.143.444 1.533.567.646.205 1.234.176 1.7.106.52-.078 1.597-.652 1.822-1.282.225-.63.225-1.17.158-1.282-.068-.112-.25-.202-.52-.337z"/>
                </svg>
                Order Via WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
