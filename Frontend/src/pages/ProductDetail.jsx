import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useWishlistStore } from '../store/wishlistStore';
import Loader from '../components/Loader';
import { useToastStore } from '../store/toastStore';
import { 
  Plus, Minus, ShoppingBag, ArrowLeft, Heart, 
  ShieldAlert, Truck, Ban, RefreshCw, PackageX, 
  XCircle, CheckCircle, Facebook, Twitter, Linkedin, Loader2,
  ChevronDown, Share2, Copy
} from 'lucide-react';
import { getImageUrl, NO_IMAGE_SVG } from '../lib/imageUrl';
import { formatWeightLabel } from '../lib/weightFormat';
import SEO from '../components/SEO';

export default function ProductDetail() {
  const { id } = useParams();
  const { showToast } = useToastStore();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [isDescOpen, setIsDescOpen] = useState(false);
  const [activeMobileIdx, setActiveMobileIdx] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('918454064310');

  useEffect(() => {
    api.get('/config/public')
      .then(res => {
        if (res.data?.contact_info?.phone) {
          let cleanPhone = res.data.contact_info.phone.replace(/\D/g, '');
          if (cleanPhone.length === 10) {
            cleanPhone = '91' + cleanPhone;
          }
          if (cleanPhone) {
            setWhatsappPhone(cleanPhone);
          }
        }
      })
      .catch(() => null);
  }, []);

  const shareUrl = window.location.href;
  const shareTitle = product?.name || 'Check out this product!';
  const shareText = product?.short_description || `Premium ${product?.name} from AQUA MACHINE`;

  const handleShareClick = () => {
    setShowShareMenu(!showShareMenu);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        showToast('Shared successfully!', 'success');
        setShowShareMenu(false);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast('Product link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showToast('Failed to copy link.', 'error');
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${shareTitle} - ${shareText}\n\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`${shareTitle} - ${shareText}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleShareLinkedin = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleMobileScroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    const width = e.target.clientWidth;
    if (width > 0) {
      const index = Math.round(scrollLeft / width);
      setActiveMobileIdx(index);
    }
  };
  
  // Zipcode check state
  const [zipcode, setZipcode] = useState('');
  const [zipcodeStatus, setZipcodeStatus] = useState('');

  // Promo Code state
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  const { addToCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { toggleWishlist, isInWishlist, fetchWishlist } = useWishlistStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) fetchWishlist();
  }, [isAuthenticated, fetchWishlist]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [prodRes, varRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/variants/product/${id}`),
        ]);

        const fetchedProduct = prodRes.data.product;
        setProduct(fetchedProduct);
        setActiveImage(fetchedProduct.image);

        const fetchedVariants = varRes.data.variants || [];
        setVariants(fetchedVariants);

        // Default to first in-stock variant
        const firstInStock = fetchedVariants.find(v => v.stock > 0) || fetchedVariants[0];
        setSelectedVariant(firstInStock);

        if (firstInStock && firstInStock.attribute_values) {
          const initialOpts = {};
          firstInStock.attribute_values.forEach(av => {
            initialOpts[av.attribute_name] = av.value_name;
          });
          setSelectedOptions(initialOpts);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load product details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Adjust quantity if selected variant stock is lower than current quantity
  useEffect(() => {
    if (selectedVariant) {
      if (selectedVariant.stock <= 0) {
        setQuantity(1);
      } else if (quantity > selectedVariant.stock) {
        setQuantity(selectedVariant.stock);
      }
    }
  }, [selectedVariant, quantity]);

  // Swap active image to selected variant image if it has one
  useEffect(() => {
    if (selectedVariant) {
      if (selectedVariant.image) {
        setActiveImage(selectedVariant.image);
      } else if (Array.isArray(selectedVariant.other_images) && selectedVariant.other_images.length > 0) {
        setActiveImage(selectedVariant.other_images[0]);
      } else if (product) {
        setActiveImage(product.image);
      }
    }
  }, [selectedVariant, product]);

  // Apply promo code action
  const handleApplyPromoCode = async () => {
    if (!isAuthenticated) {
      showToast('Please login first to apply a promo code.', 'warning');
      navigate('/login');
      return;
    }
    if (!promoCodeInput.trim()) {
      setPromoError('Please enter a coupon code.');
      return;
    }
    
    setPromoLoading(true);
    setPromoError('');
    setPromoSuccess('');
    
    try {
      const originalVariantPrice = selectedVariant?.special_price || selectedVariant?.price || product.price || 0;
      const orderTotalForVariant = originalVariantPrice * quantity;

      const res = await api.post('/promo-codes/validate', {
        promo_code: promoCodeInput.trim().toUpperCase(),
        amount: orderTotalForVariant
      });

      if (res.data?.success) {
        setAppliedPromo({
          coupon: res.data.coupon,
          discountAmount: res.data.discountAmount
        });
        setPromoSuccess(res.data.message || 'Promo code applied successfully!');
        localStorage.setItem('applied_promo_code', res.data.coupon.promo_code);
      } else {
        setPromoError(res.data?.message || 'Failed to validate promo code');
        localStorage.removeItem('applied_promo_code');
      }
    } catch (err) {
      console.error(err);
      setPromoError(err.response?.data?.message || 'Invalid coupon code or not eligible');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromoCode = () => {
    setAppliedPromo(null);
    setPromoCodeInput('');
    setPromoSuccess('');
    setPromoError('');
    localStorage.removeItem('applied_promo_code');
  };

  // Re-verify coupon when variant or quantity changes
  useEffect(() => {
    if (appliedPromo && selectedVariant) {
      const originalVariantPrice = selectedVariant?.special_price || selectedVariant?.price || product.price || 0;
      const orderTotalForVariant = originalVariantPrice * quantity;
      
      api.post('/promo-codes/validate', {
        promo_code: appliedPromo.coupon.promo_code,
        amount: orderTotalForVariant
      })
      .then(res => {
        if (res.data?.success) {
          setAppliedPromo({
            coupon: res.data.coupon,
            discountAmount: res.data.discountAmount
          });
        }
      })
      .catch(err => {
        setAppliedPromo(null);
        setPromoError(`Coupon removed: ${err.response?.data?.message || 'min order value not met'}`);
        setPromoSuccess('');
        localStorage.removeItem('applied_promo_code');
      });
    }
  }, [selectedVariant, quantity]);

  const handleAddToCart = async () => {
    if (!product || !selectedVariant) return;
    try {
      await addToCart({
        product_id: product.id,
        variant_id: selectedVariant.id,
        qty: quantity,
      });
      showToast(`Added ${quantity} × ${product.name} (${selectedVariant.weight || ''}) to cart!`, 'success');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to add to cart', 'error');
    }
  };

  const handleBuyNow = () => {
    if (!product || !selectedVariant) return;
    if (!isAuthenticated) {
      showToast('Please login first to place an order.', 'warning');
      navigate('/login');
      return;
    }
    
    const buyNowItem = {
      product_id: product.id,
      product_variant_id: selectedVariant.id,
      name: product.name,
      image: selectedVariant.image || product.image,
      weight: selectedVariant.weight,
      qty: quantity,
      price: selectedVariant.price || product.price || 0,
      effectivePrice: selectedVariant.special_price || selectedVariant.price || product.price || 0
    };
    
    sessionStorage.setItem('is_buy_now', 'true');
    sessionStorage.setItem('buy_now_item', JSON.stringify(buyNowItem));
    
    if (appliedPromo) {
      localStorage.setItem('applied_promo_code', appliedPromo.coupon.promo_code);
    }
    
    navigate('/checkout?buyNow=true');
  };

  const increaseQty = () => {
    if (selectedVariant && quantity < selectedVariant.stock) {
      setQuantity(prev => prev + 1);
    }
  };

  const decreaseQty = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  // Local Pincode availability check (Mock)
  const handleCheckZipcode = () => {
    if (/^\d{6}$/.test(zipcode)) {
      setZipcodeStatus(`✅ Delivery is available to zipcode ${zipcode}!`);
    } else {
      setZipcodeStatus('❌ Please enter a valid 6-digit zipcode.');
    }
  };

  // Get unique weights from DB and sort them naturally
  const getSortedWeights = () => {
    const weights = [...new Set(variants.map(v => v.weight).filter(Boolean))];
    return weights.sort((a, b) => {
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  };

  const availableWeights = getSortedWeights();

  const handleSelectOption = (attrName, valName) => {
    setSelectedOptions(prev => {
      const next = { ...prev, [attrName]: valName };

      const matching = variants.find(v => {
        if (!v.attribute_values) return false;
        return v.attribute_values.every(av => next[av.attribute_name] === av.value_name);
      });

      if (matching) {
        setSelectedVariant(matching);
      } else {
        setSelectedVariant(null);
      }

      return next;
    });
  };

  const getAttributeGroups = () => {
    const groups = {};
    variants.forEach(v => {
      if (v.attribute_values) {
        v.attribute_values.forEach(av => {
          if (!groups[av.attribute_name]) {
            groups[av.attribute_name] = {
              id: av.attribute_id,
              name: av.attribute_name,
              values: []
            };
          }
          if (!groups[av.attribute_name].values.some(val => val.id === av.value_id)) {
            groups[av.attribute_name].values.push({
              id: av.value_id,
              name: av.value_name
            });
          }
        });
      }
    });
    return Object.values(groups);
  };

  const attributeGroups = getAttributeGroups();

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Loader size="large" />
      <p className="mt-4 text-gray-400 font-medium">Loading product...</p>
    </div>
  );

  if (error || !product) return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-white">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">{error || "Product Not Found"}</h2>
        <Link to="/products" className="text-indigo-600 font-semibold flex items-center justify-center gap-2 hover:underline">
          <ArrowLeft size={20} /> Back to Collection
        </Link>
      </div>
    </div>
  );

  const currentPrice = selectedVariant?.special_price || selectedVariant?.price || product.price || 0;
  const originalPrice = selectedVariant?.price || product.price || 0;
  const discountPercentage = selectedVariant?.special_price && selectedVariant.special_price < originalPrice
    ? Math.round(((originalPrice - selectedVariant.special_price) / originalPrice) * 100)
    : 0;

  // Recalculate with promo code
  const originalTotal = currentPrice * quantity;
  const discountVal = appliedPromo ? appliedPromo.discountAmount : 0;
  const finalTotal = originalTotal - discountVal;
  const finalPricePerUnit = quantity > 0 ? (finalTotal / quantity) : currentPrice;

  const getGalleryImages = () => {
    if (!product) return [];

    // Check if selected variant has images (either main or other)
    const variantHasImages = selectedVariant && (selectedVariant.image || (Array.isArray(selectedVariant.other_images) && selectedVariant.other_images.length > 0));

    if (variantHasImages) {
      const images = [];
      if (selectedVariant.image) {
        images.push(selectedVariant.image);
      }
      if (Array.isArray(selectedVariant.other_images)) {
        selectedVariant.other_images.forEach(img => {
          if (img) images.push(img);
        });
      }
      return Array.from(new Set(images));
    }

    // Fallback to product images if variant has no custom images
    const images = [];
    if (product.image) {
      images.push(product.image);
    }
    if (Array.isArray(product.other_images)) {
      product.other_images.forEach(img => {
        if (img) images.push(img);
      });
    }
    return Array.from(new Set(images));
  };
  const galleryImages = getGalleryImages();

  const productSchema = product ? {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": getImageUrl(product.image),
    "description": product.short_description || product.description,
    "sku": selectedVariant?.sku || product.sku || `PROD-${product.id}`,
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "INR",
      "price": selectedVariant ? (selectedVariant.special_price || selectedVariant.price) : (product.special_price || product.price),
      "availability": (selectedVariant ? selectedVariant.stock : product.stock) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  } : null;

  return (
    <div className="bg-[#f8f9fc] min-h-screen pb-16">
      <SEO 
        title={product.name}
        description={product.short_description || product.description}
        image={product.image}
        type="product"
        schema={productSchema}
        keywords={[product.name, window.siteName || 'product']}
      />
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <nav className="flex items-center text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-gray-900 transition">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/products" className="hover:text-gray-900 transition">Products</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">{product.name}</span>
        </nav>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Mobile Title Block */}
        <div className="block md:hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <h1 className="text-xl font-extrabold text-[#1a202c] tracking-tight uppercase leading-tight">
            {product.name}
          </h1>
          <p className="text-gray-500 text-xs mt-1.5 font-medium leading-relaxed">
            {product.short_description || `Buy ${product.name} from ${window.siteName || 'our store'}`}
          </p>
          {product.asin && (
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500 font-bold bg-slate-100 w-fit px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <span className="text-slate-400">ASIN:</span>
              <span className="text-slate-700 font-extrabold">{product.asin}</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 md:p-10 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 lg:gap-12 items-start">

          
          {/* LEFT: VERTICAL THUMBNAILS + MAIN IMAGE & DESCRIPTION */}
          <div className="col-span-1 md:col-span-6 flex flex-col gap-6">
            {/* Desktop Image Gallery */}
            <div className="hidden md:flex flex-row gap-3 sm:gap-4">
              {/* Thumbnails Stack (Vertical) */}
              <div className="flex flex-col gap-3 flex-shrink-0">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all p-1 bg-white flex-shrink-0 ${
                      activeImage === img 
                        ? 'border-purple-600 shadow-sm scale-105' 
                        : 'border-gray-200 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={getImageUrl(img)} alt="" className="w-full h-full object-contain" onError={(e) => { e.target.src = NO_IMAGE_SVG; }} />
                  </button>
                ))}
              </div>

              {/* Main Product Image */}
              <div className="flex-1 aspect-square rounded-2xl overflow-hidden border border-gray-200 bg-white p-4 flex items-center justify-center relative shadow-sm">
                <img
                  src={getImageUrl(activeImage)}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain transition-transform duration-700 hover:scale-105"
                  onError={(e) => { e.target.src = NO_IMAGE_SVG; }}
                />
                <button
                  onClick={async () => {
                    if (!isAuthenticated) {
                      showToast('Please login to add to wishlist.', 'warning');
                      navigate('/login');
                      return;
                    }
                    try {
                      await toggleWishlist(product);
                      showToast('Wishlist updated successfully!', 'success');
                    } catch (err) {
                      showToast('Failed to update wishlist.', 'error');
                    }
                  }}
                  className="absolute top-4 right-4 p-3.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-red-50 hover:text-red-500 transition-all border border-gray-100"
                >
                  <Heart size={20} className={isInWishlist(product.id) ? "fill-red-500 text-red-500" : "text-gray-400"} />
                </button>
              </div>
            </div>

            {/* Mobile Image Scroller (Horizontal Swipe Gallery) */}
            <div className="block md:hidden relative">
              <div 
                onScroll={handleMobileScroll}
                className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth w-full aspect-square bg-white rounded-2xl border border-gray-200 relative scrollbar-none"
              >
                {galleryImages.map((img, idx) => (
                  <div key={idx} className="snap-center flex-shrink-0 w-full h-full flex items-center justify-center p-4">
                    <img
                      src={getImageUrl(img)}
                      alt={`${product.name}-${idx}`}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => { e.target.src = NO_IMAGE_SVG; }}
                    />
                  </div>
                ))}
              </div>
              
              {/* Mobile Wishlist Button */}
              <button
                onClick={async () => {
                  if (!isAuthenticated) {
                    showToast('Please login to add to wishlist.', 'warning');
                    navigate('/login');
                    return;
                  }
                  try {
                    await toggleWishlist(product);
                    showToast('Wishlist updated successfully!', 'success');
                  } catch (err) {
                    showToast('Failed to update wishlist.', 'error');
                  }
                }}
                className="absolute top-4 right-4 p-3.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-red-50 hover:text-red-500 transition-all border border-gray-100 z-10"
              >
                <Heart size={18} className={isInWishlist(product.id) ? "fill-red-500 text-red-500" : "text-gray-400"} />
              </button>

              {/* Dots Indicators */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
                {galleryImages.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      activeMobileIdx === idx ? 'w-4 bg-purple-600' : 'w-1.5 bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {product.description && (
              <div className="mt-2 text-left hidden md:block">
                <h3 className="text-lg font-bold text-gray-900 mb-2.5 tracking-tight uppercase">Description</h3>
                <div 
                  className="text-gray-600 text-sm leading-relaxed font-medium HTML-description prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}
          </div>

          {/* RIGHT: DETAILS PANEL */}
          <div className="col-span-1 md:col-span-6 space-y-5">

            {/* Title & Description */}
            <div className="hidden md:block">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1a202c] tracking-tight uppercase leading-tight">
                {product.name}
              </h1>
              <p className="text-gray-500 text-sm mt-2 font-medium leading-relaxed">
                {product.short_description || `Buy ${product.name} from ${window.siteName || 'our store'}`}
              </p>
              {product.asin && (
                <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500 font-bold bg-slate-100 w-fit px-3 py-1 rounded-full uppercase tracking-wider">
                  <span className="text-slate-400">ASIN:</span>
                  <span className="text-slate-700 font-extrabold">{product.asin}</span>
                </div>
              )}
            </div>

            {/* Price Section */}
            <div className="space-y-1">
              <div className="flex items-baseline flex-wrap gap-3">
                {appliedPromo ? (
                  <>
                    <span className="text-2xl font-extrabold text-green-600">
                      ₹{Number(finalPricePerUnit).toFixed(2)}
                    </span>
                    <span className="text-sm font-semibold text-gray-400 line-through">
                      ₹{Number(currentPrice).toFixed(2)}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 animate-pulse">
                      {appliedPromo.coupon.promo_code} Applied
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-extrabold text-[#1a202c]">
                      ₹{Number(currentPrice).toFixed(2)}
                    </span>
                    {discountPercentage > 0 && (
                      <span className="text-sm font-semibold text-pink-500 line-through">
                        ₹{Number(originalPrice).toFixed(2)}
                      </span>
                    )}
                  </>
                )}
              </div>
              <p className="text-xs text-gray-400 font-medium">
                (Inclusive of all taxes)
              </p>
              {appliedPromo && (
                <p className="text-xs font-semibold text-green-600">
                  🎉 Special coupon discount! You saved ₹{Number(appliedPromo.discountAmount).toFixed(2)}!
                </p>
              )}
              
            </div>

            {/* Dynamic Option Selectors / Weight Pills */}
            {attributeGroups.length > 0 ? (
              <div className="space-y-4">
                {attributeGroups.map(group => {
                  const currentSel = selectedOptions[group.name];
                  return (
                    <div key={group.name} className="space-y-2">
                      <span className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">{group.name} :</span>
                      <div className="flex gap-3 flex-wrap">
                        {group.values.map(val => {
                          const isSelected = currentSel === val.name;
                          return (
                            <button
                              key={val.id}
                              type="button"
                              onClick={() => handleSelectOption(group.name, val.name)}
                              className={`
                                px-4 py-2 rounded-xl font-semibold text-xs transition-all duration-200 border-2 min-w-[76px] cursor-pointer
                                ${isSelected
                                  ? 'bg-[#f5f3ff] text-purple-700 border-purple-600 shadow-md scale-105 font-bold'
                                  : 'bg-white text-gray-700 border-gray-200 hover:border-purple-400 hover:shadow-sm'
                                }
                              `}
                            >
                              <span className="text-[13px] font-bold leading-tight">{val.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Fallback weight/sizes selector for backward compatibility */
              availableWeights.length > 0 && (
                <div className="space-y-2">
                  <div className="flex gap-3 flex-wrap">
                    {availableWeights.map(weight => {
                      const variant = variants.find(v => v.weight === weight);
                      const isSelected = selectedVariant?.weight === weight;
                      const isOutOfStock = variant && variant.stock <= 0;
                      return (
                        <button
                          key={weight}
                          type="button"
                          onClick={() => variant && !isOutOfStock && setSelectedVariant(variant)}
                          disabled={isOutOfStock}
                          className={`
                            relative flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 border-2 min-w-[76px]
                            ${isSelected
                              ? 'bg-[#f5f3ff] text-purple-700 border-purple-600 shadow-md scale-105'
                              : isOutOfStock
                                ? 'bg-gray-50 text-gray-400 border-dashed border-gray-300 cursor-not-allowed opacity-60'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-purple-400 hover:shadow-sm cursor-pointer'
                            }
                          `}
                        >
                          <span className="text-[13px] font-bold leading-tight">{formatWeightLabel(weight)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )
            )}

            {/* Promo Code Coupon Section */}
            <div className="pt-4 pb-3 border-t border-b border-gray-100 space-y-2">
              <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                Have a Promo Code / Coupon?
              </label>
              
              {!appliedPromo ? (
                <div className="flex max-w-md rounded-lg overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-purple-600 focus-within:border-purple-600 bg-white transition-all shadow-sm">
                  <input 
                    type="text" 
                    placeholder="Enter Coupon Code (e.g. JIJAI10)" 
                    value={promoCodeInput}
                    onChange={e => {
                      setPromoCodeInput(e.target.value);
                      if (promoError) setPromoError('');
                    }}
                    className="flex-1 px-4 py-2.5 text-sm outline-none text-gray-700 font-medium placeholder-gray-400"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyPromoCode();
                      }
                    }}
                  />
                  <button 
                    onClick={handleApplyPromoCode}
                    disabled={promoLoading}
                    className="bg-purple-700 hover:bg-purple-800 disabled:bg-purple-400 text-white text-xs font-bold px-6 py-2.5 transition flex-shrink-0 flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed uppercase tracking-wider"
                  >
                    {promoLoading && <Loader2 size={12} className="animate-spin" />}
                    Apply
                  </button>
                </div>
              ) : (
                <div className="max-w-md p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-extrabold">
                      %
                    </span>
                    <div>
                      <p className="text-xs font-extrabold text-purple-900 tracking-wider">
                        {appliedPromo.coupon.promo_code} APPLIED
                      </p>
                      <p className="text-[11px] font-semibold text-purple-700">
                        Saved ₹{Number(appliedPromo.discountAmount).toFixed(2)} on this item!
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={handleRemovePromoCode}
                    className="p-1 text-purple-400 hover:text-purple-600 transition cursor-pointer"
                    title="Remove Coupon"
                  >
                    <XCircle size={18} />
                  </button>
                </div>
              )}

              {promoError && (
                <p className="text-xs font-semibold mt-1 text-red-500 flex items-center gap-1">
                  <span>❌</span> {promoError}
                </p>
              )}
              {promoSuccess && !appliedPromo && (
                <p className="text-xs font-semibold mt-1 text-green-600 flex items-center gap-1">
                  <span>✅</span> {promoSuccess}
                </p>
              )}
            </div>



            {/* Quantity Selector */}
            <div className="flex items-center border border-gray-300 rounded-md w-fit overflow-hidden bg-white shadow-sm">
              <button onClick={decreaseQty} className="px-3.5 py-1.5 text-gray-500 hover:bg-gray-50 text-sm font-bold transition">-</button>
              <span className="px-5 py-1.5 text-xs font-bold border-x border-gray-300 min-w-[36px] text-center text-[#1a202c]">{quantity}</span>
              <button onClick={increaseQty} className="px-3.5 py-1.5 text-gray-500 hover:bg-gray-50 text-sm font-bold transition">+</button>
            </div>

            {/* Purchase Action Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3 pt-2">
              <button 
                onClick={handleAddToCart}
                disabled={!selectedVariant || selectedVariant.stock <= 0 || quantity > selectedVariant.stock}
                className="px-4 sm:px-6 py-2.5 rounded-md bg-secondary hover:bg-secondary/90 text-white font-bold text-xs shadow-sm transition uppercase disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!selectedVariant ? 'Combination Unavailable' : selectedVariant.stock <= 0 ? 'Out of Stock' : 'Add in Cart'}
              </button>
              <button 
                onClick={handleBuyNow}
                disabled={!selectedVariant || selectedVariant.stock <= 0 || quantity > selectedVariant.stock}
                className="px-6 py-2.5 rounded-md bg-[#0f766e] hover:bg-[#0d5c56] text-white font-bold text-xs shadow-sm transition uppercase disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!selectedVariant ? 'Combination Unavailable' : selectedVariant.stock <= 0 ? 'Out of Stock' : 'Buy It Now'}
              </button>
              <a
                href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
                  `Hi! I am interested in ordering:\n\n*Product:* ${product.name}\n*Variant/Weight:* ${selectedVariant?.weight || 'Default'}\n*Quantity:* ${quantity}\n*Price per unit:* ₹${Number(currentPrice).toFixed(2)}\n*Total Price:* ₹${Number(currentPrice * quantity).toFixed(2)}\n\n*My Requirements:* [Write any custom requirements or delivery note here]`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 rounded-md bg-[#25D366] hover:bg-[#1fae53] text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition uppercase"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.473 1.452 5.38 1.453 5.485 0 9.948-4.463 9.952-9.953.002-2.661-1.03-5.163-2.906-7.039C17.2 1.74 14.7.708 12.036.708c-5.461 0-9.92 4.45-9.927 9.947-.001 1.916.504 3.79 1.464 5.394l-.963 3.517 3.606-.946zm11.52-7.112c-.27-.135-1.597-.788-1.848-.879-.25-.09-.433-.135-.615.135-.18.27-.7.879-.857 1.057-.158.18-.316.2-.586.065-.27-.135-1.14-.42-2.17-1.337-.8-.713-1.34-1.594-1.497-1.864-.158-.27-.017-.417.118-.552.121-.12.27-.315.405-.473.135-.158.18-.27.27-.45.09-.18.045-.338-.022-.473-.068-.135-.615-1.482-.843-2.029-.222-.534-.444-.46-.615-.468-.158-.007-.338-.007-.518-.007-.18 0-.473.068-.72.338-.248.27-.946.924-.946 2.251s.965 2.613 1.1 2.793c.135.18 1.899 2.9 4.6 4.067.643.277 1.143.444 1.533.567.646.205 1.234.176 1.7.106.52-.078 1.597-.652 1.822-1.282.225-.63.225-1.17.158-1.282-.068-.112-.25-.202-.52-.337z"/>
                </svg>
                Order From Whatsapp
              </a>

              {/* Share Button Wrapper */}
              <div className="relative">
                <button
                  type="button"
                  onClick={handleShareClick}
                  className="px-6 py-2.5 rounded-md border border-gray-300 hover:border-purple-600 hover:bg-purple-50 text-gray-700 hover:text-purple-700 font-bold text-xs shadow-sm flex items-center gap-1.5 transition uppercase cursor-pointer bg-white"
                >
                  <Share2 size={16} />
                  Share
                </button>

                {showShareMenu && (
                  <>
                    {/* Backdrop to close click-away */}
                    <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
                    
                    {/* Dropdown Card */}
                    <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-56 rounded-xl bg-white border border-gray-200 shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-3 py-1.5 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                        Share Product
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition text-left cursor-pointer border-none bg-transparent"
                      >
                        {copied ? (
                          <>
                            <CheckCircle size={16} className="text-green-600" />
                            <span className="text-green-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={16} className="text-gray-500" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleShareWhatsApp}
                        className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition text-left cursor-pointer border-none bg-transparent"
                      >
                        <svg className="w-4 h-4 text-[#25D366] fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.473 1.452 5.38 1.453 5.485 0 9.948-4.463 9.952-9.953.002-2.661-1.03-5.163-2.906-7.039C17.2 1.74 14.7.708 12.036.708c-5.461 0-9.92 4.45-9.927 9.947-.001 1.916.504 3.79 1.464 5.394l-.963 3.517 3.606-.946zm11.52-7.112c-.27-.135-1.597-.788-1.848-.879-.25-.09-.433-.135-.615.135-.18.27-.7.879-.857 1.057-.158.18-.316.2-.586.065-.27-.135-1.14-.42-2.17-1.337-.8-.713-1.34-1.594-1.497-1.864-.158-.27-.017-.417.118-.552.121-.12.27-.315.405-.473.135-.158.18-.27.27-.45.09-.18.045-.338-.022-.473-.068-.135-.615-1.482-.843-2.029-.222-.534-.444-.46-.615-.468-.158-.007-.338-.007-.518-.007-.18 0-.473.068-.72.338-.248.27-.946.924-.946 2.251s.965 2.613 1.1 2.793c.135.18 1.899 2.9 4.6 4.067.643.277 1.143.444 1.533.567.646.205 1.234.176 1.7.106.52-.078 1.597-.652 1.822-1.282.225-.63.225-1.17.158-1.282-.068-.112-.25-.202-.52-.337z"/>
                        </svg>
                        <span>WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleShareFacebook}
                        className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition text-left cursor-pointer border-none bg-transparent"
                      >
                        <Facebook size={16} className="text-[#1877F2]" />
                        <span>Facebook</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleShareTwitter}
                        className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition text-left cursor-pointer border-none bg-transparent"
                      >
                        <Twitter size={16} className="text-[#1DA1F2]" />
                        <span>Twitter / X</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleShareLinkedin}
                        className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition text-left cursor-pointer border-none bg-transparent"
                      >
                        <Linkedin size={16} className="text-[#0A66C2]" />
                        <span>LinkedIn</span>
                      </button>

                      {navigator.share && (
                        <button
                          type="button"
                          onClick={handleNativeShare}
                          className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 border-t border-gray-100 mt-1 pt-2 transition text-left cursor-pointer border-none bg-transparent"
                        >
                          <Share2 size={16} className="text-gray-500" />
                          <span>More Options...</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Specifications Section - Below CTA Buttons */}
            {product.asin && (
              <div className="space-y-4 pt-4 border-t border-gray-100 text-left">
                <h3 className="text-lg font-bold text-gray-900 tracking-tight uppercase">Specifications</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden max-w-xl shadow-sm bg-white">
                  <div className="flex text-xs font-semibold text-gray-700">
                    <div className="w-1/3 bg-gray-50 px-4 py-3 border-r border-gray-200 text-gray-500 uppercase tracking-wider flex items-center">
                      ASIN
                    </div>
                    <div className="w-2/3 px-4 py-3 bg-white text-gray-600 flex items-center font-bold">
                      {product.asin}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Description Dropdown */}
            {product.description && (
              <div className="block md:hidden mt-6 text-left border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setIsDescOpen(!isDescOpen)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 text-left font-bold text-gray-900 focus:outline-none border-none cursor-pointer"
                >
                  <span className="text-xs uppercase tracking-wider">Description</span>
                  <ChevronDown 
                    className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                      isDescOpen ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {isDescOpen && (
                  <div 
                    className="p-4 text-gray-600 text-sm leading-relaxed font-medium HTML-description prose max-w-none border-t border-gray-200 bg-white"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                )}
              </div>
            )}

          </div>
        </div>
      </main>

      {/* FLOATING WHATSAPP BUTTON */}
      <a
        href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
          `Hi! I am interested in ordering:\n\n*Product:* ${product?.name || ''}\n*Variant/Weight:* ${selectedVariant?.weight || 'Default'}\n*Quantity:* ${quantity}\n*Price per unit:* ₹${Number(currentPrice).toFixed(2)}\n*Total Price:* ₹${Number(currentPrice * quantity).toFixed(2)}\n\n*My Requirements:* [Write any custom requirements or delivery note here]`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-[99] bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:bg-[#20ba59] hover:scale-110 transition duration-300 flex items-center justify-center"
        title="Chat on WhatsApp"
      >
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.473 1.452 5.38 1.453 5.485 0 9.948-4.463 9.952-9.953.002-2.661-1.03-5.163-2.906-7.039C17.2 1.74 14.7.708 12.036.708c-5.461 0-9.92 4.45-9.927 9.947-.001 1.916.504 3.79 1.464 5.394l-.963 3.517 3.606-.946zm11.52-7.112c-.27-.135-1.597-.788-1.848-.879-.25-.09-.433-.135-.615.135-.18.27-.7.879-.857 1.057-.158.18-.316.2-.586.065-.27-.135-1.14-.42-2.17-1.337-.8-.713-1.34-1.594-1.497-1.864-.158-.27-.017-.417.118-.552.121-.12.27-.315.405-.473.135-.158.18-.27.27-.45.09-.18.045-.338-.022-.473-.068-.135-.615-1.482-.843-2.029-.222-.534-.444-.46-.615-.468-.158-.007-.338-.007-.518-.007-.18 0-.473.068-.72.338-.248.27-.946.924-.946 2.251s.965 2.613 1.1 2.793c.135.18 1.899 2.9 4.6 4.067.643.277 1.143.444 1.533.567.646.205 1.234.176 1.7.106.52-.078 1.597-.652 1.822-1.282.225-.63.225-1.17.158-1.282-.068-.112-.25-.202-.52-.337z"/>
        </svg>
      </a>
    </div>
  );
}
