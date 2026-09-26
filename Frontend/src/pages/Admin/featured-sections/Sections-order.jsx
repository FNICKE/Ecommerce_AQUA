import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GripVertical, RotateCcw, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../../lib/api';

export default function SectionsOrder() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });

  const dragItem = useRef(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 3500);
  };

  const fetchSections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.featured.getAll();
      // The API returns rows directly. Sort them by the current `order` column
      const raw = res.data || [];
      const sorted = [...raw].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setSections(sorted);
    } catch (err) {
      showToast('error', 'Failed to load featured sections');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  // ── Drag & Drop handlers ───────────────────────────────────────
  const handleDragStart = (index) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index) => {
    if (dragItem.current === index) return;
    const copy = [...sections];
    const dragged = copy.splice(dragItem.current, 1)[0];
    copy.splice(index, 0, dragged);
    dragItem.current = index;
    setSections(copy);
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    saveOrder();
  };

  // ── Save order ───────────────────────────────────────────────
  const saveOrder = async () => {
    if (!sections || sections.length === 0) return;
    setSaving(true);
    try {
      const ids = sections.map((sec) => sec.id);
      await api.featured.reorder(ids);
      showToast('success', 'Section order saved & updated everywhere!');
    } catch (err) {
      console.error('Failed to save featured sections order:', err);
      showToast('error', err.response?.data?.message || 'Failed to save order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#42526e]">Manage Section Order</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Home</span>
          <span>/</span>
          <span className="text-purple-600 font-medium">Section Order</span>
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
            Drag to reorder home page sections
          </h3>
          <div className="flex gap-2">
            <button
              onClick={fetchSections}
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
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 rounded-lg text-[#42526e] font-bold text-xs uppercase tracking-wide mb-2">
            <div className="col-span-1 text-center">⠿</div>
            <div className="col-span-1 text-center">No.</div>
            <div className="col-span-4">Section Title</div>
            <div className="col-span-3">Style</div>
            <div className="col-span-3">Category / Product Type</div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-400">
              <Loader2 size={28} className="animate-spin mx-auto mb-3" />
              Loading sections...
            </div>
          ) : sections.length === 0 ? (
            <div className="py-16 text-center text-gray-400 italic">No featured sections found.</div>
          ) : (
            <div className="space-y-1">
              {sections.map((sec, index) => {
                return (
                  <div
                    key={sec.id}
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

                    {/* Section Title */}
                    <div className="col-span-4">
                      <p className="text-[#42526e] font-bold text-sm">
                        {sec.title}
                      </p>
                      {sec.short_description ? (
                        <p className="text-gray-400 text-xs truncate max-w-xs mt-0.5">
                          {sec.short_description}
                        </p>
                      ) : null}
                    </div>

                    {/* Style */}
                    <div className="col-span-3">
                      <span className="text-[10px] font-bold px-3 py-1 rounded-md shadow-sm uppercase bg-blue-50 text-blue-600 border border-blue-100">
                        {sec.style || 'Default'}
                      </span>
                    </div>

                    {/* Target info */}
                    <div className="col-span-3 text-xs font-medium text-gray-500">
                      {sec.category_name ? (
                        <span className="bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded font-semibold text-[10px] uppercase">
                          Category: {sec.category_name}
                        </span>
                      ) : sec.product_type ? (
                        <span className="bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded font-semibold text-[10px] uppercase">
                          Type: {sec.product_type}
                        </span>
                      ) : (
                        <span className="text-gray-300 italic">None</span>
                      )}
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