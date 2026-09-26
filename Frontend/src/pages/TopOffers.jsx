// src/pages/TopOffers.jsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Heart, ShoppingBag, ChevronDown, ChevronUp,
  Star, Loader2, X, LayoutGrid, AlignJustify, Percent
} from 'lucide-react';
import api from '../lib/api';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useAuthStore } from '../store/authStore';
import { getImageUrl, NO_IMAGE_SVG } from '../lib/imageUrl';

const NO_IMG = NO_IMAGE_SVG;

function Toast({ message, type, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-semibold ${
        type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
      }`}
    >
      <span>{message}</span>
      <button onClick={onClose}><X size={14} /></button>
    </motion.div>
  );
}

function Stars({ count = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={12} className="text-gray-300 fill-gray-300" />
      ))}
    </div>
  );
}

function ProductCard({ product, onAddToCart, onToggleWishlist, isAdding, wishlisted }) {
  const price   = Number(product.price)         || 0;
  const special = Number(product.special_price) || 0;
  const sell    = special > 0 && special < price ? special : price;
  const disc    = special > 0 && special < price
    ? Math.round(((price - special) / price) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200 relative">
      {/* Offer badge */}
      {disc > 0 && (
        <div className="absolute top-2 right-2 z-10 bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
          {disc}% OFF
        </div>
      )}

      {/* IMAGE AREA */}
      <div className="relative bg-white">
        {/* Heart */}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleWishlist(product, e); }}
          className="absolute top-2 left-2 z-10"
          aria-label="Wishlist"
        >
          <Heart
            size={18}
            className={wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400 transition-colors'}
          />
        </button>

        <Link to={`/product/${product.slug || product.id}`} className="block">
          <div className="w-full h-44 flex items-center justify-center p-2">
            <img
              src={getImageUrl(product.image, NO_IMG)}
              alt={product.name}
              className="max-h-full max-w-full object-contain"
              onError={e => { e.target.src = NO_IMG; }}
            />
          </div>
        </Link>
      </div>

      {/* DETAILS AREA */}
      <div className="px-3 pt-2 pb-3 flex flex-col flex-1">
        {/* Name */}
        <Link to={`/product/${product.slug || product.id}`}>
          <h3 className="text-sm font-bold text-gray-900 uppercase leading-snug mb-1.5 hover:text-purple-700 transition-colors break-words min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>

        {/* Stars */}
        <Stars />

        {/* Price row */}
        <div className="mt-2 flex items-center flex-wrap gap-x-1.5 gap-y-0.5">
          <span className="text-gray-900 font-bold text-sm">
            ₹{sell.toLocaleString('en-IN')}
          </span>
          {disc > 0 && (
            <>
              <span className="text-gray-400 line-through text-xs">
                ₹{price.toLocaleString('en-IN')}
              </span>
              <span className="text-green-600 text-xs font-semibold">
                {disc}% off
              </span>
            </>
          )}
        </div>

        {/* Add to Cart */}
        <button
          onClick={e => { e.preventDefault(); onAddToCart(product, e); }}
          disabled={isAdding || product.stock <= 0}
          className="mt-3 w-full py-2 rounded text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-opacity"
          style={{ background: 'var(--secondary)' }}
        >
          {isAdding
            ? <Loader2 size={13} className="animate-spin" />
            : <ShoppingBag size={13} />
          }
          {isAdding ? 'Adding…' : product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

function ProductRow({ product, onAddToCart, onToggleWishlist, isAdding, wishlisted }) {
  const price   = Number(product.price)         || 0;
  const special = Number(product.special_price) || 0;
  const sell    = special > 0 && special < price ? special : price;
  const disc    = special > 0 && special < price
    ? Math.round(((price - special) / price) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 flex gap-4 p-3 hover:shadow-md transition-shadow relative">
      {disc > 0 && (
        <div className="absolute top-2 right-2 z-10 bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
          {disc}% OFF
        </div>
      )}
      <Link to={`/product/${product.slug || product.id}`} className="flex-shrink-0">
        <div className="w-20 h-20 bg-gray-50 rounded flex items-center justify-center">
          <img
            src={getImageUrl(product.image, NO_IMG)}
            alt={product.name}
            className="max-h-full max-w-full object-contain"
            onError={e => { e.target.src = NO_IMG; }}
          />
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <Link to={`/product/${product.slug || product.id}`}>
          <h3 className="text-sm font-bold text-gray-900 uppercase leading-tight mb-1 hover:text-purple-700">
            {product.name}
          </h3>
        </Link>
        <Stars />
        <div className="mt-1.5 flex items-center gap-2">
          <span className="font-bold text-sm text-gray-900">₹{sell.toLocaleString('en-IN')}</span>
          {disc > 0 && (
            <>
              <span className="text-gray-400 line-through text-xs">₹{price.toLocaleString('en-IN')}</span>
              <span className="text-green-600 text-xs font-semibold">{disc}% off</span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleWishlist(product, e); }}
          aria-label="Wishlist"
        >
          <Heart size={16} className={wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400'} />
        </button>
        <button
          onClick={e => onAddToCart(product, e)}
          disabled={isAdding || product.stock <= 0}
          className="px-3 py-1.5 rounded text-white text-xs font-bold disabled:opacity-50"
          style={{ background: 'var(--secondary)' }}
        >
          {isAdding ? <Loader2 size={12} className="animate-spin" /> : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════ */
const PAGE_SIZE = 12;

export default function TopOffers() {
  const [products,   setProducts]   = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [brands,     setBrands]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [viewMode,   setViewMode]   = useState('grid');
  const [sortBy,     setSortBy]     = useState('relevance');
  const [toast,      setToast]      = useState(null);
  const [addingId,   setAddingId]   = useState(null);

  const [currentPage,    setCurrentPage]    = useState(1);
  const [totalProducts,  setTotalProducts]  = useState(0);

  const [weightOpen, setWeightOpen] = useState(true);
  const [brandOpen,  setBrandOpen]  = useState(true);

  const [activeWeights, setActiveWeights] = useState([]);
  const [activeBrands,  setActiveBrands]  = useState([]);

  const { addToCart }                               = useCartStore();
  const { toggleWishlist, isInWishlist, fetchWishlist } = useWishlistStore();
  const { isAuthenticated }                         = useAuthStore();

  useEffect(() => { if (isAuthenticated) fetchWishlist(); }, [isAuthenticated, fetchWishlist]);

  /* Load all offer products for filter options */
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/products?on_offer=true&limit=500');
        const list = res.data.products || [];
        setAllProducts(list);
        setBrands([...new Set(list.map(p => p.brand).filter(Boolean))]);
      } catch (e) {
        console.error('Failed to load offer brands:', e);
      }
    })();
  }, []);

  /* Fetch paginated offer products */
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const brandParam  = activeBrands.join(',');
      const weightParam = activeWeights.join(',');
      let url = `/products?on_offer=true&limit=${PAGE_SIZE}&page=${currentPage}&sort=${sortBy}`;
      if (brandParam)  url += `&brand=${encodeURIComponent(brandParam)}`;
      if (weightParam) url += `&weight=${encodeURIComponent(weightParam)}`;

      const res = await api.get(url);
      setProducts(res.data.products || []);
      setTotalProducts(res.data.count || 0);
    } catch (e) {
      console.error('Offers fetch failed:', e);
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeBrands, activeWeights, sortBy]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  /* Weight options from all offer products */
  const weightOptions = useMemo(() => {
    const weights = new Set();
    allProducts.forEach(p => {
      if (p.tags) {
        const matches = p.tags.match(/\b\d+\s*(?:gm|kg)\b/gi);
        if (matches) {
          matches.forEach(m => {
            const num  = parseFloat(m);
            const unit = m.toLowerCase().includes('kg') ? 'kg' : 'gm';
            weights.add(`${num} ${unit}`);
          });
        }
      }
    });
    const sorted = [...weights].sort((a, b) => {
      const getVal = s => {
        const num = parseFloat(s) || 0;
        return s.includes('kg') ? num * 1000 : num;
      };
      return getVal(a) - getVal(b);
    });
    return sorted.length > 0 ? sorted : ['100 gm', '250 gm', '300 gm', '500 gm', '1 kg'];
  }, [allProducts]);

  /* Helpers */
  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleWishlist = async (product, e) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { showToast('Please login to use wishlist', 'error'); return; }
    try { await toggleWishlist(product); } catch { showToast('Wishlist update failed', 'error'); }
  };

  const handleCart = async (product, e) => {
    e.preventDefault(); e.stopPropagation();
    setAddingId(product.id);
    try {
      await addToCart({ product_id: product.id, variant_id: product.default_variant_id, qty: 1 });
      showToast(`${product.name} added to cart! 🛍️`);
    } catch {
      showToast('Failed to add to cart', 'error');
    } finally { setAddingId(null); }
  };

  const resetFilters = () => {
    setCurrentPage(1);
    setActiveWeights([]);
    setActiveBrands([]);
  };

  const handleWeightToggle = w => {
    setCurrentPage(1);
    setActiveWeights(prev => prev.includes(w) ? [] : [w]);
  };

  const handleBrandToggle = b => {
    setCurrentPage(1);
    setActiveBrands(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  };

  const totalPages = Math.ceil(totalProducts / PAGE_SIZE);

  /* ═══════════════════════════════ RENDER ═══════════════════════ */
  return (
    <div className="min-h-screen bg-[#f5f5f5]">

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3">
        <p className="text-[13px] text-gray-500">
          <Link to="/" className="text-gray-500 no-underline">Home</Link>
          <span className="mx-1.5">/</span>
          <span className="text-gray-800 font-semibold">Top Offers</span>
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 pt-4">

        {/* MAIN CONTENT */}
        <div className="w-full">

          {/* Top bar */}
          <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
            <h1 className="text-xl font-bold text-gray-900 m-0 flex items-center gap-2">
              Top Offers
            </h1>
            <div className="flex items-center gap-2.5 ml-auto flex-wrap">
              {/* View toggle */}
              <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 border-none cursor-pointer flex items-center ${
                    viewMode === 'grid' ? 'bg-purple-700 text-white' : 'bg-white text-gray-500'
                  }`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 border-none cursor-pointer flex items-center ${
                    viewMode === 'list' ? 'bg-purple-700 text-white' : 'bg-white text-gray-500'
                  }`}
                >
                  <AlignJustify size={16} />
                </button>
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="py-2 pl-3 pr-8 border border-gray-200 rounded-lg bg-white text-sm text-gray-600 font-medium outline-none cursor-pointer appearance-none"
                >
                  <option value="relevance">Relevance</option>
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name-az">Name: A → Z</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {(activeWeights.length > 0 || activeBrands.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-3">
              {[...activeWeights.map(w => ({ label: w, type: 'w' })), ...activeBrands.map(b => ({ label: b, type: 'b' }))].map(f => (
                <span key={f.label + f.type} className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                  {f.label}
                  <button onClick={() => {
                    if (f.type === 'w') setActiveWeights(p => p.filter(x => x !== f.label));
                    else setActiveBrands(p => p.filter(x => x !== f.label));
                  }} className="bg-transparent border-none cursor-pointer p-0 flex leading-none">
                    <X size={11} color="#5b21b6" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center h-72">
              <div className="text-center">
                <Loader2 size={40} className="text-purple-600 animate-spin mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Loading offers…</p>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 px-5 bg-white rounded-xl border border-gray-200">
              <Percent size={40} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600 text-base mb-4">No offers found matching your filters</p>
              <button onClick={resetFilters} className="px-6 py-2.5 bg-purple-700 text-white rounded-lg border-none cursor-pointer font-bold">
                Clear Filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              <AnimatePresence mode="popLayout">
                {products.map((product, i) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
                  >
                    <ProductCard
                      product={product}
                      onAddToCart={handleCart}
                      onToggleWishlist={handleWishlist}
                      isAdding={addingId === product.id}
                      wishlisted={isInWishlist(product.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence mode="popLayout">
                {products.map((product, i) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.2) }}
                  >
                    <ProductRow
                      product={product}
                      onAddToCart={handleCart}
                      onToggleWishlist={handleWishlist}
                      isAdding={addingId === product.id}
                      wishlisted={isInWishlist(product.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Pagination */}
          {totalProducts > PAGE_SIZE && (
            <div className="flex items-center justify-between border border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6 rounded-xl shadow-sm">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-gray-500">
                    Showing <span className="font-semibold text-gray-800">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{' '}
                    <span className="font-semibold text-gray-800">{Math.min(currentPage * PAGE_SIZE, totalProducts)}</span>{' '}
                    of <span className="font-semibold text-gray-800">{totalProducts}</span> results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50 cursor-pointer"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronDown className="rotate-90 text-gray-500" size={16} />
                    </button>
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 text-xs font-semibold focus:z-20 cursor-pointer ${
                            currentPage === pageNum
                              ? 'z-10 bg-purple-700 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-700'
                              : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50 cursor-pointer"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronDown className="-rotate-90 text-gray-500" size={16} />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast key="toast" message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
