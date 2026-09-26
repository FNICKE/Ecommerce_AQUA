import React, { useState, useEffect } from 'react';
import {
  RotateCw, Upload, Trash2, CheckCircle, AlertCircle,
  PencilLine, X, ToggleLeft, ToggleRight, Plus, ImageOff
} from 'lucide-react';
import api from '../../../lib/api';
import { getImageUrl } from '../../../lib/imageUrl';
import MediaLibraryModal from '../../../components/MediaLibraryModal';

/* ─── empty form state ─────────────────────────────────────────────────── */
const EMPTY_FORM = {
  type: 'all',
  type_id: '',
  title: '',
  min_discount: '',
  max_discount: '',
  link: '',
  image: '',
  is_active: true,
};

const Offer = () => {
  const [offers,     setOffers]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [feedback,   setFeedback]   = useState({ type: '', message: '' });
  const [editingId,  setEditingId]  = useState(null); // null = add mode, number = edit mode
  const [formData,   setFormData]   = useState(EMPTY_FORM);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  /* ── fetch on mount ──────────────────────────────────────────────── */
  useEffect(() => {
    fetchOffers();
    fetchCategories();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/offers/admin');
      if (res.data.success) setOffers(res.data.offers || []);
    } catch (err) {
      console.error('fetchOffers error:', err);
      showFeedback('error', err.response?.data?.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories?include_subcategories=false');
      if (res.data.success) setCategories(res.data.categories || []);
    } catch (err) {
      console.error('fetchCategories error:', err);
    }
  };

  /* ── feedback helper ────────────────────────────────────────────── */
  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  /* ── media modal ────────────────────────────────────────────────── */
  const handleSelectMedia = (item) => {
    // MediaLibraryModal returns { id, path, name, url }
    // path is already combined (e.g. /uploads/media/2026/05/image.jpg)
    const imagePath = item.path || item.imagePath || item.url || '';
    setFormData(f => ({ ...f, image: imagePath }));
    setShowMediaModal(false);
  };

  /* ── form field change ──────────────────────────────────────────── */
  const handleChange = (key, value) => {
    setFormData(f => ({
      ...f,
      [key]: value,
      ...(key === 'type' ? { type_id: '' } : {}),
    }));
  };

  /* ── start editing ──────────────────────────────────────────────── */
  const startEdit = (offer) => {
    setEditingId(offer.id);
    setFormData({
      type:         offer.type || 'all',
      type_id:      offer.type_id || '',
      title:        offer.title || '',
      min_discount: offer.min_discount || '',
      max_discount: offer.max_discount || '',
      link:         offer.link || '',
      image:        offer.image || '',
      is_active:    offer.is_active === 1 || offer.is_active === true,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── cancel form ────────────────────────────────────────────────── */
  const cancelEdit = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  /* ── submit (add or update) ─────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image) return showFeedback('error', 'Please select an image');

    const payload = {
      type:         formData.type,
      type_id:      formData.type_id || null,
      title:        formData.title || null,
      min_discount: formData.min_discount || 0,
      max_discount: formData.max_discount || 0,
      link:         formData.link || null,
      image:        formData.image,
      is_active:    formData.is_active ? 1 : 0,
    };

    try {
      setSaving(true);
      if (editingId) {
        const res = await api.put(`/offers/admin/${editingId}`, payload);
        if (res.data.success) {
          showFeedback('success', 'Offer updated successfully');
          cancelEdit();
          fetchOffers();
        }
      } else {
        const res = await api.post('/offers/admin', payload);
        if (res.data.success) {
          showFeedback('success', 'Offer added successfully');
          setFormData(EMPTY_FORM);
          fetchOffers();
        }
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to save offer');
    } finally {
      setSaving(false);
    }
  };

  /* ── toggle active status ───────────────────────────────────────── */
  const handleToggle = async (id) => {
    try {
      await api.patch(`/offers/admin/${id}/toggle`);
      setOffers(prev =>
        prev.map(o =>
          o.id === id
            ? { ...o, is_active: o.is_active === 1 ? 0 : 1 }
            : o
        )
      );
    } catch (err) {
      showFeedback('error', 'Failed to toggle offer status');
    }
  };

  /* ── delete ─────────────────────────────────────────────────────── */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this offer permanently?')) return;
    try {
      setDeletingId(id);
      const res = await api.delete(`/offers/admin/${id}`);
      if (res.data.success) {
        showFeedback('success', 'Offer deleted');
        setOffers(prev => prev.filter(o => o.id !== id));
        if (editingId === id) cancelEdit();
      }
    } catch (err) {
      showFeedback('error', 'Failed to delete offer');
    } finally {
      setDeletingId(null);
    }
  };

  /* ── render ──────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-6 p-2">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-700">
          {editingId ? 'Edit Offer' : 'Upload Offer Images'}
        </h2>
        <div className="text-sm text-gray-500">
          Home / <span className="text-slate-700">Offers</span>
        </div>
      </div>

      {/* Feedback toast */}
      {feedback.message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 border ${
          feedback.type === 'success'
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="font-medium">{feedback.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── LEFT: Form ─────────────────────────────────────────────── */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Form header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b bg-gray-50/60">
              <div className="flex items-center gap-2 font-semibold text-sm text-slate-700">
                {editingId ? <PencilLine size={16} className="text-purple-600" /> : <Plus size={16} className="text-purple-600" />}
                {editingId ? `Editing Offer #${editingId}` : 'Add New Offer'}
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 border border-gray-200 rounded-lg px-2.5 py-1 transition-colors"
                >
                  <X size={13} /> Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">

              {/* Offer Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Offer Type <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none text-gray-700 text-sm"
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  required
                >
                  <option value="all">Direct URL (No Category/Product)</option>
                  <option value="categories">Link to Category</option>
                  <option value="products">Link to Products</option>
                </select>
              </div>

              {/* Category select (shown when type === 'categories') */}
              {formData.type === 'categories' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Select Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-300 outline-none text-gray-700 text-sm"
                    value={formData.type_id}
                    onChange={(e) => handleChange('type_id', e.target.value)}
                    required
                  >
                    <option value="">Choose Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Offer Title / Label</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g. Summer Sale"
                />
              </div>

              {/* Discount Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-purple-400"
                    value={formData.min_discount}
                    onChange={(e) => handleChange('min_discount', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-purple-400"
                    value={formData.max_discount}
                    onChange={(e) => handleChange('max_discount', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Target URL / Link</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-purple-400"
                  value={formData.link}
                  onChange={(e) => handleChange('link', e.target.value)}
                  placeholder="https://... or /products"
                />
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Offer Image <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {formData.image ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                      <img
                        src={getImageUrl(formData.image)}
                        alt="Preview"
                        className="w-full h-28 object-cover"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                      <button
                        type="button"
                        onClick={() => handleChange('image', '')}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-28 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-gray-400">
                      <div className="text-center">
                        <ImageOff size={24} className="mx-auto mb-1 opacity-40" />
                        <span className="text-xs">No image selected</span>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowMediaModal(true)}
                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 p-3 rounded-xl text-gray-500 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50/50 transition-all text-sm"
                  >
                    <Upload size={16} />
                    {formData.image ? 'Change Image' : 'Select from Media Library'}
                  </button>
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleChange('is_active', !formData.is_active)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    formData.is_active ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.is_active ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
                <span className="text-sm text-gray-600">
                  {formData.is_active ? 'Active (visible on site)' : 'Inactive (hidden from site)'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-sm text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving && <RotateCw size={15} className="animate-spin" />}
                  {editingId ? 'Update Offer' : 'Add Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── RIGHT: Offers table ───────────────────────────────────── */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Table header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b bg-gray-50/60">
              <h3 className="font-semibold text-sm text-slate-700">
                All Offers ({offers.length})
              </h3>
              <button
                onClick={fetchOffers}
                className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                title="Refresh"
              >
                <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
                    <th className="px-4 py-3 border-b">#</th>
                    <th className="px-4 py-3 border-b">Image</th>
                    <th className="px-4 py-3 border-b">Title / Type</th>
                    <th className="px-4 py-3 border-b">Discount</th>
                    <th className="px-4 py-3 border-b">Link</th>
                    <th className="px-4 py-3 border-b text-center">Status</th>
                    <th className="px-4 py-3 border-b text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-16 text-gray-400">
                        <RotateCw size={28} className="animate-spin mx-auto mb-2 text-purple-300" />
                        <p className="text-xs">Loading offers…</p>
                      </td>
                    </tr>
                  ) : offers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-20 text-gray-400">
                        <ImageOff size={36} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No offers yet. Add your first offer!</p>
                      </td>
                    </tr>
                  ) : (
                    offers.map(item => (
                      <tr
                        key={item.id}
                        className={`hover:bg-gray-50/80 transition-colors ${
                          editingId === item.id ? 'bg-purple-50 ring-1 ring-inset ring-purple-200' : ''
                        }`}
                      >
                        {/* ID */}
                        <td className="px-4 py-3 font-semibold text-gray-400 text-xs">#{item.id}</td>

                        {/* Image */}
                        <td className="px-4 py-3">
                          <div className="h-12 w-24 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                            {item.image ? (
                              <img
                                src={getImageUrl(item.image)}
                                alt="offer"
                                className="h-full w-full object-cover"
                                onError={e => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-gray-300">
                                <ImageOff size={18} />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Title / type */}
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-800 text-sm mb-0.5 truncate max-w-[120px]">
                            {item.title || '—'}
                          </p>
                          <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">
                            {item.type}
                            {item.type_id ? ` #${item.type_id}` : ''}
                            {item.category_name ? ` (${item.category_name})` : ''}
                          </span>
                        </td>

                        {/* Discount */}
                        <td className="px-4 py-3 font-semibold text-green-600 text-sm">
                          {item.min_discount > 0 && item.max_discount > 0
                            ? `${item.min_discount}% – ${item.max_discount}%`
                            : item.max_discount > 0
                            ? `${item.max_discount}%`
                            : '—'}
                        </td>

                        {/* Link */}
                        <td className="px-4 py-3 max-w-[120px]">
                          {item.link ? (
                            <span
                              className="text-xs text-blue-600 truncate block hover:underline cursor-pointer"
                              title={item.link}
                            >
                              {item.link}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>

                        {/* Status toggle */}
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggle(item.id)}
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                              item.is_active
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {item.is_active
                              ? <><ToggleRight size={14} /> Active</>
                              : <><ToggleLeft size={14} /> Inactive</>
                            }
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => startEdit(item)}
                              className="p-1.5 text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <PencilLine size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={deletingId === item.id}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingId === item.id
                                ? <RotateCw size={16} className="animate-spin" />
                                : <Trash2 size={16} />
                              }
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live preview hint */}
          {offers.length > 0 && (
            <p className="text-xs text-gray-400 mt-3 text-right">
              Changes reflect instantly on the{' '}
              <a href="/offers" target="_blank" className="text-purple-500 hover:underline">
                Offers page
              </a>{' '}
              and{' '}
              <a href="/" target="_blank" className="text-purple-500 hover:underline">
                Home page
              </a>.
            </p>
          )}
        </div>
      </div>

      {/* Media Library Modal */}
      <MediaLibraryModal
        open={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onSelect={handleSelectMedia}
      />
    </div>
  );
};

export default Offer;