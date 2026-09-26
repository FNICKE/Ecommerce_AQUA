import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import { 
  ChevronDown, Heart, ShoppingBag, Loader2, Star, X, LayoutGrid, AlignJustify 
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useAuthStore } from '../store/authStore';
import { getImageUrl, NO_IMAGE_SVG } from '../lib/imageUrl';
import { motion, AnimatePresence } from 'framer-motion';

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
      <button onClick={onClose} className="bg-transparent border-none text-white cursor-pointer"><X size={14} /></button>
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

function ProductRow({ product }) {
  const { addToCart } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();

  const [isAdding, setIsAdding] = useState(false);
  const [toast, setToast] = useState(null);

  const price   = Number(product.price)         || 0;
  const special = Number(product.special_price) || 0;
  const sell    = special > 0 && special < price ? special : price;
  const disc    = special > 0 && special < price
    ? Math.round(((price - special) / price) * 100)
    : 0;

  const wishlisted = isInWishlist ? isInWishlist(product.id) : false;

  const showToast = (msg, type = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleWishlist = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { showToast("Please login to use wishlist", "error"); return; }
    try { 
      await toggleWishlist(product); 
    } catch (err) { 
      showToast("Wishlist update failed", "error"); 
    }
  };

  const handleCart = async (e) => {
    e.preventDefault(); e.stopPropagation();
    setIsAdding(true);
    try {
      await addToCart({ 
        product_id: product.id, 
        variant_id: product.default_variant_id, 
        qty: 1 
      });
      showToast(`${product.name} added to cart! 🛍️`);
    } catch (err) {
      showToast("Failed to add to cart", "error");
    } finally { 
      setIsAdding(false); 
    }
  };

  return (
    <>
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

        <div className="flex flex-col items-end gap-2 flex-shrink-0 justify-between py-1">
          <button
            onClick={handleWishlist}
            aria-label="Wishlist"
            className="bg-transparent border-none cursor-pointer"
          >
            <Heart size={16} className={wishlisted ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-400"} />
          </button>
          <button
            onClick={handleCart}
            disabled={isAdding || product.stock <= 0}
            className="px-3 py-1.5 rounded text-white text-xs font-bold disabled:opacity-50 border-none cursor-pointer"
            style={{ background: "var(--secondary)" }}
          >
            {isAdding ? <Loader2 size={12} className="animate-spin" /> : "Add to Cart"}
          </button>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast 
            key="toast" 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function Category() {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("relevance");

  // Fetch category info on category change
  useEffect(() => {
    const fetchCategoryInfo = async () => {
      try {
        const res = await api.get(`/categories/${id}`);
        setCategory(res.data.category);
      } catch (err) {
        setError('Failed to load category');
        console.error(err);
      }
    };
    fetchCategoryInfo();
    setCurrentPage(1); // Reset page when category changes
  }, [id]);

  // Fetch products on page/category/sort change
  useEffect(() => {
    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);
        const prodRes = await api.get(`/products?category_id=${id}&limit=12&page=${currentPage}&sort=${sortBy}`);
        setProducts(prodRes.data.products || []);
        setTotalProducts(prodRes.data.count || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryProducts();
  }, [id, currentPage, sortBy]);

  if (loading && !category) return <Loader fullScreen />;

  if (error || !category) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="text-center p-8 bg-white rounded-2xl border border-gray-200 shadow-sm max-w-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Category Not Found</h2>
          <p className="text-gray-500 mb-6">The category collection you are looking for does not exist or has been disabled.</p>
          <Link to="/" className="inline-block py-3 px-6 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-200 no-underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalProducts / 12);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* ── Breadcrumb ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3">
        <p className="text-[13px] text-gray-500">
          <Link to="/" className="text-gray-500 no-underline hover:text-purple-600 transition-colors">Home</Link>
          <span className="mx-1.5">/</span>
          <Link to="/category" className="text-gray-500 no-underline hover:text-purple-600 transition-colors">Categories</Link>
          <span className="mx-1.5">/</span>
          <span className="text-gray-800 font-semibold">{category.name}</span>
        </p>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 pt-4">
        
        {/* Top Header & Controls Row */}
        <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900 m-0 tracking-tight">
              {category.name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{totalProducts} Products Available</p>
          </div>

          <div className="flex items-center gap-2.5 ml-auto flex-wrap">
            {/* View mode toggle */}
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

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => { setCurrentPage(1); setSortBy(e.target.value); }}
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

        {/* Content area */}
        {loading && currentPage === 1 ? (
          <div className="flex items-center justify-center h-72">
            <div className="text-center">
              <Loader2 size={40} className="text-purple-600 animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Loading products…</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 px-5 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-600 text-base mb-2">No products available in this category yet</p>
            <p className="text-gray-400 text-xs">New items are added to this collection daily.</p>
          </div>
        ) : (
          <>
            {viewMode === "grid" ? (
              /* GRID VIEW */
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
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              /* LIST VIEW */
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
                      <ProductRow product={product} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Pagination Controls */}
            {totalProducts > 12 && (
              <div className="flex items-center justify-between border border-gray-200 bg-white px-4 py-3 sm:px-6 mt-10 rounded-xl shadow-sm">
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
          </>
        )}
      </div>
    </div>
  );
}