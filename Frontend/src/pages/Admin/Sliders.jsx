// src/pages/admin/Sliders.jsx
import React, { useState, useEffect } from 'react';
import {
  Search, RotateCcw, Trash2, Loader2, Plus, Minus, X, CheckCircle,
  Image as ImageIcon, RotateCcw as RotateCcwIcon, Save,
  Type, AlignLeft, MousePointer2, Link as LinkIcon, Tag, Sparkles,
  AlertCircle, Check, PenLine
} from 'lucide-react';
import api from '../../lib/api';
import { getImageUrl } from '../../lib/imageUrl';

export default function Sliders() {
  const [sliders, setSliders] = useState([]);           // Left: current selection/preparation
  const [liveSliders, setLiveSliders] = useState([]);   // Right: what is actually live on home page
  const [sliderCount, setSliderCount] = useState(3);    // Max allowed on home
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [countLoading, setCountLoading] = useState(true);

  // Media modal states
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaItems, setMediaItems] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaSearch, setMediaSearch] = useState('');

  // Editor state - one form entry per live slider
  const [editorForms, setEditorForms] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchSliderCount();
    fetchExistingSliders();
    fetchLiveSliders();
  }, []);

  // Populate editor forms whenever live sliders change
  useEffect(() => {
    const forms = {};
    liveSliders.forEach(s => {
      forms[s.id] = {
        badge:    s.badge    || '',
        title:    s.title    || '',
        subtitle: s.subtitle || '',
        cta_text: s.cta_text || '',
        cta_link: s.cta_link || '',
      };
    });
    setEditorForms(forms);
  }, [liveSliders]);

  useEffect(() => {
    if (showMediaModal) fetchMediaItems();
  }, [showMediaModal]);

  // ── Fetch slider count ──────────────────────────────────────────────
  const fetchSliderCount = async () => {
    try {
      setCountLoading(true);
      const res = await api.get('/admin/settings/slider-count');
      setSliderCount(res.data.slider_count || 3);
    } catch (err) {
      console.error('Failed to load slider count:', err);
    } finally {
      setCountLoading(false);
    }
  };

  // ── Update max slider count ─────────────────────────────────────────
  const updateSliderCount = async (newCount) => {
    if (newCount < 1 || newCount > 10) return;
    try {
      await api.put('/admin/settings/slider-count', { slider_count: newCount });
      setSliderCount(newCount);
      showToast(`Home page will now show up to ${newCount} slider(s)`);
      fetchLiveSliders();
    } catch {
      showToast('Failed to update slider count', 'error');
    }
  };

  // ── Fetch working set (left side) ───────────────────────────────────
  const fetchExistingSliders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/sliders');
      const loaded = res.data.sliders.map(slider => ({
        mediaId: null,
        preview: slider.image_url ||
          'data:image/svg+xml;utf8,<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="128" height="128" fill="%23f3f4f6" rx="8"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" font-weight="bold" fill="%239ca3af">No Preview</text></svg>'
      }));
      setSliders(loaded.slice(0, sliderCount));
    } catch (err) {
      console.error('Failed to load existing sliders:', err);
      setError('Failed to load your current slider selection');
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch live sliders (right side) ────────────────────────────────
  const fetchLiveSliders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/sliders');
      const loaded = res.data.sliders.map(slider => ({
        ...slider,
        image_url: slider.image_url ||
          'data:image/svg+xml;utf8,<svg width="160" height="96" viewBox="0 0 160 96" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="160" height="96" fill="%23f3f4f6" rx="8"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" font-weight="bold" fill="%239ca3af">No Image</text></svg>'
      }));
      setLiveSliders(loaded);
    } catch (err) {
      console.error('Failed to load live sliders:', err);
      setError('Failed to load current home page sliders');
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch media items ───────────────────────────────────────────────
  const fetchMediaItems = async () => {
    setMediaLoading(true);
    try {
      const res = await api.get('/media');
      if (res.data.success) {
        const imagesOnly = res.data.data.filter(item =>
          item.type?.startsWith('image/') ||
          ['jpg','jpeg','png','webp','gif'].includes(item.extension?.toLowerCase())
        );
        setMediaItems(imagesOnly);
      }
    } catch (err) {
      console.error('Failed to load media:', err);
    } finally {
      setMediaLoading(false);
    }
  };

  const openMediaSelector = () => {
    if (sliders.length >= sliderCount) {
      showToast(`You can only prepare up to ${sliderCount} sliders.`, 'error');
      return;
    }
    setShowMediaModal(true);
    setMediaSearch('');
  };

  const selectMediaItem = (item) => {
    console.log('MEDIA ITEM SELECTED:', item);
    const idValue = item.id || item._id || item.media_id || item.MediaID || item.ID || null;
    const mediaId = Number(idValue);
    if (isNaN(mediaId) || mediaId <= 0) {
      showToast('This image has no valid ID. Check console.', 'error');
      return;
    }

    let previewPath = '';
    if (item.thumbnail) previewPath = item.thumbnail;
    else if (item.sub_directory && item.name) {
      previewPath = `/${item.sub_directory.replace(/^\/+/, '')}${item.name}${item.extension ? '.' + item.extension : ''}`;
    } else if (item.path) {
      previewPath = item.path;
    }

    if (previewPath.startsWith('http://') || previewPath.startsWith('https://')) {
      if (previewPath.includes('/uploads/')) {
        previewPath = previewPath.replace(/^https?:\/\/[^/]+/, '');
      }
    }

    const fullPreview = previewPath.startsWith('http')
      ? previewPath
      : `/${previewPath.replace(/^\/+/, '')}`;

    setSliders(prev => [...prev, { mediaId, preview: fullPreview }]);
    setShowMediaModal(false);
  };

  const removeImage = (index) => {
    setSliders(prev => prev.filter((_, i) => i !== index));
  };

  // ── Submit new sliders (left side save) ────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sliders.length === 0) {
      showToast('Please select at least one image', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const rawMediaIds = sliders.map(img => img.mediaId);
      const cleanedMediaIds = rawMediaIds
        .filter(id => { const n = Number(id); return !isNaN(n) && n > 0; })
        .map(Number);

      if (cleanedMediaIds.length === 0) {
        showToast('No valid image IDs found after cleaning.', 'error');
        return;
      }
      await api.post('/admin/sliders', { type: 'default', media_ids: cleanedMediaIds });
      showToast(`Successfully added ${sliders.length} slider(s)!`);
      setSliders([]);
      fetchExistingSliders();
      fetchLiveSliders();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add sliders', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Editor field change ─────────────────────────────────────────────
  const handleEditorChange = (sliderId, field, value) => {
    setEditorForms(prev => ({
      ...prev,
      [sliderId]: { ...prev[sliderId], [field]: value }
    }));
  };

  // ── Save slider text ────────────────────────────────────────────────
  const saveSliderText = async (id) => {
    setSavingId(id);
    try {
      await api.put(`/admin/sliders/${id}`, editorForms[id]);
      showToast('Slider content updated!');
      fetchLiveSliders();
    } catch {
      showToast('Failed to update slider', 'error');
    } finally {
      setSavingId(null);
    }
  };

  // ── Delete slider ───────────────────────────────────────────────────
  const handleDeleteSlider = async (id) => {
    if (!window.confirm('Delete this slider?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/sliders/${id}`);
      showToast('Slider deleted');
      fetchLiveSliders();
      fetchExistingSliders();
    } catch {
      showToast('Failed to delete slider', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredMedia = mediaItems.filter(item =>
    item.name?.toLowerCase().includes(mediaSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-6" style={{ backgroundColor: 'var(--background)' }}>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-white text-sm font-semibold animate-bounce-in ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
          {toast.msg}
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Manage Home Page Sliders
        </h2>
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Home / <span style={{ color: 'var(--text-primary)' }}>Sliders</span>
        </div>
      </div>

      {/* ── Slider Count Control ──────────────────────────────────── */}
      <div
        className="p-6 rounded-lg shadow-sm border"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--gray-light)' }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
              Number of Sliders on Home Page
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Allowed: <strong>{sliderCount}</strong> • Live now: <strong>{liveSliders.length}</strong>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => updateSliderCount(sliderCount - 1)}
              disabled={sliderCount <= 1 || countLoading}
              className="p-2 rounded-full transition-colors disabled:opacity-50"
              style={{ backgroundColor: 'var(--gray-medium)', color: 'white' }}
            >
              <Minus size={20} />
            </button>
            <span className="text-xl font-bold w-10 text-center" style={{ color: 'var(--text-primary)' }}>
              {sliderCount}
            </span>
            <button
              onClick={() => updateSliderCount(sliderCount + 1)}
              disabled={sliderCount >= 10 || countLoading}
              className="p-2 rounded-full transition-colors disabled:opacity-50"
              style={{ backgroundColor: 'var(--gray-medium)', color: 'white' }}
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Two-Column Layout: Left = Prepare, Right = Live Table ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT: Prepare Slider Images */}
        <div className="lg:col-span-4">
          <div
            className="p-6 rounded-lg shadow-sm border"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--gray-light)' }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Prepare Slider Images ({sliders.length} / {sliderCount})
            </h3>

            {/* Current Selection Preview */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {sliders.map((img, index) => (
                <div key={index} className="relative rounded-lg overflow-hidden border border-gray-300 shadow-sm">
                  <img
                    src={getImageUrl(img.preview)}
                    alt="Selected preview"
                    className="w-full h-32 object-cover"
                    onError={(e) => e.target.src = 'data:image/svg+xml;utf8,<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="128" height="128" fill="%23f3f4f6" rx="8"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" font-weight="bold" fill="%239ca3af">No Preview</text></svg>'}
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-md"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              {sliders.length < sliderCount && (
                <button
                  type="button"
                  onClick={openMediaSelector}
                  className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
                  style={{ backgroundColor: 'var(--gray-light)' }}
                >
                  <Plus size={32} className="text-gray-500 mb-2" />
                  <span className="text-sm text-gray-600">Add Image</span>
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSliders([])}
                className="flex-1 py-2.5 rounded font-medium transition-colors"
                style={{ backgroundColor: 'var(--gray-medium)', color: 'white' }}
              >
                Reset Selection
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || sliders.length === 0}
                className="flex-1 py-2.5 rounded font-medium transition-colors disabled:opacity-60"
                style={{ backgroundColor: 'var(--secondary, #10b981)', color: 'white' }}
              >
                {submitting ? 'Saving...' : `Save ${sliders.length} Slider(s)`}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Live Home Page Sliders Table */}
        <div className="lg:col-span-8">
          {loading ? (
            <div className="p-12 rounded-lg shadow-sm border text-center bg-white">
              <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-purple-600" />
              <p className="text-gray-600">Loading live home page sliders...</p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-lg text-center border bg-red-50 border-red-200">
              <p className="text-red-700">{error}</p>
            </div>
          ) : liveSliders.length === 0 ? (
            <div className="p-12 rounded-lg shadow-sm border text-center bg-white">
              <p className="text-gray-600">
                No sliders are currently live on the home page.<br />
                Save some from the left side to make them appear here and on home.
              </p>
            </div>
          ) : (
            <div className="rounded-lg shadow-sm border overflow-hidden bg-white">
              <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">
                  Currently Live on Home Page ({liveSliders.length} / {sliderCount})
                </h3>
                <button
                  onClick={fetchLiveSliders}
                  disabled={loading}
                  className="p-2 rounded hover:bg-gray-200 transition-colors"
                  title="Refresh live sliders"
                >
                  <RotateCcw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-sm uppercase bg-gray-50">
                      <th className="px-6 py-4 font-semibold border-b">ID</th>
                      <th className="px-6 py-4 font-semibold border-b">Type</th>
                      <th className="px-6 py-4 font-semibold border-b">Image</th>
                      <th className="px-6 py-4 font-semibold border-b text-center">Home Preview</th>
                      <th className="px-6 py-4 font-semibold border-b text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-200">
                    {liveSliders.map((slider) => (
                      <tr key={slider.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-700">#{slider.id}</td>
                        <td className="px-6 py-4 text-gray-600">{slider.type || 'default'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {slider.image_url ? (
                              <img
                                src={getImageUrl(slider.image_url)}
                                alt="Slider"
                                className="h-16 w-32 object-cover rounded border border-gray-200 shadow-sm"
                                onError={(e) => {
                                  e.target.src = 'data:image/svg+xml;utf8,<svg width="128" height="64" viewBox="0 0 128 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="128" height="64" fill="%23f3f4f6" rx="8"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" font-weight="bold" fill="%239ca3af">No Image</text></svg>';
                                }}
                              />
                            ) : (
                              <div className="h-16 w-32 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                No Image
                              </div>
                            )}
                            <span className="text-xs text-gray-500 truncate max-w-[180px]">
                              {slider.image_url?.split('/').pop() || 'No file'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {slider.image_url ? (
                            <div className="inline-block w-40 h-24 bg-gray-100 rounded overflow-hidden border border-gray-200 shadow-inner">
                              <img
                                src={getImageUrl(slider.image_url)}
                                alt="Live home preview"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = 'data:image/svg+xml;utf8,<svg width="160" height="96" viewBox="0 0 160 96" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="160" height="96" fill="%23f3f4f6" rx="8"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" font-weight="bold" fill="%239ca3af">No Preview</text></svg>';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="inline-block w-40 h-24 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                              No Preview
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleDeleteSlider(slider.id)}
                            disabled={deletingId === slider.id}
                            className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-colors"
                            title="Delete slider"
                          >
                            {deletingId === slider.id
                              ? <Loader2 size={16} className="animate-spin" />
                              : <Trash2 size={16} />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 text-sm text-center text-gray-500 bg-gray-50">
                These are the exact sliders visitors see on the home page right now
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── SLIDER CONTENT EDITOR ─ below the main layout ────────────── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {liveSliders.length > 0 && (
        <div
          className="rounded-xl border overflow-hidden shadow-sm"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--gray-light)' }}
        >
          {/* Editor Header */}
          <div
            className="px-6 py-5 border-b flex flex-col sm:flex-row sm:items-center gap-3"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(91,33,182,0.05))' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}
              >
                <PenLine size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                  Slider Content Editor
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Edit text that appears on each slider — badge, title, subtitle, and buttons
                </p>
              </div>
            </div>
            <div className="sm:ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 font-semibold w-max">
              <Sparkles size={12} />
              Changes reflect on homepage instantly after saving
            </div>
          </div>

          {/* One editor block per slider */}
          <div className="divide-y" style={{ borderColor: 'var(--gray-light)' }}>
            {liveSliders.map((slider, idx) => {
              const form = editorForms[slider.id] || {};
              const isSaving = savingId === slider.id;

              return (
                <div key={slider.id} className="p-6">

                  {/* Slider header row */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                          Slider #{slider.id}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {slider.image_url?.split('/').pop() || 'No image file'}
                        </p>
                      </div>
                      {/* Tiny image thumbnail */}
                      {slider.image_url && (
                        <img
                          src={getImageUrl(slider.image_url)}
                          alt=""
                          className="h-10 w-16 object-cover rounded-md border border-gray-200 shadow-sm hidden sm:block"
                          onError={e => e.target.style.display = 'none'}
                        />
                      )}
                    </div>

                    <button
                      onClick={() => saveSliderText(slider.id)}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-white shadow-md hover:shadow-lg transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
                    >
                      {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>

                  {/* Fields grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

                    {/* Badge */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                        <Tag size={12} className="text-purple-500" />
                        Badge Label
                      </label>
                      <input
                        type="text"
                        value={form.badge || ''}
                        onChange={e => handleEditorChange(slider.id, 'badge', e.target.value)}
                        placeholder="Premium Collection"
                        className="w-full px-3.5 py-2.5 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                        style={{ borderColor: 'var(--gray-light)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}
                      />
                      <p className="text-[11px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Small pill text above the title
                      </p>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                        <Type size={12} className="text-blue-500" />
                        Title
                      </label>
                      <input
                        type="text"
                        value={form.title || ''}
                        onChange={e => handleEditorChange(slider.id, 'title', e.target.value)}
                        placeholder="e.g. Authentic Indian Spices"
                        className="w-full px-3.5 py-2.5 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        style={{ borderColor: 'var(--gray-light)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}
                      />
                      <p className="text-[11px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Big bold heading on the slider
                      </p>
                    </div>

                    {/* Subtitle */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                        <AlignLeft size={12} className="text-teal-500" />
                        Subtitle
                      </label>
                      <input
                        type="text"
                        value={form.subtitle || ''}
                        onChange={e => handleEditorChange(slider.id, 'subtitle', e.target.value)}
                        placeholder="Straight from the farm to your kitchen"
                        className="w-full px-3.5 py-2.5 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                        style={{ borderColor: 'var(--gray-light)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}
                      />
                      <p className="text-[11px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Short description below the title
                      </p>
                    </div>

                    {/* CTA Button Text */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                        <MousePointer2 size={12} className="text-orange-500" />
                        "Shop Now" Button Text
                      </label>
                      <input
                        type="text"
                        value={form.cta_text || ''}
                        onChange={e => handleEditorChange(slider.id, 'cta_text', e.target.value)}
                        placeholder="Shop Now"
                        className="w-full px-3.5 py-2.5 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                        style={{ borderColor: 'var(--gray-light)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}
                      />
                      <p className="text-[11px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Primary call-to-action button label
                      </p>
                    </div>

                    {/* CTA Link */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                        <LinkIcon size={12} className="text-pink-500" />
                        Button Link (URL)
                      </label>
                      <input
                        type="text"
                        value={form.cta_link || ''}
                        onChange={e => handleEditorChange(slider.id, 'cta_link', e.target.value)}
                        placeholder="/products"
                        className="w-full px-3.5 py-2.5 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                        style={{ borderColor: 'var(--gray-light)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}
                      />
                      <p className="text-[11px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Where the button takes the user
                      </p>
                    </div>

                    {/* Live Mini Preview */}
                    <div className="flex flex-col">
                      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                        <Sparkles size={12} className="text-purple-500" />
                        Live Preview
                      </label>
                      <div className="relative flex-1 rounded-lg overflow-hidden min-h-[96px] bg-gray-900">
                        {slider.image_url && (
                          <img
                            src={getImageUrl(slider.image_url)}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover opacity-60"
                            onError={e => e.target.style.display = 'none'}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/75 to-transparent flex flex-col justify-center px-4">
                          {form.badge && (
                            <span className="inline-block text-[9px] text-white bg-purple-500/80 rounded-full px-2 py-0.5 mb-1.5 w-max font-semibold">
                              {form.badge}
                            </span>
                          )}
                          <p className="text-white font-bold text-xs leading-tight drop-shadow mb-0.5">
                            {form.title || <span className="opacity-40 italic">Title here...</span>}
                          </p>
                          {form.subtitle && (
                            <p className="text-white/70 text-[10px] mb-1.5 leading-snug">{form.subtitle}</p>
                          )}
                          {form.cta_text && (
                            <span className="inline-block text-[9px] bg-purple-600 text-white px-2 py-0.5 rounded w-max font-semibold">
                              {form.cta_text}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MEDIA SELECTION MODAL ─────────────────────────────────── */}
      {showMediaModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowMediaModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-semibold text-gray-800">Select Image from Media Library</h3>
              <button
                onClick={() => setShowMediaModal(false)}
                className="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search media..."
                  value={mediaSearch}
                  onChange={(e) => setMediaSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
              {mediaLoading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <RotateCcwIcon size={32} className="animate-spin mb-3 text-purple-600" />
                  <p className="text-gray-600">Loading media library...</p>
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <ImageIcon size={64} className="mb-4 opacity-50" />
                  <p>{mediaSearch ? 'No matching images found' : 'No images uploaded yet'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredMedia.map(item => {
                    let imageUrl = item.thumbnail || `${item.path}${item.name}`;
                    const fullUrl = getImageUrl(imageUrl);
                    const isSelected = sliders.some(img => img.mediaId === item.id);

                    return (
                      <div
                        key={item.id}
                        onClick={() => selectMediaItem(item)}
                        className={`group relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 hover:shadow-lg hover:border-purple-400 ${isSelected ? 'border-purple-600 shadow-xl ring-2 ring-purple-500 ring-offset-2 scale-[1.02]' : 'border-gray-200'}`}
                      >
                        <img
                          src={fullUrl}
                          alt={item.name}
                          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml;utf8,<svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="150" height="150" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="18" fill="%239ca3af">No Image</text></svg>';
                          }}
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
                            <CheckCircle size={64} className="text-white drop-shadow-2xl" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                          <p className="text-white text-xs truncate font-medium">{item.name}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-4 bg-gray-50">
              <button
                onClick={() => setShowMediaModal(false)}
                className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowMediaModal(false)}
                className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
                disabled={mediaLoading}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
