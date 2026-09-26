// src/pages/Categories.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { BACKEND_URL } from '../lib/api';
import Loader from '../components/Loader';
import { AlertCircle, ArrowRight, ChevronDown, Sparkles, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '../lib/imageUrl';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);

  // Set your base URL dynamically
  const IMAGE_BASE_URL = BACKEND_URL;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/categories');
        setCategories(res.data.categories || []);
      } catch (err) {
        console.error('Categories fetch error:', err);
        setError('We couldn’t load the categories. Please try refreshing.');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const toggleSubcategories = (catId) => {
    setExpandedCategory(expandedCategory === catId ? null : catId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fc]">
        <Loader />
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-gray-400 font-medium"
        >
          Loading collections...
        </motion.p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc] px-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="text-red-500" size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-purple-700 text-white rounded-xl font-bold hover:bg-purple-800 transition-all shadow-sm cursor-pointer text-xs md:text-sm"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fc] min-h-screen pb-16">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <nav className="flex items-center text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-gray-900 transition">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Categories</span>
        </nav>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10 flex flex-col gap-10">
          
          {/* Page Header */}
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full mb-4">
              <Sparkles size={12} /> Explore Collections
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 leading-tight">
              Browse <span className="text-purple-700">Categories</span>
            </h1>
            <p className="text-gray-500 text-xs md:text-sm leading-relaxed max-w-2xl mt-2">
              Discover our premium selections of aquatic plants, tropical fish, custom aquascapes, and professional aquarium supplies.
            </p>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-16 bg-[#f8f9fc] rounded-2xl border border-gray-100">
              <ShoppingBag className="mx-auto text-purple-300 mb-4" size={48} />
              <p className="text-lg font-bold text-gray-400">Restocking our shelves...</p>
              <p className="text-xs text-gray-400 mt-1">New collections are arriving soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 pt-10 border-t border-gray-100">
              {categories.map((cat, index) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="group flex flex-col h-full bg-white rounded-2xl border border-gray-200/80 overflow-hidden hover:shadow-md transition-all duration-300"
                >
                  {/* Category Image Card */}
                  <div className="relative h-60 overflow-hidden">
                    <img
                      src={getImageUrl(cat.imageUrl || cat.image || cat.bannerUrl || cat.banner)}
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => (e.target.src = '/placeholder-category.jpg')}
                    />
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                      <h3 className="text-xl md:text-2xl font-extrabold text-white mb-3 tracking-tight">
                        {cat.name}
                      </h3>
                      <Link
                        to={`/category/${cat.id}`}
                        className="inline-flex items-center justify-center gap-1.5 bg-white text-purple-950 font-bold px-4 py-2 rounded-lg hover:bg-purple-50 transition-all w-fit group/btn text-xs md:text-sm shadow-sm"
                      >
                        Browse All
                        <ArrowRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>

                  {/* Subcategories Section */}
                  {cat.subcategories?.length > 0 && (
                    <div className="flex-grow flex flex-col bg-[#f8f9fc]">
                      <button
                        onClick={() => toggleSubcategories(cat.id)}
                        className={`w-full flex items-center justify-between p-4 text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors ${
                          expandedCategory === cat.id ? 'text-purple-700 bg-purple-50/50' : 'text-gray-500 hover:text-purple-600'
                        }`}
                      >
                        <span>Subcategories ({cat.subcategories.length})</span>
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-300 ${expandedCategory === cat.id ? 'rotate-180' : ''}`}
                        />
                      </button>

                      <AnimatePresence>
                        {expandedCategory === cat.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-white border-t border-gray-100"
                          >
                            <ul className="p-2 space-y-1">
                              {cat.subcategories.map((sub) => (
                                <li key={sub.id}>
                                  <Link
                                    to={`/category/${sub.id}`}
                                    className="flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-all group/sub"
                                  >
                                    {sub.name}
                                    <ArrowRight size={12} className="opacity-0 -translate-x-1.5 group-hover/sub:opacity-100 group-hover/sub:translate-x-0 transition-all text-purple-700" />
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}