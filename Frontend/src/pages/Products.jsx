import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../lib/api";
import { AnimatePresence, motion } from "framer-motion";
import {
  Heart, ShoppingBag, ChevronDown,
  Star, Loader2, X, LayoutGrid, AlignJustify
} from "lucide-react";
import { useCartStore } from "../store/cartStore";
import { useWishlistStore } from "../store/wishlistStore";
import { useAuthStore } from "../store/authStore";
import { getImageUrl, NO_IMAGE_SVG } from "../lib/imageUrl";
import SEO from "../components/SEO";

/* ─────────────────────────────────────────────────────────────── */
const NO_IMG = NO_IMAGE_SVG;

function Toast({ message, type, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-semibold ${
        type === "error" ? "bg-red-500" : "bg-emerald-500"
      }`}
    >
      <span>{message}</span>
      <button onClick={onClose}><X size={14} /></button>
    </motion.div>
  );
}

/* ── 5-Star row (all empty by default) ─────────────────────────── */
function Stars({ count = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={12} className="text-gray-300 fill-gray-300" />
      ))}
    </div>
  );
}

/* ── Single Product Card ─────────────────────────────────────────
   Matches screenshot exactly:
   • white card, light border
   • ♥ icon top-left over image
   • product image (tall, object-contain)
   • name bold uppercase
   • 5 empty stars
   • ₹price  ₹mrp-strikethrough  X% off (green)
   • full-width "Add to Cart" purple button
──────────────────────────────────────────────────────────────── */
function ProductCard({ product, onAddToCart, onToggleWishlist, isAdding, wishlisted }) {
  const price   = Number(product.price)         || 0;
  const special = Number(product.special_price) || 0;
  const sell    = special > 0 && special < price ? special : price;
  const disc    = special > 0 && special < price
    ? Math.round(((price - special) / price) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200">

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
            className={wishlisted ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-400 transition-colors"}
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
            ₹{sell.toLocaleString("en-IN")}
          </span>
          {disc > 0 && (
            <>
              <span className="text-gray-400 line-through text-xs">
                ₹{price.toLocaleString("en-IN")}
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
          style={{ background: "var(--secondary)" }}
        >
          {isAdding
            ? <Loader2 size={13} className="animate-spin" />
            : <ShoppingBag size={13} />
          }
          {isAdding ? "Adding…" : product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

/* ── List-view row ──────────────────────────────────────────────── */
function ProductRow({ product, onAddToCart, onToggleWishlist, isAdding, wishlisted }) {
  const price   = Number(product.price)         || 0;
  const special = Number(product.special_price) || 0;
  const sell    = special > 0 && special < price ? special : price;
  const disc    = special > 0 && special < price
    ? Math.round(((price - special) / price) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 flex gap-4 p-3 hover:shadow-md transition-shadow">
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
          <span className="font-bold text-sm text-gray-900">₹{sell.toLocaleString("en-IN")}</span>
          {disc > 0 && (
            <>
              <span className="text-gray-400 line-through text-xs">₹{price.toLocaleString("en-IN")}</span>
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
          <Heart size={16} className={wishlisted ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-400"} />
        </button>
        <button
          onClick={e => onAddToCart(product, e)}
          disabled={isAdding || product.stock <= 0}
          className="px-3 py-1.5 rounded text-white text-xs font-bold disabled:opacity-50"
          style={{ background: "var(--secondary)" }}
        >
          {isAdding ? <Loader2 size={12} className="animate-spin" /> : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════ */
export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [brands,   setBrands]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy,   setSortBy]   = useState("relevance");
  const [toast,    setToast]    = useState(null);
  const [addingId, setAddingId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  /* Category filter state */
  const [categories, setCategories]       = useState([]);
  const [activeCategory, setActiveCategory] = useState(null); // null = All


  const { addToCart }                              = useCartStore();
  const { toggleWishlist, isInWishlist, fetchWishlist } = useWishlistStore();
  const { isAuthenticated }                        = useAuthStore();

  useEffect(() => { if (isAuthenticated) fetchWishlist(); }, [isAuthenticated, fetchWishlist]);

  /* ── Fetch categories on mount ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/categories?include_subcategories=false");
        setCategories(res.data.categories || []);
      } catch (e) {
        console.error("Failed to load categories:", e);
      }
    })();
  }, []);

  /* ── Fetch paginated products ── */
  const fetchPaginatedProducts = useCallback(async () => {
    try {
      setLoading(true);
      const searchVal = searchParams.get("search") || "";

      let url = `/products?limit=12&page=${currentPage}&sort=${sortBy}`;
      if (activeCategory) url += `&category_id=${activeCategory}`;
      if (searchVal) url += `&search=${encodeURIComponent(searchVal)}`;
      
      const res = await api.get(url);
      setProducts(res.data.products || []);
      setTotalProducts(res.data.count || 0);
    } catch (e) {
      console.error("Products fetch failed:", e.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeCategory, sortBy, searchParams]);

  useEffect(() => {
    fetchPaginatedProducts();
  }, [fetchPaginatedProducts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchParams]);

  // Weight options are not required for clothing business

  const displayed = products;

  /* ── Helpers ── */
  const showToast = (msg, type = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleWishlist = async (product, e) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { showToast("Please login to use wishlist", "error"); return; }
    try { await toggleWishlist(product); } catch { showToast("Wishlist update failed", "error"); }
  };

  const handleCart = async (product, e) => {
    e.preventDefault(); e.stopPropagation();
    setAddingId(product.id);
    try {
      await addToCart({ 
        product_id: product.id, 
        variant_id: product.default_variant_id, 
        qty: 1 
      });
      showToast(`${product.name} added to cart! 🛍️`);
    } catch {
      showToast("Failed to add to cart", "error");
    } finally { setAddingId(null); }
  };

  const resetFilters = () => {
    setCurrentPage(1);
    setActiveCategory(null);
  };

  const handleCategorySelect = (catId) => {
    setCurrentPage(1);
    setActiveCategory(prev => (prev === catId ? null : catId));
  };

  const activeFiltersCount = activeCategory ? 1 : 0;

  const searchKeyword = searchParams.get("search") || "";
  const seoTitle = searchKeyword ? `Search results for "${searchKeyword}"` : "Shop Products";
  const seoDesc = searchKeyword 
    ? `Find top results for "${searchKeyword}" at ${window.siteName || 'our store'}.` 
    : (window.metaDescription || "Browse our collection of high quality products.");

  /* ═══════════════════════════════ RENDER ═══════════════════════ */
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <SEO 
        title={seoTitle} 
        description={seoDesc} 
        keywords={searchKeyword ? [searchKeyword, 'search', 'shop'] : []} 
      />

      {/* ── Breadcrumb ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3">
        <p className="text-[13px] text-gray-500">
          <Link to="/" className="text-gray-500 no-underline">Home</Link>
          <span className="mx-1.5">/</span>
          <span className="text-gray-800 font-semibold">Products</span>
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 pt-4">

        {/* ── CATEGORY DROPDOWN ── */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-sm font-bold text-gray-700 whitespace-nowrap">Category:</span>
          <div className="relative">
            <select
              value={activeCategory ?? ""}
              onChange={e => handleCategorySelect(e.target.value ? Number(e.target.value) : null)}
              className="py-2 pl-4 pr-10 border border-gray-200 rounded-xl bg-white text-sm text-gray-700 font-medium outline-none cursor-pointer appearance-none focus:ring-2 focus:ring-purple-400 shadow-sm"
            >
              <option value="">All Products</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>


        {/* MAIN CONTENT — full width */}
        <div>

          {/* Top bar: title + view toggle + sort */}
          <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
            <h1 className="text-xl font-bold text-gray-900 m-0">
              {searchParams.get("search")
                ? `Search Results for "${searchParams.get("search")}"`
                : activeCategory
                  ? categories.find(c => c.id === activeCategory)?.name || "Products"
                  : "All Products"}
            </h1>
            <div className="flex items-center gap-2.5 ml-auto flex-wrap">
              {/* View toggle */}
              <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 border-none cursor-pointer flex items-center ${
                    viewMode === "grid" ? "bg-purple-700 text-white" : "bg-white text-gray-500"
                  }`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 border-none cursor-pointer flex items-center ${
                    viewMode === "list" ? "bg-purple-700 text-white" : "bg-white text-gray-500"
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

          {/* Search chip */}
          {searchParams.get("search") && (
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                Search: {searchParams.get("search")}
                <button
                  onClick={() => {
                    setSearchParams(prev => {
                      const newParams = new URLSearchParams(prev);
                      newParams.delete("search");
                      return newParams;
                    });
                  }}
                  className="bg-transparent border-none cursor-pointer p-0 flex leading-none"
                >
                  <X size={11} color="#5b21b6" />
                </button>
              </span>
            </div>
          )}


          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center h-72">
              <div className="text-center">
                <Loader2 size={40} className="text-purple-600 animate-spin mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Loading products…</p>
              </div>
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-20 px-5 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-600 text-base mb-4">No products found</p>
              <button onClick={resetFilters} className="px-6 py-2.5 bg-purple-700 text-white rounded-lg border-none cursor-pointer font-bold">
                Clear Filters
              </button>
            </div>
          ) : viewMode === "grid" ? (
            /* GRID */
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              <AnimatePresence mode="popLayout">
                {displayed.map((product, i) => (
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
            /* LIST */
            <div className="flex flex-col gap-3">

              <AnimatePresence mode="popLayout">
                {displayed.map((product, i) => (
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

          {/* Pagination Controls */}
          {totalProducts > 12 && (
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
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalProducts / 12)))}
                  disabled={currentPage === Math.ceil(totalProducts / 12)}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between col-span-full">
                <div>
                  <p className="text-xs text-gray-500">
                    Showing <span className="font-semibold text-gray-800">{(currentPage - 1) * 12 + 1}</span> to{' '}
                    <span className="font-semibold text-gray-800">
                      {Math.min(currentPage * 12, totalProducts)}
                    </span>{' '}
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
                    {Array.from({ length: Math.ceil(totalProducts / 12) }).map((_, idx) => {
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
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalProducts / 12)))}
                      disabled={currentPage === Math.ceil(totalProducts / 12)}
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

      {/* Spin keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}