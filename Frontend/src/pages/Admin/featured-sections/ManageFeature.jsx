import React, { useState, useEffect, useMemo } from 'react';
import { Search, RotateCw, Download, ChevronDown } from 'lucide-react';
import api from '../../../lib/api'; // your api instance with corrected paths

const Feature = () => {
  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    style: 'Default',
    productTypes: 'New Added Products',
  });

  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [featureData, setFeatureData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [tableSearch, setTableSearch] = useState('');

  // ─── Data Fetching ────────────────────────────────────────────────
  const fetchFeatured = async () => {
    try {
      const res = await api.featured.getAll();
      setFeatureData(res.data || []);
    } catch (err) {
      console.error('Failed to fetch featured sections:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories?include_subcategories=false&include_inactive=true');
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchFeatured(), fetchCategories()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Sync category input clear with selected category reset
  useEffect(() => {
    if (!categoryInput.trim()) {
      setSelectedCategory('');
    }
  }, [categoryInput]);

  // ─── Filtered Categories for Search ──────────────────────────────
  const filteredCategories = useMemo(() => {
    if (!categoryInput.trim()) return categories;
    const term = categoryInput.toLowerCase();
    return categories.filter(c => c.name?.toLowerCase().includes(term));
  }, [categories, categoryInput]);

  // ─── Form Handlers ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.shortDescription.trim() || !selectedCategory) {
      alert('Please fill title, short description and select a category.');
      return;
    }

    setSubmitting(true);

    const payload = {
      title: formData.title.trim(),
      shortDescription: formData.shortDescription.trim(),
      style: formData.style,
      productTypes: formData.productTypes,
      categories: [selectedCategory], // array of category name for compatibility
    };

    try {
      if (editingId) {
        await api.featured.update(editingId, payload);
        alert('✅ Featured section updated successfully!');
      } else {
        await api.featured.create(payload);
        alert('✅ Featured section created successfully!');
      }

      // Reset form
      setFormData({
        title: '',
        shortDescription: '',
        style: 'Default',
        productTypes: 'New Added Products',
      });
      setSelectedCategory('');
      setCategoryInput('');
      setEditingId(null);

      await fetchFeatured();
    } catch (err) {
      console.error(err);
      alert('❌ ' + (err.response?.data?.message || err.message || 'Failed to process section'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      title: '',
      shortDescription: '',
      style: 'Default',
      productTypes: 'New Added Products',
    });
    setSelectedCategory('');
    setCategoryInput('');
    setEditingId(null);
  };

  const handleStartEdit = (item) => {
    setFormData({
      title: item.title || '',
      shortDescription: item.short_description || '',
      style: item.style || 'Default',
      productTypes: item.product_type || 'New Added Products',
    });
    setSelectedCategory(item.category_name || '');
    setCategoryInput(item.category_name || '');
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this featured section?')) {
      return;
    }

    try {
      await api.featured.delete(id);
      alert('✅ Featured section deleted successfully!');
      await fetchFeatured();
    } catch (err) {
      console.error(err);
      alert('❌ Failed to delete: ' + (err.response?.data?.message || err.message));
    }
  };

  // ─── Table Filtering ──────────────────────────────────────────────
  const filteredData = useMemo(() => {
    if (!tableSearch.trim()) return featureData;

    const term = tableSearch.toLowerCase();
    return featureData.filter(
      (item) =>
        item.title?.toLowerCase().includes(term) ||
        item.short_description?.toLowerCase().includes(term)
    );
  }, [featureData, tableSearch]);

  if (loading) {
    return (
      <div className="p-10 text-center text-lg text-slate-600">
        Loading Featured Sections & Categories...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">
          Manage Featured Sections
        </h2>
        <div className="text-sm text-gray-500">
          Home / <span className="text-slate-700 font-medium">Featured Sections</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Form */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-slate-700 mb-4 border-b pb-2">
              {editingId ? `Edit Featured Section (ID: ${editingId})` : 'Create Featured Section'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Summer Collection 2026"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Short Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Trending & exclusive items"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  required
                />
              </div>

              {/* Categories - searchable dropdown */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Categories <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={categoryInput}
                    onChange={(e) => {
                      setCategoryInput(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    onBlur={() => {
                      // Slight delay to allow clicking dropdown items
                      setTimeout(() => setIsDropdownOpen(false), 200);
                    }}
                    placeholder="Type to search and select categories"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition text-sm text-gray-800"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-400">
                    <ChevronDown size={18} />
                  </div>
                </div>

                {isDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCategories.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        No categories found
                      </div>
                    ) : (
                      filteredCategories.map((cat) => {
                        const isSelected = selectedCategory === cat.name;
                        return (
                          <div
                            key={cat.id}
                            onMouseDown={() => {
                              setSelectedCategory(cat.name);
                              setCategoryInput(cat.name);
                              setIsDropdownOpen(false);
                            }}
                            className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-blue-600 text-white font-semibold'
                                : 'text-slate-600 hover:bg-blue-600 hover:text-white'
                            }`}
                          >
                            {cat.name}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Style
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  value={formData.style}
                  onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                >
                  <option value="Default">Default</option>
                </select>
              </div>

              {/* Product Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Product Types
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm text-gray-800"
                  value={formData.productTypes}
                  onChange={(e) => setFormData({ ...formData, productTypes: e.target.value })}
                >
                  <option value="New Added Products">New Added Products</option>
                  <option value="All Products">All Products</option>
                  <option value="Featured Products">Featured Products</option>
                  <option value="Best Sellers">Best Sellers</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition shadow-sm"
                >
                  {editingId ? 'Cancel' : 'Reset'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 py-2.5 text-white font-medium rounded-lg transition shadow-sm ${
                    submitting
                      ? 'bg-green-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Section' : 'Create Featured Section'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT: Table */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-slate-700">Featured Sections</h3>
            </div>

            <div className="p-4 flex flex-wrap gap-3 justify-end bg-gray-50">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search title or description..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64 transition"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              </div>
              <button className="p-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition">
                <RotateCw size={18} />
              </button>
              <button className="p-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition">
                <Download size={18} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-slate-600 font-semibold">
                  <tr>
                    <th className="px-6 py-4 text-left">ID</th>
                    <th className="px-6 py-4 text-left">TITLE</th>
                    <th className="px-6 py-4 text-left">DESCRIPTION</th>
                    <th className="px-6 py-4 text-left">STYLE</th>
                    <th className="px-6 py-4 text-left">CATEGORIES</th>
                    <th className="px-6 py-4 text-left">PRODUCT TYPE</th>
                    <th className="px-6 py-4 text-left">DATE</th>
                    <th className="px-6 py-4 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-16 text-center text-gray-500">
                        No featured sections found
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => (
                      <tr key={item.id} className="border-t hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">{item.id}</td>
                        <td className="px-6 py-4 font-medium text-indigo-700">{item.title}</td>
                        <td className="px-6 py-4 max-w-md truncate">{item.short_description}</td>
                        <td className="px-6 py-4">{item.style || '—'}</td>
                        <td className="px-6 py-4">{item.category_name || '—'}</td>
                        <td className="px-6 py-4">{item.product_type || '—'}</td>
                        <td className="px-6 py-4 text-gray-600">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString('en-GB')
                            : '—'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(item)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-md shadow-sm transition"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-md shadow-sm transition"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 text-xs text-gray-500 bg-gray-50 border-t">
              Showing {filteredData.length} of {featureData.length} entries
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feature;
