import React, { useState, useEffect, useCallback } from 'react';
import { 
  RotateCcw, ChevronDown, Loader2, 
  Trash2, Pencil, Check, X, CheckCircle, AlertCircle, Percent
} from 'lucide-react';
import api from '../../../lib/api';

export default function Taxes() {
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [percentage, setPercentage] = useState('');

  // Inline edit state
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPercentage, setEditPercentage] = useState('');

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 3500);
  };

  const fetchTaxes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/taxes');
      setTaxes(res.data.taxes || []);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to load taxes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTaxes();
  }, [fetchTaxes]);

  // ── Create ────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!percentage.trim()) return;
    setSaving(true);
    try {
      await api.post('/admin/taxes', { title, percentage });
      setTitle('');
      setPercentage('');
      showToast('success', 'Tax added successfully!');
      fetchTaxes();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to add tax');
    } finally {
      setSaving(false);
    }
  };

  // ── Update ────────────────────────────────────────────────
  const handleUpdate = async (id) => {
    if (!editPercentage.trim()) return;
    try {
      await api.put(`/admin/taxes/${id}`, { title: editTitle, percentage: editPercentage });
      setEditingId(null);
      showToast('success', 'Tax updated!');
      fetchTaxes();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to update tax');
    }
  };

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this tax rule?')) return;
    try {
      await api.delete(`/admin/taxes/${id}`);
      showToast('success', 'Tax deleted!');
      fetchTaxes();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to delete tax');
    }
  };

  const filtered = taxes.filter(t =>
    t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.percentage?.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#4e5e7a]">Manage Taxes</h2>
        <p className="text-sm text-gray-500">
          Home / <span className="text-purple-600">Tax</span>
        </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT: Add Tax Form */}
        <div className="lg:col-span-4">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-[#4e5e7a] mb-5 border-b pb-3">Add Tax Rule</h3>
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. GST 18%"
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">
                  Percentage <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={percentage}
                    onChange={e => setPercentage(e.target.value)}
                    required
                    placeholder="18"
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full border border-gray-200 rounded-lg p-2.5 pr-8 text-sm outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <Percent size={14} className="absolute right-3 top-3 text-gray-400" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setTitle(''); setPercentage(''); }}
                  className="flex-1 bg-amber-500 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-amber-600 transition-colors"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={saving || !percentage.trim()}
                  className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                  Add Tax
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT: Taxes Table */}
        <div className="lg:col-span-8">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between mb-6">
              <h3 className="font-bold text-[#4e5e7a] text-lg">All Tax Rules</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search taxes..."
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-purple-500 outline-none w-52"
                />
                <button
                  onClick={fetchTaxes}
                  className="p-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[#4e5e7a] font-bold border-b">
                  <tr>
                    <th className="px-4 py-4 w-16">
                      <div className="flex items-center gap-1">ID <ChevronDown size={12} className="text-blue-400" /></div>
                    </th>
                    <th className="px-4 py-4 border-l uppercase tracking-wider">Title</th>
                    <th className="px-4 py-4 border-l uppercase tracking-wider">Percentage</th>
                    <th className="px-4 py-4 border-l uppercase tracking-wider">Status</th>
                    <th className="px-4 py-4 border-l uppercase tracking-wider text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-gray-400">
                        <Loader2 size={22} className="animate-spin mx-auto mb-2" />
                        Loading taxes...
                      </td>
                    </tr>
                  ) : filtered.length > 0 ? (
                    filtered.map(tax => (
                      <tr key={tax.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 text-gray-500 font-medium">{tax.id}</td>

                        {/* Title cell – editable */}
                        <td className="px-4 py-4 border-l">
                          {editingId === tax.id ? (
                            <input
                              value={editTitle}
                              onChange={e => setEditTitle(e.target.value)}
                              className="w-full border border-purple-300 rounded px-2 py-1 text-sm outline-none"
                              placeholder="Title"
                            />
                          ) : (
                            <span className="font-medium text-[#4e5e7a]">{tax.title || <span className="text-gray-400 italic">No title</span>}</span>
                          )}
                        </td>

                        {/* Percentage cell – editable */}
                        <td className="px-4 py-4 border-l">
                          {editingId === tax.id ? (
                            <div className="relative w-28">
                              <input
                                type="number"
                                value={editPercentage}
                                onChange={e => setEditPercentage(e.target.value)}
                                className="w-full border border-purple-300 rounded px-2 py-1 pr-6 text-sm outline-none"
                              />
                              <span className="absolute right-2 top-1.5 text-gray-400 text-xs">%</span>
                            </div>
                          ) : (
                            <span className="font-bold text-purple-700">{tax.percentage}%</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 border-l">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase ${
                            tax.status === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {tax.status === 1 ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 border-l text-center">
                          <div className="flex justify-center gap-2">
                            {editingId === tax.id ? (
                              <>
                                <button onClick={() => handleUpdate(tax.id)} className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200" title="Save">
                                  <Check size={14} />
                                </button>
                                <button onClick={() => setEditingId(null)} className="p-1.5 bg-gray-200 text-gray-600 rounded hover:bg-gray-300" title="Cancel">
                                  <X size={14} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => { setEditingId(tax.id); setEditTitle(tax.title || ''); setEditPercentage(tax.percentage); }}
                                  className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                                  title="Edit"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() => handleDelete(tax.id)}
                                  className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-14 text-center text-gray-400 italic bg-gray-50/50">
                        <Percent size={36} className="mx-auto mb-3 opacity-20" />
                        {searchTerm ? 'No taxes match your search.' : 'No tax rules found. Add your first one!'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}