import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, RotateCcw, ChevronDown,
  Star, Loader2, Trash2, CheckCircle, AlertCircle, ToggleLeft, ToggleRight,
  Edit3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';
import { getImageUrl } from '../../../lib/imageUrl';

export default function ManageProducts() {
  const navigate = useNavigate();

  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast]         = useState({ type: '', message: '' });
  const [togglingId, setTogglingId] = useState(null);   // tracks which row is toggling
  const [deletingId, setDeletingId] = useState(null);   // tracks which row is being deleted

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  /* ── Toast ── */
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 3500);
  };

  const [totalCount, setTotalCount] = useState(0);

  /* ── Fetch products (including inactive) for admin view ── */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products?admin=true&limit=10&page=${currentPage}&search=${searchTerm}`);
      setProducts(res.data.products || []);
      setTotalCount(res.data.count || 0);
    } catch (err) {
      showToast('error', 'Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  /* ── Toggle Active/Inactive ── */
  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    setTogglingId(id);
    try {
      await api.patch(`/products/${id}/status`, { status: newStatus });
      // Optimistic UI update – flip the status locally
      setProducts(prev =>
        prev.map(p => p.id === id ? { ...p, status: newStatus } : p)
      );
      showToast('success', `Product ${newStatus === 1 ? 'activated ✅' : 'deactivated 🚫'}`);
    } catch (err) {
      console.error('Toggle status error:', err);
      showToast('error', err?.response?.data?.message || 'Failed to update status');
    } finally {
      setTogglingId(null);
    }
  };

  /* ── Delete (hard delete – removes from DB permanently) ── */
  const deleteProduct = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast('success', 'Product deleted');
    } catch (err) {
      console.error('Delete error:', err);
      showToast('error', err?.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  // Paginated list calculation
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const paginatedProducts = products;

  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#4e5e7a]">Manage Products</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalCount} products total
          </p>
        </div>
        <p className="text-sm text-gray-400">
          Home / <span className="text-purple-600">Products</span>
        </p>
      </div>

      {/* Toast */}
      {toast.message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-semibold shadow-sm ${
          toast.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle size={18} className="shrink-0" />
            : <AlertCircle size={18} className="shrink-0" />}
          {toast.message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">

        {/* Top Actions */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <button
            onClick={() => navigate('/admin/add-product')}
            className="bg-purple-600 text-white font-bold px-4 py-2.5 rounded-lg text-sm hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus size={16} /> Add Product
          </button>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search products..."
                className="border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none w-64 transition"
              />
            </div>
            <button
              onClick={fetchProducts}
              title="Refresh"
              className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-[#4e5e7a] font-bold border-b text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 w-14 text-center">ID</th>
                <th className="px-4 py-3.5 border-l">Image</th>
                <th className="px-4 py-3.5 border-l">Product</th>
                <th className="px-4 py-3.5 border-l">Price</th>
                <th className="px-4 py-3.5 border-l">Rating</th>
                <th className="px-4 py-3.5 border-l text-center">Active</th>
                <th className="px-4 py-3.5 border-l text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-gray-400">
                    <Loader2 size={28} className="animate-spin mx-auto mb-3 text-purple-400" />
                    <p className="text-sm font-medium">Loading products...</p>
                  </td>
                </tr>
              ) : paginatedProducts.length > 0 ? (
                paginatedProducts.map((product) => {
                  const isActive   = product.status === 1;
                  const isToggling = togglingId === product.id;
                  const isDeleting = deletingId === product.id;
                  const displayPrice = product.special_price > 0 ? product.special_price : product.price;

                  return (
                    <tr
                      key={product.id}
                      className={`border-b last:border-0 transition-colors text-gray-600 ${
                        !isActive ? 'bg-gray-50/60 opacity-70' : 'hover:bg-purple-50/30'
                      }`}
                    >
                      {/* ID */}
                      <td className="px-4 py-3.5 text-center font-medium text-gray-400 text-xs">
                        #{product.id}
                      </td>

                      {/* Image */}
                      <td className="px-4 py-3.5 border-l">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center">
                          <img
                            src={getImageUrl(product.image)}
                            alt={product.name}
                            className={`w-full h-full object-cover transition-all ${!isActive ? 'grayscale' : ''}`}
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml;utf8,<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" fill="%23f3f4f6"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="10" fill="%239ca3af">No Img</text></svg>';
                            }}
                          />
                        </div>
                      </td>

                      {/* Name + Category */}
                      <td className="px-4 py-3.5 border-l min-w-[200px]">
                        <p className="font-bold text-[#4e5e7a] text-[13px] uppercase tracking-wide leading-tight">
                          {product.name}
                        </p>
                        <p className="text-gray-400 font-medium text-xs mt-0.5 normal-case">
                          {product.category_name || 'Uncategorized'}
                        </p>
                        {!isActive && (
                          <span className="inline-block mt-1 text-[10px] font-black uppercase text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3.5 border-l">
                        {displayPrice > 0 ? (
                          <div>
                            <p className="font-bold text-gray-800">₹{Number(displayPrice).toLocaleString('en-IN')}</p>
                            {product.special_price > 0 && product.special_price < product.price && (
                              <p className="text-xs text-gray-400 line-through">₹{Number(product.price).toLocaleString('en-IN')}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Rating */}
                      <td className="px-4 py-3.5 border-l">
                        <div className="flex text-gray-200">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={13}
                              className={i < (product.rating_average || 0) ? 'text-amber-400 fill-amber-400' : ''} />
                          ))}
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium mt-0.5 block">
                          ({product.rating_count || 0} reviews)
                        </span>
                      </td>

                      {/* Toggle Status */}
                      <td className="px-4 py-3.5 border-l text-center">
                        <button
                          onClick={() => toggleStatus(product.id, product.status)}
                          disabled={isToggling}
                          title={isActive ? 'Click to Deactivate' : 'Click to Activate'}
                          className={`relative inline-flex items-center justify-center transition-all ${isToggling ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:scale-110'}`}
                        >
                          {isToggling ? (
                            <Loader2 size={24} className="animate-spin text-purple-400" />
                          ) : isActive ? (
                            <ToggleRight size={32} className="text-green-500" strokeWidth={1.5} />
                          ) : (
                            <ToggleLeft size={32} className="text-gray-300" strokeWidth={1.5} />
                          )}
                        </button>
                        <p className={`text-[10px] font-bold mt-0.5 ${isActive ? 'text-green-500' : 'text-gray-400'}`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 border-l text-center">
                        <button
                          onClick={() => navigate(`/admin/edit-product/${product.id}`)}
                          title="Edit Product"
                          className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-all mr-2 cursor-pointer inline-flex items-center justify-center align-middle hover:scale-105"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          disabled={isDeleting}
                          title="Delete Product"
                          className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 hover:text-red-700 transition-all disabled:opacity-50 disabled:cursor-wait inline-flex items-center justify-center align-middle hover:scale-105"
                        >
                          {isDeleting
                            ? <Loader2 size={15} className="animate-spin" />
                            : <Trash2 size={15} />
                          }
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-gray-400 italic bg-gray-50/50">
                    <div className="text-4xl mb-3">📦</div>
                    <p className="font-semibold text-gray-500">No products found</p>
                    {searchTerm && <p className="text-xs mt-1">Try a different search term</p>}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 bg-white px-4 py-3 sm:px-6 mt-4 rounded-xl">
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
                <p className="text-xs text-gray-400">
                  Showing <span className="font-semibold text-gray-700">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-semibold text-gray-700">
                    {Math.min(currentPage * itemsPerPage, totalCount)}
                  </span>{' '}
                  of <span className="font-semibold text-gray-700">{totalCount}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 cursor-pointer"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronDown className="rotate-90" size={16} />
                  </button>
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 text-xs font-semibold focus:z-20 cursor-pointer ${
                          currentPage === pageNum
                            ? 'z-10 bg-purple-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600'
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
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 cursor-pointer"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronDown className="-rotate-90" size={16} />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Footer count */}
        {!loading && products.length > 0 && (
          <p className="text-xs text-gray-400 mt-4 text-right">
            Showing {products.length} of {totalCount} products
          </p>
        )}
      </div>
    </div>
  );
}