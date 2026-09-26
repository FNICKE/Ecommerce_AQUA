import React, { useState, useEffect, useRef } from 'react';
import {
  Search, RefreshCw, Upload, MoreVertical, RotateCcw,
  X, CheckCircle, AlertCircle, Image as ImageIcon,
  Download, ChevronDown, ChevronRight, Edit2, Trash2,
  Plus, List, GitBranch, Check
} from 'lucide-react';
import api from '../../../lib/api.js';
import { getImageUrl } from '../../../lib/imageUrl.js';

// ─── Reusable Media Modal ──────────────────────────────────────────────────
function MediaModal({ open, onClose, onSelect, selectedId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setLoading(true);
    api.get('/media')
      .then(res => {
        if (res.data.success) {
          setItems(res.data.data.filter(i =>
            i.type?.startsWith('image/') ||
            ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(i.extension?.toLowerCase())
          ));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const filtered = items.filter(i => i.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="text-xl font-semibold text-gray-800">Select Image from Media Library</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-200">
            <X size={22} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search media..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48">
              <RotateCcw size={32} className="animate-spin mb-3 text-purple-600" />
              <p className="text-gray-500 text-sm">Loading media...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <ImageIcon size={48} className="mb-3 opacity-40" />
              <p className="text-sm">{search ? 'No matching images' : 'No images in library'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filtered.map(item => {
                const path = `${item.path || ''}${item.name || ''}`.replace(/\/+/g, '/');
                const url = getImageUrl(path);
                const isSelected = selectedId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => onSelect(item)}
                    className={`group relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200 hover:shadow-lg ${
                      isSelected ? 'border-purple-600 ring-2 ring-purple-500 ring-offset-2 shadow-xl' : 'border-gray-200 hover:border-purple-400'
                    }`}
                  >
                    <img
                      src={url}
                      alt={item.name}
                      className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => { e.target.src = `data:image/svg+xml;utf8,<svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="150" height="150" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="%239ca3af">No Image</text></svg>`; }}
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-purple-600/30 flex items-center justify-center">
                        <CheckCircle size={48} className="text-white drop-shadow-xl" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-white text-xs truncate">{item.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
          <button onClick={onClose} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm font-medium">
            Cancel
          </button>
          <button onClick={onClose} className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Image Upload Field ─────────────────────────────────────────────────────
function ImageField({ label, required, hint, preview, onMediaOpen, onClear, onDirectUpload, disabled }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
        {label} {required && <span className="text-red-500">*</span>}
        {hint && <span className="normal-case font-normal text-gray-400 ml-1">{hint}</span>}
      </label>
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <img src={preview} alt="preview" className="w-full h-28 object-cover" onError={e => { e.target.src = `data:image/svg+xml;utf8,<svg width="200" height="112" viewBox="0 0 200 112" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="112" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="14" fill="%239ca3af">No Preview</text></svg>`; }} />
          <button type="button" onClick={onClear} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow">
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onMediaOpen}
          disabled={disabled}
          className="w-full flex flex-col items-center justify-center gap-1 border-2 border-dashed border-purple-300 rounded-xl py-4 text-center hover:border-purple-500 hover:bg-purple-50 transition-colors disabled:opacity-50"
        >
          <Upload size={20} className="text-purple-500" />
          <span className="text-xs text-purple-600 font-medium">Media Library</span>
        </button>
      )}
    </div>
  );
}

// ─── Toggle Switch ───────────────────────────────────────────────────────────
function StatusToggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-1 ${checked ? 'bg-purple-600' : 'bg-gray-300'}`}
    >
      <span className={`inline-block w-5 h-5 mt-0.5 ml-0.5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

// ─── Action Dropdown ──────────────────────────────────────────────────────────
function ActionMenu({ cat, onEdit, onDelete, onAddSub }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="text-gray-500 hover:text-purple-600 p-1.5 rounded-lg hover:bg-purple-50 transition-colors"
      >
        <MoreVertical size={18} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-1 overflow-hidden">
          <button
            onClick={() => { onEdit(cat); setOpen(false); }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 w-full text-left transition-colors"
          >
            <Edit2 size={14} /> Edit Category
          </button>
          {!cat.parent_id && (
            <button
              onClick={() => { onAddSub(cat); setOpen(false); }}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 w-full text-left transition-colors"
            >
              <Plus size={14} /> Add Subcategory
            </button>
          )}
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => { onDelete(cat.id); setOpen(false); }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full text-left transition-colors"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Edit Modal ─────────────────────────────────────────────────────────────
function EditModal({ cat, categories, onClose, onSaved }) {
  const [name, setName] = useState(cat.name || '');
  const [parentId, setParentId] = useState(cat.parent_id || '');
  const [mainPreview, setMainPreview] = useState(cat.imageUrl ? getImageUrl(cat.imageUrl) : null);
  const [bannerPreview, setBannerPreview] = useState(cat.bannerUrl ? getImageUrl(cat.bannerUrl) : null);
  const [mainFile, setMainFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [mainMediaId, setMainMediaId] = useState(null);
  const [bannerMediaId, setBannerMediaId] = useState(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [selectingFor, setSelectingFor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const openMedia = (field) => { setSelectingFor(field); setMediaOpen(true); };
  const handleMediaSelect = (item) => {
    const path = `${item.path || ''}${item.name || ''}`.replace(/\/+/g, '/');
    const url = getImageUrl(path);
    if (selectingFor === 'main') { setMainPreview(url); setMainMediaId(item.id); setMainFile(null); }
    else { setBannerPreview(url); setBannerMediaId(item.id); setBannerFile(null); }
    setMediaOpen(false);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      if (parentId) fd.append('parent_id', parentId);
      if (mainMediaId) fd.append('mainMediaId', mainMediaId);
      else if (mainFile) fd.append('image', mainFile);
      if (bannerMediaId) fd.append('bannerMediaId', bannerMediaId);
      else if (bannerFile) fd.append('banner', bannerFile);
      await api.put(`/categories/${cat.id}`, fd);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const mainParents = categories.filter(c => !c.parent_id && c.id !== cat.id);

  return (
    <>
      <MediaModal
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={handleMediaSelect}
        selectedId={selectingFor === 'main' ? mainMediaId : bannerMediaId}
      />
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
          <div className="p-5 border-b flex justify-between items-center bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800">Edit Category — {cat.name}</h3>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200"><X size={20} /></button>
          </div>
          <div className="p-6 space-y-4">
            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-lg border border-red-200">{error}</div>}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Parent Category</label>
              <select value={parentId} onChange={e => setParentId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm">
                <option value="">None (Main Category)</option>
                {mainParents.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <ImageField
              label="Main Image" hint="(131×131px)" preview={mainPreview}
              onMediaOpen={() => openMedia('main')}
              onClear={() => { setMainPreview(null); setMainFile(null); setMainMediaId(null); }}
              onDirectUpload={e => { const f = e.target.files?.[0]; if (f) { setMainFile(f); setMainPreview(URL.createObjectURL(f)); setMainMediaId(null); } }}
            />
            <ImageField
              label="Banner Image" preview={bannerPreview}
              onMediaOpen={() => openMedia('banner')}
              onClear={() => { setBannerPreview(null); setBannerFile(null); setBannerMediaId(null); }}
              onDirectUpload={e => { const f = e.target.files?.[0]; if (f) { setBannerFile(f); setBannerPreview(URL.createObjectURL(f)); setBannerMediaId(null); } }}
            />
          </div>
          <div className="p-5 border-t bg-gray-50 flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm font-medium">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Category Row (with expandable subcategories) ────────────────────────────
function CategoryRow({ cat, allCategories, onToggle, onDelete, onEdit, onAddSub, viewMode }) {
  const [expanded, setExpanded] = useState(false);
  const subs = allCategories.filter(c => c.parent_id === cat.id);
  const hasSubs = subs.length > 0;

  const imgPlaceholder = (w, h, txt) =>
    `data:image/svg+xml;utf8,<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="${w}" height="${h}" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="9" fill="%239ca3af">${txt}</text></svg>`;

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors border-b border-gray-100">
        <td className="px-4 py-3 text-sm text-gray-500 font-mono">{cat.id}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {hasSubs && viewMode === 'list' && (
              <button onClick={() => setExpanded(v => !v)} className="text-gray-400 hover:text-purple-600 transition-colors">
                {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            )}
            {!hasSubs && viewMode === 'list' && <span className="w-4" />}
            <span className="font-medium text-gray-800 text-sm">{cat.name}</span>
            {hasSubs && (
              <span className="bg-purple-100 text-purple-700 text-xs px-1.5 py-0.5 rounded-full font-medium">{subs.length}</span>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          {cat.imageUrl ? (
            <img src={getImageUrl(cat.imageUrl)} alt={cat.name} className="w-11 h-11 object-cover rounded-lg mx-auto border border-gray-200 shadow-sm"
              onError={e => { e.target.src = imgPlaceholder(44, 44, 'No Img'); }} />
          ) : (
            <div className="w-11 h-11 bg-gray-100 rounded-lg flex items-center justify-center mx-auto border border-gray-200">
              <ImageIcon size={16} className="text-gray-400" />
            </div>
          )}
        </td>
        <td className="px-4 py-3 text-center">
          {cat.bannerUrl ? (
            <img src={getImageUrl(cat.bannerUrl)} alt="banner" className="w-16 h-10 object-cover rounded-lg mx-auto border border-gray-200 shadow-sm"
              onError={e => { e.target.src = imgPlaceholder(64, 40, 'No Banner'); }} />
          ) : (
            <div className="w-16 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto border border-gray-200">
              <ImageIcon size={14} className="text-gray-300" />
              <span className="text-[10px] text-gray-400 ml-1">NO IMAGE</span>
            </div>
          )}
        </td>
        <td className="px-4 py-3 text-center">
          <StatusToggle checked={cat.status === 1} onChange={() => onToggle(cat.id)} />
        </td>
        <td className="px-4 py-3 text-center">
          <ActionMenu cat={cat} onEdit={onEdit} onDelete={onDelete} onAddSub={onAddSub} />
        </td>
      </tr>

      {/* Subcategory rows (list view expand) */}
      {expanded && viewMode === 'list' && subs.map(sub => (
        <tr key={sub.id} className="bg-purple-50/40 hover:bg-purple-50 border-b border-purple-100 transition-colors">
          <td className="px-4 py-2.5 text-xs text-gray-400 font-mono pl-8">{sub.id}</td>
          <td className="px-4 py-2.5">
            <div className="flex items-center gap-2 pl-6">
              <span className="text-purple-400 text-xs">└</span>
              <span className="text-sm text-gray-700">{sub.name}</span>
            </div>
          </td>
          <td className="px-4 py-2.5 text-center">
            {sub.imageUrl ? (
              <img src={getImageUrl(sub.imageUrl)} alt={sub.name} className="w-9 h-9 object-cover rounded-lg mx-auto border border-purple-100"
                onError={e => { e.target.src = imgPlaceholder(36, 36, 'No Img'); }} />
            ) : (
              <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center mx-auto">
                <ImageIcon size={14} className="text-purple-300" />
              </div>
            )}
          </td>
          <td className="px-4 py-2.5 text-center">
            {sub.bannerUrl ? (
              <img src={getImageUrl(sub.bannerUrl)} alt="banner" className="w-14 h-9 object-cover rounded mx-auto border border-purple-100"
                onError={e => { e.target.src = imgPlaceholder(56, 36, 'No Img'); }} />
            ) : (
              <div className="w-14 h-9 bg-purple-50 rounded-lg flex items-center justify-center mx-auto">
                <ImageIcon size={12} className="text-purple-300" />
              </div>
            )}
          </td>
          <td className="px-4 py-2.5 text-center">
            <StatusToggle checked={sub.status === 1} onChange={() => onToggle(sub.id)} />
          </td>
          <td className="px-4 py-2.5 text-center">
            <ActionMenu cat={sub} onEdit={onEdit} onDelete={onDelete} onAddSub={onAddSub} />
          </td>
        </tr>
      ))}
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const [allCategories, setAllCategories] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'tree'
  const [editingCat, setEditingCat] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, viewMode]);

  // Form state
  const [formData, setFormData] = useState({ name: '', parent: '' });
  const [categoryType, setCategoryType] = useState('main');
  const [autoSubName, setAutoSubName] = useState('');


  // Main image
  const [mainPreview, setMainPreview] = useState(null);
  const [mainFile, setMainFile] = useState(null);
  const [mainMediaId, setMainMediaId] = useState(null);

  // Banner image
  const [bannerPreview, setBannerPreview] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerMediaId, setBannerMediaId] = useState(null);

  // Media modal
  const [mediaOpen, setMediaOpen] = useState(false);
  const [selectingFor, setSelectingFor] = useState(null);

  const openMedia = (field) => { setSelectingFor(field); setMediaOpen(true); };

  const handleMediaSelect = (item) => {
    const path = `${item.path || ''}${item.name || ''}`.replace(/\/+/g, '/');
    const url = getImageUrl(path);
    if (selectingFor === 'main') {
      setMainPreview(url); setMainMediaId(item.id); setMainFile(null);
    } else {
      setBannerPreview(url); setBannerMediaId(item.id); setBannerFile(null);
    }
    setMediaOpen(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setFetching(true);
    try {
      const res = await api.get('/categories?include_inactive=true&include_subcategories=true');
      if (res.data.success) {
        // Flatten the tree into a flat list with parent_id preserved
        const flat = [];
        const flatten = (cats) => {
          cats.forEach(c => {
            flat.push(c);
            if (c.subcategories?.length) flatten(c.subcategories);
          });
        };
        flatten(res.data.categories || []);
        setAllCategories(flat);
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Failed to load categories' });
    } finally {
      setFetching(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', parent: '' });
    setCategoryType('main');
    setAutoSubName('');
    setMainPreview(null); setMainFile(null); setMainMediaId(null);
    setBannerPreview(null); setBannerFile(null); setBannerMediaId(null);
    setFeedback({ type: '', message: '' });
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return setFeedback({ type: 'error', message: 'Category name is required' });
    if (!mainPreview && !mainFile) return setFeedback({ type: 'error', message: 'Main image is required' });
    if (categoryType === 'sub' && !formData.parent) return setFeedback({ type: 'error', message: 'Parent category is required for subcategories' });

    setLoading(true);
    setFeedback({ type: '', message: '' });

    try {
      const fd = new FormData();
      fd.append('name', formData.name.trim());
      if (categoryType === 'sub' && formData.parent) fd.append('parent_id', formData.parent);
      if (mainMediaId) fd.append('mainMediaId', mainMediaId);
      else if (mainFile) fd.append('image', mainFile);
      if (bannerMediaId) fd.append('bannerMediaId', bannerMediaId);
      else if (bannerFile) fd.append('banner', bannerFile);

      const res = await api.post('/categories', fd);
      const newCatId = res.data.categoryId;

      // Auto-create subcategory if main category and name is provided
      if (categoryType === 'main' && autoSubName.trim() && newCatId) {
        const subFd = new FormData();
        subFd.append('name', autoSubName.trim());
        subFd.append('parent_id', newCatId);
        if (mainMediaId) subFd.append('mainMediaId', mainMediaId);
        else if (mainFile) subFd.append('image', mainFile);
        await api.post('/categories', subFd).catch(err => console.warn('Auto-sub creation failed:', err.message));
      }

      setFeedback({ type: 'success', message: res.data.message || 'Category created successfully!' });
      resetForm();
      fetchCategories();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to create category' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await api.patch(`/categories/${id}/toggle-status`);
      if (res.data.success) {
        setAllCategories(prev => prev.map(c => c.id === id ? { ...c, status: res.data.status } : c));
      }
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err) { console.error(err); }
  };

  const handleAddSubFor = (cat) => {
    setFormData({ name: '', parent: String(cat.id) });
    setCategoryType('sub');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Roots and filtered
  const roots = allCategories.filter(c => !c.parent_id);
  const filtered = roots.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    allCategories.filter(s => s.parent_id === c.id).some(s => s.name.toLowerCase().includes(search.toLowerCase()))
  );

  // Tree view: all including subs
  const treeFiltered = allCategories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const mainParents = roots;

  // Pagination slicing
  const totalItems = viewMode === 'list' ? filtered.length : treeFiltered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const currentFiltered = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const currentTreeFiltered = treeFiltered.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <>
      {/* Media Modal */}
      <MediaModal
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={handleMediaSelect}
        selectedId={selectingFor === 'main' ? mainMediaId : bannerMediaId}
      />

      {/* Edit Modal */}
      {editingCat && (
        <EditModal
          cat={editingCat}
          categories={allCategories}
          onClose={() => setEditingCat(null)}
          onSaved={fetchCategories}
        />
      )}

      <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
          <h2 className="text-2xl font-bold text-[#42526e]">Manage Categories</h2>
          <div className="text-sm text-gray-400">Home / <span className="text-purple-600 font-medium">Categories</span></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ─── Left Form ─── */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-semibold text-gray-700 mb-5 flex items-center gap-2">
                <Plus size={18} className="text-purple-500" /> Add New Category
              </h3>

              <form onSubmit={handleAddCategory} className="space-y-4">
                {/* Category Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Category Type *</label>
                  <div className="flex gap-4">
                    {['main', 'sub'].map(t => (
                      <label key={t} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio" name="catType" value={t}
                          checked={categoryType === t}
                          onChange={() => setCategoryType(t)}
                          className="text-purple-600 focus:ring-purple-400"
                          disabled={loading}
                        />
                        <span className="text-sm text-gray-700">{t === 'main' ? 'Main Category' : 'Sub Category'}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">NAME *</label>
                  <input
                    type="text" value={formData.name} disabled={loading}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    placeholder="Category Name"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    required
                  />
                </div>

                {/* Parent selector for sub */}
                {categoryType === 'sub' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">SELECT PARENT *</label>
                    <select
                      value={formData.parent} disabled={loading} required
                      onChange={e => setFormData(p => ({ ...p, parent: e.target.value }))}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="">Select Parent Category</option>
                      {mainParents.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}

                {/* Auto-subcategory (only for main) */}
                {categoryType === 'main' && (
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <label className="block text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">Auto Subcategory Name (optional)</label>
                    <input
                      type="text" value={autoSubName} disabled={loading}
                      onChange={e => setAutoSubName(e.target.value)}
                      placeholder="Subcategory name (optional)"
                      className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                )}

                {/* Main Image */}
                <ImageField
                  label="Main Image" required hint="(131×131px)"
                  preview={mainPreview}
                  onMediaOpen={() => openMedia('main')}
                  onClear={() => { setMainPreview(null); setMainFile(null); setMainMediaId(null); }}
                  onDirectUpload={e => { const f = e.target.files?.[0]; if (f?.type.startsWith('image/')) { setMainFile(f); setMainPreview(URL.createObjectURL(f)); setMainMediaId(null); } }}
                  disabled={loading}
                />

                {/* Banner Image */}
                <ImageField
                  label="Banner Image"
                  preview={bannerPreview}
                  onMediaOpen={() => openMedia('banner')}
                  onClear={() => { setBannerPreview(null); setBannerFile(null); setBannerMediaId(null); }}
                  onDirectUpload={e => { const f = e.target.files?.[0]; if (f?.type.startsWith('image/')) { setBannerFile(f); setBannerPreview(URL.createObjectURL(f)); setBannerMediaId(null); } }}
                  disabled={loading}
                />

                {/* Feedback */}
                {feedback.message && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl text-sm border ${
                    feedback.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
                  }`}>
                    {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {feedback.message}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={resetForm} disabled={loading}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                    Reset
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                    {loading ? 'Adding...' : 'Add Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ─── Right Table ─── */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Table Header */}
              <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-700">Category</h3>
                <div className="flex flex-wrap items-center gap-2">
                  {/* List / Tree view toggle */}
                  <div className="flex border border-purple-200 rounded-lg overflow-hidden text-sm">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 font-medium transition-colors ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-purple-600 hover:bg-purple-50'}`}
                    >
                      <List size={14} /> List View
                    </button>
                    <button
                      onClick={() => setViewMode('tree')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 font-medium transition-colors ${viewMode === 'tree' ? 'bg-purple-600 text-white' : 'text-purple-600 hover:bg-purple-50'}`}
                    >
                      <GitBranch size={14} /> Tree View
                    </button>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text" placeholder="Search..." value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 w-40"
                    />
                  </div>

                  <button onClick={fetchCategories} title="Refresh" className="p-2 bg-gray-100 hover:bg-purple-100 rounded-lg transition-colors">
                    <RefreshCw size={16} className="text-gray-600" />
                  </button>
                  <button title="Export" className="p-2 bg-gray-100 hover:bg-purple-100 rounded-lg transition-colors">
                    <Download size={16} className="text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Table */}
              {fetching ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <RotateCcw size={32} className="animate-spin mb-3 text-purple-400" />
                  <p className="text-sm">Loading categories...</p>
                </div>
              ) : (viewMode === 'list' ? filtered : treeFiltered).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <ImageIcon size={40} className="mb-3 opacity-30" />
                  <p className="text-sm">{search ? 'No categories match your search' : 'No categories found'}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Image</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Banner</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Status</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewMode === 'list' ? (
                        currentFiltered.map(cat => (
                          <CategoryRow
                            key={cat.id}
                            cat={cat}
                            allCategories={allCategories}
                            onToggle={handleToggle}
                            onDelete={handleDelete}
                            onEdit={setEditingCat}
                            onAddSub={handleAddSubFor}
                            viewMode="list"
                          />
                        ))
                      ) : (
                        // Tree view: show all flattened, indent subs
                        currentTreeFiltered.map(cat => {
                          const isChild = !!cat.parent_id;
                          const imgPh = (w, h, t) => `data:image/svg+xml;utf8,<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="${w}" height="${h}" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="9" fill="%239ca3af">${t}</text></svg>`;
                          return (
                            <tr key={cat.id} className={`border-b border-gray-100 transition-colors ${isChild ? 'bg-purple-50/30 hover:bg-purple-50' : 'hover:bg-gray-50'}`}>
                              <td className={`px-4 py-2.5 text-xs font-mono text-gray-400 ${isChild ? 'pl-10' : ''}`}>{cat.id}</td>
                              <td className="px-4 py-2.5">
                                <div className={`flex items-center gap-2 ${isChild ? 'pl-4' : ''}`}>
                                  {isChild && <span className="text-purple-300 text-xs">└</span>}
                                  <span className={`text-sm ${isChild ? 'text-gray-600' : 'font-semibold text-gray-800'}`}>{cat.name}</span>
                                  {isChild && <span className="text-[10px] text-purple-500 bg-purple-100 px-1.5 py-0.5 rounded-full">sub</span>}
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                {cat.imageUrl ? (
                                  <img src={getImageUrl(cat.imageUrl)} alt={cat.name} className={`object-cover rounded-lg mx-auto border border-gray-200 ${isChild ? 'w-9 h-9' : 'w-11 h-11'}`}
                                    onError={e => { e.target.src = imgPh(44, 44, 'No Img'); }} />
                                ) : (
                                  <div className={`bg-gray-100 rounded-lg flex items-center justify-center mx-auto ${isChild ? 'w-9 h-9' : 'w-11 h-11'}`}>
                                    <ImageIcon size={14} className="text-gray-300" />
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                {cat.bannerUrl ? (
                                  <img src={getImageUrl(cat.bannerUrl)} alt="banner" className="w-16 h-10 object-cover rounded-lg mx-auto border border-gray-200"
                                    onError={e => { e.target.src = imgPh(64, 40, 'No Banner'); }} />
                                ) : (
                                  <div className="w-16 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                                    <ImageIcon size={12} className="text-gray-300" />
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <StatusToggle checked={cat.status === 1} onChange={() => handleToggle(cat.id)} />
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <ActionMenu cat={cat} onEdit={setEditingCat} onDelete={handleDelete} onAddSub={handleAddSubFor} />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
                <div className="text-xs text-gray-500 font-medium">
                  Showing {totalItems === 0 ? 0 : indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalItems)} of {totalItems} categories
                  {allCategories.filter(c => c.parent_id).length > 0 && ` (${allCategories.filter(c => !c.parent_id).length} main, ${allCategories.filter(c => c.parent_id).length} sub)`}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-600 disabled:hover:border-gray-200 transition-all duration-150"
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200 ${
                            currentPage === pageNum
                              ? 'bg-purple-600 text-white shadow-md shadow-purple-200 scale-105'
                              : 'border border-gray-200 text-gray-600 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 bg-white'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-600 disabled:hover:border-gray-200 transition-all duration-150"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}