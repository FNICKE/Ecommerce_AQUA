import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GripVertical, ChevronDown, RotateCcw, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../../lib/api';
import { getImageUrl, NO_IMAGE_SVG } from '../../../lib/imageUrl';

export default function ProductsOrder() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });

  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 3500);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/products?admin=true&limit=1000');
      const raw = res.data.products || res.data.data || res.data || [];
      // Sort by existing row_order so initial display respects saved order
      const sorted = [...raw].sort((a, b) => (a.row_order ?? 0) - (b.row_order ?? 0));
      setProducts(sorted);
    } catch (err) {
      showToast('error', 'Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ── Drag handlers ─────────────────────────────────────
  const handleDragStart = (index) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index) => {
    dragOverItem.current = index;
    // Visually shift items during drag
    const copy = [...products];
    const dragged = copy.splice(dragItem.current, 1)[0];
    copy.splice(index, 0, dragged);
    dragItem.current = index;
    setProducts(copy);
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    dragOverItem.current = null;
    saveOrder();
  };

  // ── Save order ────────────────────────────────────────
  const saveOrder = async () => {
    if (!products || products.length === 0) return;
    setSaving(true);
    try {
      const order = products.map((p, idx) => ({ id: p.id, row_order: idx }));
      await api.post('/admin/products/reorder', { order });
      showToast('success', 'Product order saved successfully & updated everywhere!');
    } catch (err) {
      console.error('Failed to save products order:', err);
      showToast('error', err.response?.data?.message || 'Failed to save order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#4e5e7a]">Manage Products Order</h2>
        <p className="text-sm text-gray-500">
          Home / <span className="text-purple-600">Products Order</span>
        </p>
      </div>

      {/* Toast */}
      {toast.message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 text-sm font-bold border ${
          toast.type === 'success'
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      {/* Products List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Panel Header */}
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-[#4e5e7a] font-bold uppercase tracking-wider text-sm">
            Drag to reorder products
          </h3>
          <div className="flex gap-2">
            <button
              onClick={fetchProducts}
              className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={saveOrder}
              disabled={saving || loading}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Save Order
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 rounded-lg text-[#4e5e7a] font-bold text-xs uppercase tracking-wide mb-2">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-1 text-center">Order</div>
            <div className="col-span-2">Image</div>
            <div className="col-span-5">Product Name</div>
            <div className="col-span-3">Status</div>
          </div>

          {/* Draggable List */}
          {loading ? (
            <div className="py-16 text-center text-gray-400">
              <Loader2 size={28} className="animate-spin mx-auto mb-3" />
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center text-gray-400 italic">No products found.</div>
          ) : (
            <div className="space-y-1">
              {products.map((item, index) => (
                <div
                  key={item.id}
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
                      <img
                        src={item.image ? getImageUrl(item.image) : NO_IMAGE_SVG}
                        alt={item.name}
                        className="w-full h-full object-contain"
                        onError={(e) => { e.target.src = NO_IMAGE_SVG; }}
                      />
                    </div>
                  </div>

                  {/* Name */}
                  <div className="col-span-5">
                    <p className="text-[#4e5e7a] font-bold uppercase text-xs tracking-wide leading-snug">
                      {item.name}
                    </p>
                    <p className="text-gray-400 font-medium text-[11px] mt-0.5 normal-case">
                      {item.category_name || 'Uncategorized'}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="col-span-3">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-md shadow-sm uppercase ${
                      item.status === 1
                        ? 'bg-[#71dd37] text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {item.status === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}