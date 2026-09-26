import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import { getImageUrl } from '../../lib/imageUrl';
import { Upload, Search, Edit3, Trash2, MoreVertical, X, RefreshCw, Download, Eye, EyeOff, ChevronDown } from 'lucide-react';

export default function ProductStock() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingVariant, setEditingVariant] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalVariants, setTotalVariants] = useState(0);
  const [totalStock, setTotalStock] = useState(0);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1); // Reset to page 1 on new search
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page to 1 on category filter change
  useEffect(() => {
    setPage(1);
  }, [selectedCategory]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/products-stock', {
        params: {
          categoryId: selectedCategory === 'all' ? undefined : selectedCategory,
          search: debouncedSearchQuery || undefined,
          page,
          limit: 15
        }
      });
      setProducts(response.data.data || []);
      setTotalProducts(response.data.total || 0);
      setTotalVariants(response.data.totalVariants || 0);
      setTotalStock(response.data.totalStock || 0);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      setProducts([]);
      setTotalProducts(0);
      setTotalVariants(0);
      setTotalStock(0);
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategory, debouncedSearchQuery]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/admin/categories');
        setCategories(res.data || []);
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products when page/filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products; // Already filtered and paginated on server side!

  // Handle stock update
  const handleSaveStock = async (variantId) => {
    if (!newStock || isNaN(newStock)) {
      alert('Please enter a valid stock number');
      return;
    }

    try {
      setEditLoading(true);
      const response = await api.put(`/admin/variants/${variantId}/stock`, {
        stock: parseInt(newStock)
      });

      if (response.data.success) {
        // Update the product in state
        const updatedProducts = products.map(product => {
          const updatedVariants = product.variants.map(variant => {
            if (variant.id === variantId) {
              return { ...variant, stock: parseInt(newStock) };
            }
            return variant;
          });
          
          const totalStock = updatedVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
          return {
            ...product,
            variants: updatedVariants,
            total_stock: totalStock
          };
        });

        setProducts(updatedProducts);
        setEditingVariant(null);
        setNewStock('');
        alert('Stock updated successfully!');
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingVariant(null);
    setNewStock('');
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchProducts();
  };

  // Export to CSV
  const handleExport = () => {
    let csv = 'Product Name,Variant ID,SKU,Stock,Price\n';
    
    filteredProducts.forEach(product => {
      product.variants.forEach(variant => {
        csv += `"${product.name}",${variant.id},"${variant.sku || 'N/A'}",${variant.stock},${variant.price}\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-stock-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Products Stock</h1>
            <nav className="text-sm text-gray-500 mt-2">
              <span>Home</span>
              <span className="mx-2">/</span>
              <span>Product Stock</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="space-y-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              FILTER BY PRODUCT CATEGORY
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Search & Toolbar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>

            <button
              onClick={handleExport}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Download"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Loading products...</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <p className="text-gray-500 text-lg">No matching records found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg overflow-hidden shadow">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">PRODUCT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">VARIANT ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">STOCK</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">PRICE</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, idx) => (
                    product.variants && product.variants.length > 0 ? (
                      product.variants.map((variant, vIdx) => (
                        <tr key={`${product.id}-${variant.id}`} className="border-b border-gray-200 hover:bg-gray-50">
                          {vIdx === 0 && (
                            <td rowSpan={product.variants.length} className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={getImageUrl(product.image)}
                                  alt={product.name}
                                  className="w-10 h-10 rounded object-cover"
                                  onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"%3E%3Cpath stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /%3E%3C/svg%3E'}
                                />
                                <div>
                                  <p className="font-medium text-gray-900">{product.name}</p>
                                  <p className="text-sm text-gray-500">{product.category_name || 'N/A'}</p>
                                </div>
                              </div>
                            </td>
                          )}
                          <td className="px-6 py-4 text-sm text-gray-900">#{variant.id}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{variant.sku || '-'}</td>
                          <td className="px-6 py-4">
                            {editingVariant?.id === variant.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={newStock}
                                  onChange={(e) => setNewStock(e.target.value)}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                  min="0"
                                />
                                <button
                                  onClick={() => handleSaveStock(variant.id)}
                                  disabled={editLoading}
                                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
                                >
                                  {editLoading ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${variant.stock <= 5 ? 'text-red-600' : 'text-gray-900'}`}>
                                  {variant.stock}
                                </span>
                                {variant.stock <= 5 && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Low</span>}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">₹{variant.price}</td>
                          <td className="px-6 py-4 text-center">
                            {editingVariant?.id !== variant.id && (
                              <button
                                onClick={() => {
                                  setEditingVariant(variant);
                                  setNewStock(variant.stock.toString());
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                              >
                                <Edit3 className="w-4 h-4" />
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr key={product.id} className="border-b border-gray-200">
                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                          No variants for this product
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalProducts > 15 && (() => {
              const totalPages = Math.ceil(totalProducts / 15);
              return (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={page === totalPages}
                      className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(page - 1) * 15 + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(page * 15, totalProducts)}</span> of{' '}
                        <span className="font-medium">{totalProducts}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                          onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                          disabled={page === 1}
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronDown className="rotate-90 text-gray-500" size={16} />
                        </button>
                        {Array.from({ length: totalPages }).map((_, idx) => {
                          const pageNum = idx + 1;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 ${
                                page === pageNum
                                  ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                  : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={page === totalPages}
                          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"
                        >
                          <span className="sr-only">Next</span>
                          <ChevronDown className="-rotate-90 text-gray-500" size={16} />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Summary */}
        {filteredProducts.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Total Variants</p>
              <p className="text-2xl font-bold text-gray-900">{totalVariants}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Total Stock</p>
              <p className="text-2xl font-bold text-gray-900">{totalStock}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
