import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../../../store/toastStore';
import api from '../../../lib/api';
import { 
  RotateCcw, 
  Save, 
  ChevronLeft, 
  Loader2, 
  Plus, 
  Trash2, 
  Edit, 
  Languages, 
  Check, 
  X,
  Globe
} from 'lucide-react';

export default function LanguageSettings() {
  const navigate = useNavigate();
  const { showToast } = useToastStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [languages, setLanguages] = useState([]);
  const [defaultLanguage, setDefaultLanguage] = useState('en');
  const [initialDefault, setInitialDefault] = useState('en');

  // Form states for adding/editing language
  const [editingId, setEditingId] = useState(null);
  const [langName, setLangName] = useState('');
  const [langCode, setLangCode] = useState('');
  const [isRtl, setIsRtl] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/config/languages');
      if (res.data.success) {
        setLanguages(res.data.languages || []);
        setDefaultLanguage(res.data.default_language || 'en');
        setInitialDefault(res.data.default_language || 'en');
      }
    } catch (err) {
      showToast('Failed to load languages list', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDefault = async () => {
    try {
      setSaving(true);
      await api.put('/languages/default', { default_language: defaultLanguage });
      setInitialDefault(defaultLanguage);
      showToast('Default language updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to update default language', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddLanguage = async (e) => {
    e.preventDefault();
    if (!langName.trim() || !langCode.trim()) {
      showToast('Language name and code are required', 'warning');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        language: langName.trim(),
        code: langCode.trim().toLowerCase(),
        is_rtl: isRtl
      };
      if (editingId) {
        await api.put(`/config/languages/${editingId}`, payload);
        showToast('Language updated successfully!', 'success');
      } else {
        await api.post('/config/languages', payload);
        showToast('Language added successfully!', 'success');
      }
      resetForm();
      await loadLanguages();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save language', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (lang) => {
    setEditingId(lang.id);
    setLangName(lang.language);
    setLangCode(lang.code);
    setIsRtl(lang.is_rtl === 1);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this language?')) return;
    try {
      setSaving(true);
      await api.delete(`/config/languages/${id}`);
      showToast('Language deleted successfully!', 'success');
      await loadLanguages();
    } catch (err) {
      showToast('Failed to delete language', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setLangName('');
    setLangCode('');
    setIsRtl(false);
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#F8F9FB] p-4 flex flex-col items-center justify-center">
        <Loader2 size={36} className="text-purple-600 animate-spin mb-4" />
        <p className="text-gray-500 font-semibold text-sm">Loading languages preference...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-20 animate-fadeIn font-sans bg-[#F8F9FB] min-h-screen">
      
      {/* Header and Breadcrumb */}
      <div className="flex justify-between items-center select-none pb-2 border-b border-gray-100/50 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/admin/web-settings')}
            className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 hover:bg-gray-50 text-slate-600 transition-colors"
            title="Back to Web Settings"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-xl font-bold text-[#334257]">Language Settings</h2>
        </div>
        <div className="text-xs md:text-sm text-gray-400 font-medium">
          Home / <span className="text-slate-600 font-semibold">Language Settings</span>
        </div>
      </div>

      <div className="space-y-8 flex-1 max-w-5xl mx-auto w-full">
        {/* Default Language Selector */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-[16px] font-bold text-slate-700 uppercase tracking-tight flex items-center gap-2">
                <Globe size={18} className="text-purple-600" /> Default Language Configuration
              </h3>
              <p className="text-xs text-gray-400 font-medium mt-1">Select the default localization settings for the website.</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value)}
                className="px-3 h-10 border border-gray-200 rounded-lg focus:border-purple-500 outline-none text-sm text-gray-700 shadow-sm bg-white font-medium"
              >
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.code}>
                    {lang.language} ({lang.code.toUpperCase()})
                  </option>
                ))}
              </select>
              <button
                onClick={handleSaveDefault}
                disabled={saving || defaultLanguage === initialDefault}
                className="h-10 px-5 bg-[#004BB9] hover:bg-[#003d96] text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition uppercase flex items-center gap-2 cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={14} /> Update Default
              </button>
            </div>
          </div>
        </div>

        {/* Languages List Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-[16px] font-bold text-slate-700 uppercase tracking-tight flex items-center gap-2">
                <Languages size={18} className="text-purple-600" /> Supported Languages
              </h3>
              <p className="text-xs text-gray-400 font-medium mt-1">Manage languages shown to users in the language dropdown.</p>
            </div>
            {!showAddForm && (
              <button
                type="button"
                onClick={() => { setShowAddForm(true); setEditingId(null); }}
                className="h-9 px-4 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-sm transition uppercase flex items-center gap-1.5 cursor-pointer border-none"
              >
                <Plus size={14} /> Add Language
              </button>
            )}
          </div>

          {/* Form to Add / Edit Language */}
          {showAddForm && (
            <form onSubmit={handleAddLanguage} className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  {editingId ? 'Edit Language' : 'New Language Specification'}
                </h4>
                <button
                  type="button"
                  onClick={resetForm}
                  className="p-1 hover:bg-gray-200 rounded-full transition text-gray-400"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Language Name</label>
                  <input
                    type="text"
                    value={langName}
                    onChange={(e) => setLangName(e.target.value)}
                    placeholder="e.g. Marathi"
                    className="px-3 h-10 border border-gray-200 rounded-lg focus:border-purple-500 outline-none text-sm text-gray-700 bg-white font-medium"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Language Code</label>
                  <input
                    type="text"
                    value={langCode}
                    onChange={(e) => setLangCode(e.target.value)}
                    placeholder="e.g. mr"
                    disabled={editingId !== null}
                    className="px-3 h-10 border border-gray-200 rounded-lg focus:border-purple-500 outline-none text-sm text-gray-700 bg-white font-medium disabled:opacity-50"
                  />
                </div>
                <div className="flex flex-col gap-1.5 justify-center sm:pl-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={isRtl}
                      onChange={(e) => setIsRtl(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    Right-to-Left (RTL) Layout
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="h-9 px-4 border border-gray-200 hover:bg-gray-50 text-gray-400 text-xs font-bold rounded-lg shadow-sm transition uppercase cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-9 px-6 bg-[#004BB9] hover:bg-[#003d96] text-white text-xs font-bold rounded-lg shadow-sm transition uppercase flex items-center gap-1.5 cursor-pointer border-none"
                >
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Add Language'}
                </button>
              </div>
            </form>
          )}

          {/* Languages Data Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
            <table className="w-full text-left border-collapse bg-white">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100 text-slate-500 font-bold uppercase text-[10px] tracking-wide select-none">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Language</th>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Direction</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-[#334257]">
                {languages.map((lang) => (
                  <tr key={lang.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-3.5 font-mono text-xs">{lang.id}</td>
                    <td className="px-6 py-3.5 font-bold flex items-center gap-2">
                      {lang.language}
                      {lang.code === defaultLanguage && (
                        <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          Default
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs uppercase">{lang.code}</td>
                    <td className="px-6 py-3.5 text-xs font-semibold text-gray-400">
                      {lang.is_rtl === 1 ? 'RTL (Right to Left)' : 'LTR (Left to Right)'}
                    </td>
                    <td className="px-6 py-3.5 text-right flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(lang)}
                        className="p-1.5 hover:bg-gray-100 rounded text-slate-500 hover:text-purple-600 transition"
                        title="Edit Language"
                      >
                        <Edit size={14} />
                      </button>
                      {lang.code !== 'en' && lang.code !== defaultLanguage && (
                        <button
                          onClick={() => handleDelete(lang.id)}
                          className="p-1.5 hover:bg-gray-100 rounded text-slate-500 hover:text-red-600 transition"
                          title="Delete Language"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
