import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GripVertical, RotateCcw, Save, Loader2, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';
import api, { BACKEND_URL } from '../../../lib/api.js';

const BASE_URL = BACKEND_URL;

export default function CategoriesOrder() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });

  const dragItem = useRef(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 3500);
  };

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      // Flat list of all categories (including inactive) sorted by current row_order
      const res = await api.get('/categories?include_inactive=true&include_subcategories=false');
      const raw = res.data.categories || [];
      const sorted = [...raw].sort((a, b) => (a.row_order ?? 0) - (b.row_order ?? 0));
      setCategories(sorted);
    } catch (err) {
      showToast('error', 'Failed to load categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // ── Drag & Drop ─────────────────────────────────────────────
  const handleDragStart = (index) => { dragItem.current = index; };

  const handleDragEnter = (index) => {
    if (dragItem.current === index) return;
    const copy = [...categories];
    const dragged = copy.splice(dragItem.current, 1)[0];
    copy.splice(index, 0, dragged);
    dragItem.current = index;
    setCategories(copy);
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    saveOrder();
  };

  // ── Save order ───────────────────────────────────────────────
  const saveOrder = async () => {
    if (!categories || categories.length === 0) return;
    setSaving(true);
    try {
      const order = categories.map((cat, idx) => ({ id: cat.id, row_order: idx }));
      await api.post('/categories/reorder', { order });
      showToast('success', 'Category order saved & updated everywhere!');
    } catch (err) {
      console.error('Failed to save categories order:', err);
      showToast('error', err.response?.data?.message || 'Failed to save order');
    } finally {
      setSaving(false);
    }
  };

  const getImageUrl = (cat) => {
    const raw = cat.imageUrl || cat.image;
    if (!raw) return null;
    return raw.startsWith('http') ? raw : `${BASE_URL}${raw.startsWith('/') ? '' : '/'}${raw}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#42526e]">Manage Categories Order</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Home</span>
          <span>/</span>
          <span className="text-purple-600 font-medium">Categories Order</span>
        </div>
      </div>

      {/* Toast */}
      {toast.message && (
        <div className={`flex items-center gap-3 p-4 rounded-lg border text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Panel Header */}
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-[#42526e] font-bold uppercase tracking-wider text-sm">
            Drag to reorder categories
          </h3>
          <div className="flex gap-2">
            <button
              onClick={fetchCategories}
              className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={saveOrder}
              disabled={saving || loading}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Save Order
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 rounded-lg text-[#42526e] font-bold text-xs uppercase tracking-wide mb-2">
            <div className="col-span-1 text-center">⠿</div>
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-2">Image</div>
            <div className="col-span-5">Category Name</div>
            <div className="col-span-3">Status</div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-400">
              <Loader2 size={28} className="animate-spin mx-auto mb-3" />
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div className="py-16 text-center text-gray-400 italic">No categories found.</div>
          ) : (
            <div className="space-y-1">
              {categories.map((cat, index) => {
                const imgUrl = getImageUrl(cat);
                return (
                  <div
                    key={cat.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className="grid grid-cols-12 gap-4 px-4 py-4 items-center border border-gray-100 rounded-lg bg-white hover:bg-purple-50/30 hover:border-purple-200 transition-all cursor-grab active:cursor-grabbing active:shadow-md active:scale-[1.01] select-none"
                  >
                    {/* Drag handle */}
                    <div className="col-span-1 flex justify-center text-gray-300 hover:text-purple-400">
                      <GripVertical size={20} />
                    </div>

                    {/* Row number */}
                    <div className="col-span-1 text-center text-xs font-bold text-gray-400">
                      {index + 1}
                    </div>

                    {/* Image */}
                    <div className="col-span-2">
                      <div className="w-14 h-14 border border-gray-100 rounded-lg overflow-hidden bg-white shadow-sm flex items-center justify-center p-1">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={cat.name}
                            className="w-full h-full object-contain"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <ImageIcon size={20} className="text-gray-300" />
                        )}
                      </div>
                    </div>

                    {/* Name */}
                    <div className="col-span-5">
                      <p className="text-[#42526e] font-bold text-sm">
                        {cat.name}
                      </p>
                      {cat.parent_id ? (
                        <p className="text-gray-400 text-[11px] mt-0.5">Sub-category</p>
                      ) : null}
                    </div>

                    {/* Status */}
                    <div className="col-span-3">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-md shadow-sm uppercase ${
                        cat.status === 1
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {cat.status === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}