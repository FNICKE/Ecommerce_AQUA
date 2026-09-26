import React, { useState } from 'react';
import { Heart, ShoppingBag, Loader2, Star, X } from 'lucide-react';
import { Link } from 'react-router-dom';
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

export default function ProductCard({ product }) {
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
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200">
        {/* IMAGE AREA */}
        <div className="relative bg-white">
          {/* Heart */}
          <button
            onClick={handleWishlist}
            className="absolute top-2 left-2 z-10 bg-transparent border-none cursor-pointer"
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
            onClick={handleCart}
            disabled={isAdding || product.stock <= 0}
            className="mt-3 w-full py-2 rounded text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-opacity border-none cursor-pointer"
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