import { useState, useEffect, useCallback } from 'react';
import {
  RotateCcw, Plus, Trash2, Pencil, Check, X,
  ChevronDown, Tag, Loader2, AlertCircle, CheckCircle,
  Image as ImageIcon, Weight, Package, IndianRupee, Save,
  ChevronRight
} from 'lucide-react';
import api from '../../../lib/api';
import { formatWeightLabel } from '../../../lib/weightFormat';
import { getImageUrl } from '../../../lib/imageUrl';

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'attributes', label: 'Attributes & Values', icon: Tag },
  { id: 'weights', label: 'Weight Variants & Pricing', icon: Weight },
];

export default function Attribute() {
  const [activeTab, setActiveTab] = useState('attributes');

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#4e5e7a]">Product Attributes</h2>
        <p className="text-sm text-gray-500">
          Home / <span className="text-purple-600">Attributes</span>
        </p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white text-purple-700 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'attributes' && <AttributesTab />}
      {activeTab === 'weights' && <WeightVariantsTab />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1: Attributes & Values (original logic)
// ═══════════════════════════════════════════════════════════════════════════════
function AttributesTab() {
  const [attributes, setAttributes]     = useState([]);
  const [attributeSets, setAttributeSets] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [toast, setToast]               = useState({ type: '', message: '' });

  const [newAttrName, setNewAttrName]   = useState('');
  const [newAttrSetName, setNewAttrSetName] = useState('');

  const [editingAttrId, setEditingAttrId] = useState(null);
  const [editingAttrName, setEditingAttrName] = useState('');
  const [editingAttrSetName, setEditingAttrSetName] = useState('');

  const [expandedId, setExpandedId]     = useState(null);
  const [newValueInputs, setNewValueInputs] = useState({});
  const [uploadingValueId, setUploadingValueId] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 3500);
  };

  const fetchAttributes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/attributes');
      setAttributes(res.data.attributes || []);
      setAttributeSets(res.data.attributeSets || []);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to load attributes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAttributes(); }, [fetchAttributes]);

  const handleCreateAttribute = async (e) => {
    e.preventDefault();
    if (!newAttrName.trim() || !newAttrSetName.trim()) return;
    setSaving(true);
    try {
      await api.post('/admin/attributes', { name: newAttrName.trim(), attribute_set_name: newAttrSetName.trim() });
      setNewAttrName('');
      setNewAttrSetName('');
      showToast('success', 'Attribute created!');
      fetchAttributes();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to create attribute');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAttribute = async (id) => {
    if (!editingAttrName.trim() || !editingAttrSetName.trim()) return;
    try {
      await api.put(`/admin/attributes/${id}`, { name: editingAttrName.trim(), attribute_set_name: editingAttrSetName.trim() });
      setEditingAttrId(null);
      showToast('success', 'Attribute updated!');
      fetchAttributes();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to update attribute');
    }
  };

  const handleDeleteAttribute = async (id) => {
    if (!window.confirm('Delete this attribute and ALL its values?')) return;
    try {
      await api.delete(`/admin/attributes/${id}`);
      showToast('success', 'Attribute deleted');
      fetchAttributes();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleAddValue = async (attributeId) => {
    const val = (newValueInputs[attributeId] || '').trim();
    if (!val) return;
    try {
      await api.post(`/admin/attributes/${attributeId}/values`, { value: val });
      setNewValueInputs(prev => ({ ...prev, [attributeId]: '' }));
      showToast('success', 'Value added!');
      fetchAttributes();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to add value');
    }
  };

  const handleDeleteValue = async (valueId) => {
    try {
      await api.delete(`/admin/attribute-values/${valueId}`);
      showToast('success', 'Value deleted');
      fetchAttributes();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to delete value');
    }
  };

  const handleSwatchImageChange = async (valueId, file) => {
    if (!file) return;
    setUploadingValueId(valueId);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await api.post('/admin/upload-attribute-swatch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const imagePath = uploadRes.data.path;
      await api.put(`/admin/attribute-values/${valueId}/swatch`, {
        swatche_type: 'image',
        swatche_value: imagePath
      });
      showToast('success', 'Swatch updated!');
      fetchAttributes();
    } catch {
      showToast('error', 'Failed to upload swatch image');
    } finally {
      setUploadingValueId(null);
    }
  };

  return (
    <>
      {toast.message && (
        <div className={`flex items-center gap-3 p-4 rounded-lg border text-sm font-medium ${
          toast.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
            : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Add Attribute Form */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-[#4e5e7a] mb-5 border-b pb-3">Add New Attribute</h3>
            <form onSubmit={handleCreateAttribute} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">
                  Attribute Set Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newAttrSetName}
                  onChange={e => setNewAttrSetName(e.target.value)}
                  placeholder="e.g. Packets, Sizes, Colors"
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">
                  Attribute Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newAttrName}
                  onChange={e => setNewAttrName(e.target.value)}
                  placeholder="e.g. Weight, Color, Size"
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-400 mt-1">Add values to the attribute after creating it.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setNewAttrName(''); setNewAttrSetName(''); }}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-lg text-sm font-bold shadow-sm flex items-center justify-center gap-2"
                >
                  <RotateCcw size={16} /> Reset
                </button>
                <button
                  type="submit"
                  disabled={saving || !newAttrName.trim() || !newAttrSetName.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-bold shadow-sm flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Add Attribute
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT: Attributes Table */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h3 className="font-bold text-[#4e5e7a] text-lg">All Attributes</h3>
              <button
                onClick={fetchAttributes}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                title="Refresh"
              >
                <RotateCcw size={16} className="text-gray-600" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
                <Loader2 size={24} className="animate-spin" />
                <span className="text-sm">Loading attributes...</span>
              </div>
            ) : attributes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                <Tag size={40} className="opacity-30" />
                <p className="text-sm">No attributes yet. Create your first one!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {attributes.map(attr => (
                  <div key={attr.id} className="border border-gray-100 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Tag size={16} className="text-purple-500 shrink-0" />
                        {editingAttrId === attr.id ? (
                          <div className="flex gap-2 flex-1 items-center">
                            <input
                              type="text"
                              value={editingAttrSetName}
                              onChange={e => setEditingAttrSetName(e.target.value)}
                              placeholder="Set Name"
                              className="border border-purple-300 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-purple-500 bg-white min-w-[120px]"
                              required
                            />
                            <input
                              autoFocus
                              value={editingAttrName}
                              onChange={e => setEditingAttrName(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleUpdateAttribute(attr.id);
                                if (e.key === 'Escape') setEditingAttrId(null);
                              }}
                              className="border border-purple-300 rounded px-2 py-1 text-sm flex-1 outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-[#4e5e7a]">{attr.name}</span>
                              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold">
                                {attr.attribute_set_name || 'No Set'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">
                              ({attr.values?.length || 0} value{attr.values?.length !== 1 ? 's' : ''})
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-3">
                        {editingAttrId === attr.id ? (
                          <>
                            <button onClick={() => handleUpdateAttribute(attr.id)} className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg" title="Save">
                              <Check size={15} />
                            </button>
                            <button onClick={() => setEditingAttrId(null)} className="p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-lg" title="Cancel">
                              <X size={15} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => { setEditingAttrId(attr.id); setEditingAttrName(attr.name); setEditingAttrSetName(attr.attribute_set_name || ''); }}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg" title="Rename"
                            >
                              <Pencil size={15} />
                            </button>
                            <button onClick={() => handleDeleteAttribute(attr.id)} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg" title="Delete">
                              <Trash2 size={15} />
                            </button>
                            <button
                              onClick={() => setExpandedId(expandedId === attr.id ? null : attr.id)}
                              className={`p-1.5 rounded-lg transition-colors ${expandedId === attr.id ? 'bg-purple-100 text-purple-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'}`}
                              title="Manage values"
                            >
                              <ChevronDown size={15} className={`transition-transform ${expandedId === attr.id ? 'rotate-180' : ''}`} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {expandedId === attr.id && (
                      <div className="px-4 py-4 border-t border-gray-100 bg-white space-y-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Attribute Values</p>
                        {attr.values?.length > 0 ? (
                          <div className="space-y-2">
                            {attr.values.map(v => (
                              <div key={v.id} className="flex items-center justify-between gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="w-10 h-10 rounded-lg border-2 border-gray-200 overflow-hidden flex items-center justify-center bg-white">
                                    {v.swatche_type === 'color' && v.swatche_value ? (
                                      <div className="w-8 h-8 rounded" style={{ backgroundColor: v.swatche_value }} title={v.swatche_value} />
                                    ) : v.swatche_type === 'image' && v.swatche_value ? (
                                      <img src={getImageUrl(v.swatche_value)} alt={v.value} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                                    ) : (
                                      <Tag size={18} className="text-gray-300" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-[#4e5e7a]">{v.value}</p>
                                    <p className="text-xs text-gray-400">{v.swatche_type ? v.swatche_type : 'No swatch'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <label className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg cursor-pointer transition-colors">
                                    <ImageIcon size={15} />
                                    <input type="file" accept="image/*" onChange={e => handleSwatchImageChange(v.id, e.target.files?.[0])} disabled={uploadingValueId === v.id} className="hidden" />
                                  </label>
                                  <button onClick={() => handleDeleteValue(v.id)} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors" title="Remove">
                                    <X size={15} />
                                  </button>
                                </div>
                                {uploadingValueId === v.id && (
                                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-lg">
                                    <Loader2 size={20} className="text-white animate-spin" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No values yet. Add one below.</p>
                        )}
                        <div className="flex gap-2 pt-1">
                          <input
                            type="text"
                            value={newValueInputs[attr.id] || ''}
                            onChange={e => setNewValueInputs(prev => ({ ...prev, [attr.id]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') handleAddValue(attr.id); }}
                            placeholder="e.g. 500 gm, Red, XL"
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-purple-500"
                          />
                          <button onClick={() => handleAddValue(attr.id)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5">
                            <Plus size={15} /> Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!loading && (
              <p className="mt-4 text-xs text-gray-400">
                {attributes.length} attribute{attributes.length !== 1 ? 's' : ''} total
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2: Weight Variants & Pricing
// ═══════════════════════════════════════════════════════════════════════════════

const EMPTY_ROW = () => ({ _key: Date.now() + Math.random(), id: null, weight: '', price: '', special_price: '', stock: '', sku: '', image: '' });

function WeightVariantsTab() {
  const [products, setProducts]     = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [variants, setVariants]     = useState([]);
  const [rows, setRows]             = useState([EMPTY_ROW()]);
  const [loadingProds, setLoadingProds] = useState(true);
  const [loadingVars, setLoadingVars]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast]           = useState({ type: '', message: '' });
  const [uploadingRowIdx, setUploadingRowIdx] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 4000);
  };

  // Load products
  useEffect(() => {
    api.get('/variants/admin/products-list')
      .then(r => setProducts(r.data.products || []))
      .catch(() => showToast('error', 'Failed to load products'))
      .finally(() => setLoadingProds(false));
  }, []);

  // Load variants when product changes
  useEffect(() => {
    if (!selectedProductId) { setVariants([]); setRows([EMPTY_ROW()]); return; }
    setLoadingVars(true);
    api.get(`/variants/product/${selectedProductId}`)
      .then(r => {
        const v = r.data.variants || [];
        setVariants(v);
        // Pre-fill table rows from existing variants + one blank row
        setRows([
          ...v.map(variant => ({
            _key: variant.id,
            id: variant.id,
            weight: variant.weight || '',
            price: variant.price ?? '',
            special_price: variant.special_price ?? '',
            stock: variant.stock ?? '',
            sku: variant.sku || '',
            image: variant.image || '',
          })),
          EMPTY_ROW()
        ]);
      })
      .catch(() => showToast('error', 'Failed to load variants'))
      .finally(() => setLoadingVars(false));
  }, [selectedProductId]);

  const handleVariantImageUpload = async (index, file) => {
    if (!file) return;
    setUploadingRowIdx(index);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await api.post('/admin/upload-attribute-swatch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const imagePath = uploadRes.data.path;
      handleRowChange(index, 'image', imagePath);
      showToast('success', 'Variant image uploaded successfully!');
    } catch (err) {
      showToast('error', 'Failed to upload variant image');
    } finally {
      setUploadingRowIdx(null);
    }
  };

  const handleRowChange = (index, field, value) => {
    setRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // Auto-add new blank row when typing in the last row
      if (index === updated.length - 1 && value.trim && value.trim() !== '') {
        updated.push(EMPTY_ROW());
      }
      return updated;
    });
  };

  const handleWeightBlur = (index) => {
    setRows(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        weight: formatWeightLabel(updated[index].weight),
      };
      return updated;
    });
  };

  const removeRow = (index) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteVariant = async (variantId, index) => {
    if (!window.confirm('Remove this weight variant?')) return;
    setDeletingId(variantId);
    try {
      await api.delete(`/variants/admin/${variantId}`);
      showToast('success', 'Variant removed!');
      setRows(prev => prev.filter((_, i) => i !== index));
      setVariants(prev => prev.filter(v => v.id !== variantId));
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to delete variant');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async () => {
    if (!selectedProductId) return;

    // Filter out completely empty rows
    const toSave = rows.filter(r => (r.weight || '').trim() !== '' && (r.price !== '' && r.price !== null));

    if (toSave.length === 0) {
      showToast('error', 'Please add at least one weight variant with a price.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/variants/admin/bulk-weight', {
        product_id: selectedProductId,
        variants: toSave.map(r => ({
          id: r.id || undefined,
          weight: formatWeightLabel(r.weight),
          price: r.price,
          special_price: r.special_price !== '' ? r.special_price : null,
          stock: r.stock !== '' ? r.stock : 0,
          sku: r.sku || null,
          image: r.image || null,
        }))
      });

      const fresh = res.data.variants || [];
      setVariants(fresh);
      setRows([
        ...fresh.map(v => ({
          _key: v.id,
          id: v.id,
          weight: v.weight || '',
          price: v.price ?? '',
          special_price: v.special_price ?? '',
          stock: v.stock ?? '',
          sku: v.sku || '',
          image: v.image || '',
        })),
        EMPTY_ROW()
      ]);
      showToast('success', `✅ ${res.data.results?.length || toSave.length} variant(s) saved successfully!`);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to save variants');
    } finally {
      setSaving(false);
    }
  };

  const selectedProduct = products.find(p => String(p.id) === String(selectedProductId));

  return (
    <div className="space-y-6">
      {toast.message && (
        <div className={`flex items-center gap-3 p-4 rounded-lg border text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4 text-green-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* Product Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-[#4e5e7a] mb-4 pb-2 border-b flex items-center gap-2">
          <Package size={18} className="text-purple-500" />
          Select Product
        </h3>
        {loadingProds ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
            <Loader2 size={16} className="animate-spin" /> Loading products...
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <select
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500 bg-white max-w-md"
            >
              <option value="">-- Select a product --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {selectedProduct && (
              <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg text-sm font-medium text-purple-700">
                <ChevronRight size={14} />
                {selectedProduct.name}
                {variants.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-[11px] rounded-full font-bold">
                    {variants.length} variant{variants.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Variant Table */}
      {selectedProductId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50/60">
            <div>
              <h3 className="font-bold text-[#4e5e7a] flex items-center gap-2">
                <Weight size={18} className="text-purple-500" />
                Weight Variants &amp; Pricing
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Each row = one purchasable weight option shown in product details page
              </p>
            </div>
            <button
              onClick={() => setRows(prev => [...prev, EMPTY_ROW()])}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-semibold rounded-lg transition-colors border border-purple-200"
            >
              <Plus size={15} /> Add Row
            </button>
          </div>

          {loadingVars ? (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              <Loader2 size={24} className="animate-spin" />
              <span className="text-sm">Loading variants...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider w-8">#</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <span className="flex items-center gap-1"><Weight size={12} /> Weight / Pack Size *</span>
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <span className="flex items-center gap-1"><IndianRupee size={12} /> MRP Price *</span>
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <span className="flex items-center gap-1"><IndianRupee size={12} /> Special Price</span>
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider w-24">Image</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">SKU</th>
                      <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider w-16">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rows.map((row, idx) => {
                      const isExisting = !!row.id;
                      const isDeleting = deletingId === row.id;
                      return (
                        <tr
                          key={row._key}
                          className={`group transition-colors ${isExisting ? 'bg-white hover:bg-purple-50/30' : 'bg-blue-50/20 hover:bg-blue-50/50'}`}
                        >
                          <td className="px-4 py-2.5 text-gray-400 text-xs font-mono">
                            {isExisting ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-[9px] font-bold">SAVED</span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 text-[9px] font-bold">NEW</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <input
                              type="text"
                              value={row.weight}
                              onChange={e => handleRowChange(idx, 'weight', e.target.value)}
                              onBlur={() => handleWeightBlur(idx)}
                              placeholder="e.g. 100, 500, 1 kg"
                              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-400 min-w-[120px]"
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₹</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={row.price}
                                onChange={e => handleRowChange(idx, 'price', e.target.value)}
                                placeholder="0.00"
                                className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-400 min-w-[100px]"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₹</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={row.special_price}
                                onChange={e => handleRowChange(idx, 'special_price', e.target.value)}
                                placeholder="Optional"
                                className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-green-500 focus:border-green-400 min-w-[100px]"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center bg-white shrink-0 relative">
                                {row.image ? (
                                  <img src={getImageUrl(row.image)} alt="" className="w-full h-full object-contain" />
                                ) : (
                                  <span className="text-[9px] text-gray-400 font-bold uppercase">No Img</span>
                                )}
                                {uploadingRowIdx === idx && (
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <Loader2 size={14} className="text-white animate-spin" />
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded cursor-pointer transition-colors shadow-sm text-center" title="Upload Image">
                                  <ImageIcon size={13} className="mx-auto" />
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => handleVariantImageUpload(idx, e.target.files?.[0])}
                                    disabled={uploadingRowIdx === idx}
                                    className="hidden"
                                  />
                                </label>
                                {row.image && (
                                  <button
                                    type="button"
                                    onClick={() => handleRowChange(idx, 'image', '')}
                                    className="p-1 bg-red-50 hover:bg-red-100 text-red-500 rounded transition-colors shadow-sm text-center"
                                    title="Remove Image"
                                  >
                                    <X size={13} className="mx-auto" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <input
                              type="number"
                              min="0"
                              value={row.stock}
                              onChange={e => handleRowChange(idx, 'stock', e.target.value)}
                              placeholder="0"
                              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-purple-500 min-w-[70px]"
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <input
                              type="text"
                              value={row.sku}
                              onChange={e => handleRowChange(idx, 'sku', e.target.value)}
                              placeholder="SKU"
                              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-purple-500 min-w-[80px]"
                            />
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {isExisting ? (
                              <button
                                onClick={() => handleDeleteVariant(row.id, idx)}
                                disabled={isDeleting}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors disabled:opacity-50"
                                title="Delete variant from database"
                              >
                                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                              </button>
                            ) : (
                              rows.length > 1 && (
                                <button
                                  onClick={() => removeRow(idx)}
                                  className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-lg transition-colors"
                                  title="Remove row"
                                >
                                  <X size={14} />
                                </button>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Info + Save */}
              <div className="px-6 py-4 bg-gray-50 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-xs text-gray-500 space-y-0.5">
                  <p>🟢 <strong>Green rows</strong> = already saved in the database</p>
                  <p>🔵 <strong>Blue rows</strong> = new variants to be added</p>
                  <p>💡 <strong>Special Price</strong> is the discounted selling price (leave blank to use MRP)</p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold rounded-lg transition-colors shadow-sm text-sm shrink-0"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Saving...' : 'Save All Variants'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Preview card of what the customer sees */}
      {variants.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-[#4e5e7a] mb-4 pb-2 border-b text-sm flex items-center gap-2">
            <CheckCircle size={16} className="text-green-500" />
            Customer Preview — Weight Pills on Product Page
          </h3>
          <p className="text-xs text-gray-400 mb-3">This is how customers will see weight options on the product details page:</p>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-bold text-gray-700">Weight :</span>
            <div className="flex gap-2 flex-wrap">
              {variants
                .filter(v => v.weight)
                .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
                .map((v, i) => (
                  <div key={v.id} className={`flex flex-col items-center gap-0.5`}>
                    <button
                      className={`px-4 py-1.5 rounded-md font-semibold text-xs border-2 transition-all duration-200 ${
                        i === 0
                          ? 'bg-[#f5f3ff] text-purple-700 border-purple-600 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-300'
                      } ${v.stock <= 0 ? 'opacity-65 border-dashed border-red-300' : ''}`}
                    >
                      {v.weight}
                    </button>
                    <span className="hidden">
                      {v.special_price && v.special_price < v.price
                        ? <>₹{Number(v.special_price).toFixed(0)} <span className="line-through text-gray-400">₹{Number(v.price).toFixed(0)}</span></>
                        : `₹${Number(v.price).toFixed(0)}`
                      }
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
