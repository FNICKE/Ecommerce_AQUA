import { useState, useEffect } from 'react';
import { 
  Search, RefreshCw, ListFilter, Download, Plus,
  Trash2, Edit2, X, Image as ImageIcon, Upload, Check, AlertCircle, Sparkles
} from 'lucide-react';
import api from '../../lib/api';
import MediaLibraryModal from '../../components/MediaLibraryModal';
import { getImageUrl } from '../../lib/imageUrl';

export default function PromoCodes() {
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedId, setSelectedId] = useState(null);
  
  // Modal Tab State
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'discount' | 'limits' | 'targeting'

  // Media Modal State
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [selectedMediaPath, setSelectedMediaPath] = useState(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    promo_code: '',
    message: '',
    start_date: '',
    end_date: '',
    no_of_users: '',
    minimum_order_amount: '',
    discount: '',
    discount_type: 'percentage', // 'percentage' | 'amount'
    max_discount_amount: '',
    repeat_usage: '0', // '1' | '0'
    no_of_repeat_usage: '',
    status: 1, // 1 | 0
    is_cashback: 0, // 1 | 0
    list_promocode: 1, // 1 | 0
    is_specific_users: 0, // 1 | 0
    users_id: ''
  });

  // Fetch Promo Codes
  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/promo-codes');
      if (response.data?.success) {
        setPromoCodes(response.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching promo codes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    try {
      // Optimistically update frontend state
      setPromoCodes(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
      
      const response = await api.put(`/admin/promo-codes/${id}/status`, { status: newStatus });
      if (!response.data?.success) {
        // Rollback on failure
        setPromoCodes(prev => prev.map(p => p.id === id ? { ...p, status: currentStatus } : p));
      }
    } catch (err) {
      console.error("Error toggling status:", err);
      // Rollback on failure
      setPromoCodes(prev => prev.map(p => p.id === id ? { ...p, status: currentStatus } : p));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      setImageFile(file);
      setSelectedMediaPath(null);
    }
  };

  const handleMediaSelect = (item) => {
    setImagePreview(item.url);
    setSelectedMediaPath(item.path);
    setImageFile(null);
  };

  const openAddModal = () => {
    setModalMode('add');
    setSelectedId(null);
    setActiveTab('general');
    setImagePreview(null);
    setImageFile(null);
    setSelectedMediaPath(null);
    setFormData({
      promo_code: '',
      message: '',
      start_date: '',
      end_date: '',
      no_of_users: '',
      minimum_order_amount: '',
      discount: '',
      discount_type: 'percentage',
      max_discount_amount: '',
      repeat_usage: '0',
      no_of_repeat_usage: '',
      status: 1,
      is_cashback: 0,
      list_promocode: 1,
      is_specific_users: 0,
      users_id: ''
    });
    setShowModal(true);
  };

  const openEditModal = (promo) => {
    setModalMode('edit');
    setSelectedId(promo.id);
    setActiveTab('general');
    setImageFile(null);
    
    if (promo.image) {
      setImagePreview(getImageUrl(promo.image));
      setSelectedMediaPath(promo.image);
    } else {
      setImagePreview(null);
      setSelectedMediaPath(null);
    }

    // Helper to format date string to datetime-local inputs
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      // If it has format 'YYYY-MM-DD HH:MM:SS' or similar
      return dateStr.substring(0, 16).replace(' ', 'T');
    };

    setFormData({
      promo_code: promo.promo_code || '',
      message: promo.message || '',
      start_date: formatDate(promo.start_date),
      end_date: formatDate(promo.end_date),
      no_of_users: promo.no_of_users || '',
      minimum_order_amount: promo.minimum_order_amount || '',
      discount: promo.discount || '',
      discount_type: promo.discount_type || 'percentage',
      max_discount_amount: promo.max_discount_amount || '',
      repeat_usage: String(promo.repeat_usage || '0'),
      no_of_repeat_usage: promo.no_of_repeat_usage || '',
      status: promo.status || 1,
      is_cashback: promo.is_cashback || 0,
      list_promocode: promo.list_promocode || 1,
      is_specific_users: promo.is_specific_users || 0,
      users_id: promo.users_id || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this promo code?")) return;
    try {
      const response = await api.delete(`/admin/promo-codes/${id}`);
      if (response.data?.success) {
        setPromoCodes(prev => prev.filter(p => p.id !== id));
      } else {
        alert(response.data?.message || "Failed to delete promo code");
      }
    } catch (err) {
      console.error("Error deleting promo code:", err);
      alert("An error occurred while deleting the promo code.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.promo_code.trim()) {
      setActiveTab('general');
      alert("Promo Code is required");
      return;
    }

    if (!formData.discount) {
      setActiveTab('discount');
      alert("Discount value is required");
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();

      // Append all form values
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });

      if (imageFile) {
        data.append('image', imageFile);
      } else if (selectedMediaPath) {
        data.append('imagePath', selectedMediaPath);
      }

      let response;
      if (modalMode === 'add') {
        response = await api.post('/admin/promo-codes', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await api.put(`/admin/promo-codes/${selectedId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (response.data?.success) {
        setShowModal(false);
        fetchPromoCodes();
      } else {
        alert(response.data?.message || "Operation failed");
      }
    } catch (err) {
      console.error("Error saving promo code:", err);
      alert(err.response?.data?.message || "Failed to save promo code");
    } finally {
      setLoading(false);
    }
  };

  // Filter promo codes based on search
  const filteredPromoCodes = promoCodes.filter(promo => 
    promo.promo_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (promo.message && promo.message.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold text-slate-700">Manage Promo Code</h1>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
          <span>Home</span>
          <span>/</span>
          <span className="font-semibold text-purple-600">Manage Promo Code</span>
        </div>
      </div>

      {/* Main Card Wrapper */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
        
        {/* Control Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <button 
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-sm w-fit"
          >
            <Plus size={16} /> Add Promo Code
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 outline-none w-full"
              />
            </div>
            
            <div className="flex bg-slate-100 rounded-xl p-1 shrink-0">
              <button 
                onClick={fetchPromoCodes} 
                className="p-2 text-gray-600 hover:bg-white hover:text-purple-600 rounded-lg transition-all shadow-sm"
                title="Reload"
              >
                <RefreshCw size={18} />
              </button>
              <button className="p-2 text-gray-600 hover:bg-white rounded-lg transition-all shadow-sm flex items-center gap-1">
                <ListFilter size={18} />
                <span className="text-[9px] font-bold">▼</span>
              </button>
              <button className="p-2 text-gray-600 hover:bg-white rounded-lg transition-all shadow-sm flex items-center gap-1">
                <Download size={18} />
                <span className="text-[9px] font-bold">▼</span>
              </button>
            </div>
          </div>
        </div>

        {/* Responsive Horizontal Table */}
        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-left text-[13px] whitespace-nowrap">
            <thead className="bg-slate-50/75 text-gray-500 font-bold border-b border-gray-100 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-4 border-r border-gray-100 last:border-r-0">ID <span className="text-[9px] ml-1">▼</span></th>
                <th className="px-6 py-4 border-r border-gray-100 last:border-r-0">USER ID</th>
                <th className="px-6 py-4 border-r border-gray-100 last:border-r-0">PROMO CODE</th>
                <th className="px-6 py-4 border-r border-gray-100 text-center last:border-r-0">IMAGE</th>
                <th className="px-6 py-4 border-r border-gray-100 last:border-r-0">MESSAGE</th>
                <th className="px-6 py-4 border-r border-gray-100 last:border-r-0">START DATE</th>
                <th className="px-6 py-4 border-r border-gray-100 last:border-r-0">END DATE</th>
                <th className="px-6 py-4 border-r border-gray-100 last:border-r-0">DISCOUNT</th>
                <th className="px-6 py-4 border-r border-gray-100 last:border-r-0">DISCOUNT TYPE</th>
                <th className="px-6 py-4 border-r border-gray-100 last:border-r-0">STATUS</th>
                <th className="px-6 py-4 border-r border-gray-100 last:border-r-0">IS CASHBACK</th>
                <th className="px-6 py-4 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPromoCodes.length === 0 ? (
                <tr>
                  <td colSpan="12" className="px-6 py-24 text-center text-gray-400 italic bg-gray-50/20 font-medium">
                    No matching records found
                  </td>
                </tr>
              ) : (
                filteredPromoCodes.map((promo) => (
                  <tr key={promo.id} className="hover:bg-purple-50/10 transition-colors">
                    <td className="px-6 py-4 text-purple-600 font-bold">#{promo.id}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{promo.is_specific_users ? promo.users_id : 'All Users'}</td>
                    <td className="px-6 py-4 font-extrabold text-slate-800 tracking-wide bg-purple-50/20">{promo.promo_code}</td>
                    <td className="px-6 py-3 text-center">
                      <div className="w-12 h-12 mx-auto bg-slate-50 rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden">
                        {promo.image ? (
                          <img src={getImageUrl(promo.image)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[8px] text-gray-400 font-bold uppercase">NO IMAGE</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate" title={promo.message}>{promo.message || '-'}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-semibold">{promo.start_date || '-'}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-semibold">{promo.end_date || '-'}</td>
                    <td className="px-6 py-4 text-purple-700 font-bold">{promo.discount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        promo.discount_type === 'percentage' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {promo.discount_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleStatusToggle(promo.id, promo.status)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          promo.status ? 'bg-purple-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          promo.status ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        promo.is_cashback ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-50 text-gray-500 border border-gray-100'
                      }`}>
                        {promo.is_cashback ? 'YES' : 'NO'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center gap-1">
                        <button 
                          onClick={() => openEditModal(promo)}
                          className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button 
                          onClick={() => handleDelete(promo.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 size={15} />
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

      {/* Slide-Over or Tabbed Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] scale-in duration-300">
            {/* Modal Header */}
            <div className="bg-purple-600 px-6 py-4 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-purple-200" />
                <h3 className="font-bold text-lg">{modalMode === 'add' ? 'Add New Promo Code' : 'Edit Promo Code'}</h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white p-1 hover:bg-purple-700/50 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Tabs Row */}
            <div className="bg-slate-50 border-b border-gray-100 px-6 py-2 flex items-center gap-1 overflow-x-auto scrollbar-hide shrink-0">
              {[
                { id: 'general', label: 'General Info' },
                { id: 'discount', label: 'Discount & Cashback' },
                { id: 'limits', label: 'Dates & Limits' },
                { id: 'targeting', label: 'Targeting' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-all tracking-wider ${
                    activeTab === tab.id 
                      ? 'bg-purple-100 text-purple-700 shadow-sm'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* TAB 1: GENERAL INFO */}
              {activeTab === 'general' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                        Promo Code <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. JIJAINEW50"
                        value={formData.promo_code}
                        onChange={(e) => setFormData({...formData, promo_code: e.target.value.toUpperCase()})}
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-extrabold uppercase tracking-widest text-purple-700 bg-purple-50/10"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                        Promo Message / Description
                      </label>
                      <textarea 
                        rows="3"
                        placeholder="Explain the offer details..."
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all resize-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Image File</label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => setShowMediaModal(true)}
                          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors shadow-sm"
                        >
                          <ImageIcon size={14} /> Select Media
                        </button>
                        <label 
                          htmlFor="promoImage"
                          className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-800 transition-colors shadow-sm"
                        >
                          <Upload size={14} /> Upload Custom
                          <input type="file" id="promoImage" hidden accept="image/*" onChange={handleImageChange} />
                        </label>
                      </div>

                      {imagePreview && (
                        <div className="relative inline-block border border-gray-200 rounded-xl overflow-hidden bg-slate-50 p-1">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-24 h-24 object-cover rounded-lg"
                            onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Error'; }}
                          />
                          <button
                            type="button"
                            onClick={() => { setImagePreview(null); setImageFile(null); setSelectedMediaPath(null); }}
                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Status</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, status: 1})}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                              formData.status === 1 
                                ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            Active
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, status: 0})}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                              formData.status === 0
                                ? 'bg-red-500 border-red-500 text-white shadow-sm'
                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            Inactive
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">List on Public Page</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, list_promocode: 1})}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                              formData.list_promocode === 1
                                ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, list_promocode: 0})}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                              formData.list_promocode === 0
                                ? 'bg-slate-700 border-slate-700 text-white shadow-sm'
                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            No
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DISCOUNT & CASHBACK */}
              {activeTab === 'discount' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Discount Type</label>
                      <select
                        value={formData.discount_type}
                        onChange={(e) => setFormData({...formData, discount_type: e.target.value})}
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none bg-white transition-all font-semibold"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="amount">Flat Amount (Currency)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                        Discount Value <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="number" 
                        required
                        step="0.01"
                        placeholder={formData.discount_type === 'percentage' ? 'e.g. 10 (%)' : 'e.g. 150 (amount)'}
                        value={formData.discount}
                        onChange={(e) => setFormData({...formData, discount: e.target.value})}
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Minimum Order Amount</label>
                      <input 
                        type="number" 
                        step="0.01"
                        placeholder="e.g. 499 (leaves empty for none)"
                        value={formData.minimum_order_amount}
                        onChange={(e) => setFormData({...formData, minimum_order_amount: e.target.value})}
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-semibold"
                      />
                    </div>

                    {formData.discount_type === 'percentage' && (
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Maximum Discount Amount</label>
                        <input 
                          type="number" 
                          step="0.01"
                          placeholder="e.g. 200 (capped discount amount)"
                          value={formData.max_discount_amount}
                          onChange={(e) => setFormData({...formData, max_discount_amount: e.target.value})}
                          className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-semibold"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Is Cashback Promo?</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, is_cashback: 1})}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                            formData.is_cashback === 1
                              ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          Yes, Cashback
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, is_cashback: 0})}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                            formData.is_cashback === 0
                              ? 'bg-slate-700 border-slate-700 text-white shadow-sm'
                              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          No, standard discount
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: DATES & LIMITS */}
              {activeTab === 'limits' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Start Date</label>
                      <input 
                        type="datetime-local" 
                        value={formData.start_date}
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">End Date</label>
                      <input 
                        type="datetime-local" 
                        value={formData.end_date}
                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Total Usage Limit (No. of users)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 1000 users maximum"
                        value={formData.no_of_users}
                        onChange={(e) => setFormData({...formData, no_of_users: e.target.value})}
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Repeat Usage allowed per user?</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, repeat_usage: '1'})}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                            formData.repeat_usage === '1'
                              ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          Yes, Allow repeat
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, repeat_usage: '0', no_of_repeat_usage: ''})}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                            formData.repeat_usage === '0'
                              ? 'bg-slate-700 border-slate-700 text-white shadow-sm'
                              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          No, Once only
                        </button>
                      </div>
                    </div>

                    {formData.repeat_usage === '1' && (
                      <div className="animate-in slide-in-from-top duration-200">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">No. of Repeat Usages per user</label>
                        <input 
                          type="number" 
                          required
                          placeholder="e.g. 3 times maximum"
                          value={formData.no_of_repeat_usage}
                          onChange={(e) => setFormData({...formData, no_of_repeat_usage: e.target.value})}
                          className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-semibold"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: TARGETING */}
              {activeTab === 'targeting' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Target Audience</label>
                    <div className="flex gap-2 w-full md:w-1/2">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, is_specific_users: 0, users_id: ''})}
                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold border transition-all ${
                          formData.is_specific_users === 0
                            ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        All Registered Users
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, is_specific_users: 1})}
                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold border transition-all ${
                          formData.is_specific_users === 1
                            ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        Specific Users Only
                      </button>
                    </div>
                  </div>

                  {formData.is_specific_users === 1 && (
                    <div className="space-y-2 max-w-2xl animate-in slide-in-from-top duration-200">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Specific User IDs <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        required={formData.is_specific_users === 1}
                        placeholder="e.g. 102, 105, 208 (comma separated IDs)"
                        value={formData.users_id}
                        onChange={(e) => setFormData({...formData, users_id: e.target.value})}
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-semibold"
                      />
                      <div className="flex items-start gap-1.5 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 font-medium">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <span>Please enter the database ID numbers of the users who are allowed to use this coupon. Separate multiple IDs with a comma.</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Actions Footer */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-bold hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-purple-700 transition-colors text-sm shadow-sm disabled:opacity-60"
                >
                  {loading ? 'Saving...' : modalMode === 'add' ? 'Create Coupon' : 'Update Coupon'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Media Modal Selector */}
      <MediaLibraryModal
        open={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onSelect={handleMediaSelect}
      />
    </div>
  );
}
