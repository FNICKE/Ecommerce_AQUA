import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowRight } from 'lucide-react';
import { useWishlistStore } from '../store/wishlistStore';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

const Wishlist = () => {
  const { wishlistItems: wishlist, fetchWishlist, loading } = useWishlistStore();

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  if (loading && wishlist.length === 0) {
    return <Loader fullScreen />;
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-16">
      {/* ── Breadcrumb ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <nav className="flex items-center text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-gray-900 transition no-underline">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Wishlist</span>
        </nav>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Top Header Row */}
        <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900 m-0 tracking-tight flex items-center gap-2">
              <Heart size={24} className="fill-purple-600 text-purple-600" />
              My Wishlist
            </h1>
            <p className="text-sm text-gray-500 mt-1">{wishlist.length} Items Saved</p>
          </div>
        </div>

        {/* Wishlist Grid or Empty State */}
        {wishlist.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 px-5 bg-white rounded-xl border border-gray-250"
          >
            <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-6">
              <Heart size={32} className="text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-500 mb-8 text-sm">Explore our collection and add your favorite spices!</p>
            <Link 
              to="/products"
              className="inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white px-6 py-3 rounded-lg font-bold transition-colors no-underline text-sm"
            >
              Explore Products <ArrowRight size={16} />
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            <AnimatePresence mode="popLayout">
              {wishlist.map((product, i) => (
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
        )}
      </div>
    </div>
  );
};

export default Wishlist;
