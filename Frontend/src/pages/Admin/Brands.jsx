import { useState, useEffect, useMemo } from 'react';
import { 
  Search, RefreshCw, ListFilter, Download, 
  Upload, MoreVertical, Image
} from 'lucide-react';
import api from '../../lib/api';
import MediaLibraryModal from '../../components/MediaLibraryModal';
import { getImageUrl } from '../../lib/imageUrl';

export default function Brands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [actionBrandId, setActionBrandId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [selectedMediaPath, setSelectedMediaPath] = useState(null);
  const [showMediaModal, setShowMediaModal] = useState(false);

  // Fetch Brands
  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    const closeMenu = () => setActionBrandId(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/brands');
      setBrands(response.data || []);
    } catch (err) {
      console.error("Error fetching brands:", err);
    } finally {
      setLoading(false);
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

  const resetForm = () => {
    setFormData({ name: '' });
    setImagePreview(null);
    setImageFile(null);
    setSelectedMediaPath(null);
    setEditingBrand(null);
  };

  const startEdit = (brand) => {
    setEditingBrand(brand);
    setFormData({ name: brand.name || '' });
    setImagePreview(brand.image ? getImageUrl(brand.image) : null);
    setImageFile(null);
    setSelectedMediaPath(brand.image || null);
    setActionBrandId(null);
  };

  const handleDeleteBrand = async (brand) => {
    const confirmed = window.confirm(`Delete brand "${brand.name}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setLoading(true);
      await api.delete(`/admin/brands/${brand.id}`);
      await fetchBrands();
      if (editingBrand?.id === brand.id) {
        resetForm();
      }
    } catch (err) {
      console.error('Error deleting brand:', err);
      alert(err.response?.data?.message || 'Failed to delete brand');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (brand) => {
    const nextStatus = Number(brand.status) ? 0 : 1;

    setBrands((prev) =>
      prev.map((item) =>
        item.id === brand.id ? { ...item, status: nextStatus } : item
      )
    );

    try {
      setStatusUpdatingId(brand.id);
      await api.put(`/admin/brands/${brand.id}`, { status: nextStatus });
    } catch (err) {
      setBrands((prev) =>
        prev.map((item) =>
          item.id === brand.id ? { ...item, status: brand.status } : item
        )
      );
      console.error('Error updating status:', err);
      alert(err.response?.data?.message || 'Failed to update brand status');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const filteredBrands = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return brands.filter((brand) => {
      const isActive = Number(brand.status) === 1;
      if (!showInactive && !isActive) return false;
      if (!term) return true;

      return (
        String(brand.id).includes(term) ||
        (brand.name || '').toLowerCase().includes(term)
      );
    });
  }, [brands, searchTerm, showInactive]);

  const downloadCsv = () => {
    const lines = [
      ['ID', 'NAME', 'STATUS', 'IMAGE'],
      ...filteredBrands.map((brand) => [
        brand.id,
        `"${(brand.name || '').replace(/"/g, '""')}"`,
        Number(brand.status) ? 'ON' : 'OFF',
        brand.image || '',
      ]),
    ];

    const csvContent = lines.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'brands.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a brand name');
      return;
    }
    if (!imageFile && !selectedMediaPath) {
      alert('Please select an image from media or upload one');
      return;
    }
    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('name', formData.name.trim());
      if (imageFile) {
        data.append('image', imageFile);
      } else if (selectedMediaPath) {
        data.append('imagePath', selectedMediaPath);
      }

      if (editingBrand?.id) {
        await api.put(`/admin/brands/${editingBrand.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/admin/brands', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      resetForm();
      await fetchBrands();
    } catch (err) {
      console.error('Error saving brand:', err);
      alert(err.response?.data?.message || 'Failed to save brand');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-700">Manage Brands</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Home</span>
          <span>/</span>
          <span className="font-semibold text-purple-600">Brands</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT SIDE: Add / Edit Brand Form */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Brand Name"
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Main Image <span className="text-red-500">*</span>
                  <span className="text-[10px] lowercase font-normal ml-1">(Recommended Size : 131 x 131 pixels)</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setShowMediaModal(true)}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
                  >
                    <Image size={16} /> Select from Media
                  </button>
                  <label
                    htmlFor="brandImage"
                    className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer hover:bg-gray-700 transition-colors"
                  >
                    <Upload size={16} /> Upload New
                    <input type="file" id="brandImage" hidden accept="image/*" onChange={handleImageChange} />
                  </label>
                </div>

                {imagePreview && (
                  <div className="mt-3 relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-md border"
                      onError={(e) => { e.target.src = 'https://placehold.co/80x80?text=No+Image'; }}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors shadow-sm"
                  onClick={resetForm}
                >
                  {editingBrand ? 'Cancel Edit' : 'Reset'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#6BCB44] text-white py-2.5 rounded-lg text-sm font-bold hover:bg-green-600 transition-colors shadow-sm disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : editingBrand ? 'Update Brand' : 'Add Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT SIDE: Brands Table */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-lg font-bold text-slate-700">Brands</h3>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-purple-500 outline-none w-full md:w-64"
                  />
                </div>
                <div className="flex bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={fetchBrands}
                    title="Refresh"
                    className="p-1.5 text-gray-600 hover:bg-white rounded-md transition-all shadow-sm"
                  >
                    <RefreshCw size={18} />
                  </button>
                  <button
                    title={showInactive ? 'Showing all statuses' : 'Showing only active'}
                    onClick={() => setShowInactive((prev) => !prev)}
                    className={`p-1.5 rounded-md transition-all shadow-sm flex items-center gap-1 ${showInactive ? 'bg-white text-purple-600' : 'text-gray-600 hover:bg-white'}`}
                  >
                    <ListFilter size={18} />
                    <span className="text-[10px] font-bold">{showInactive ? 'ALL' : 'ON'}</span>
                  </button>
                  <button
                    onClick={downloadCsv}
                    title="Download CSV"
                    className="p-1.5 text-gray-600 hover:bg-white rounded-md transition-all shadow-sm flex items-center gap-1"
                  >
                    <Download size={18} />
                    <span className="text-[10px] font-bold">CSV</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 border-r last:border-r-0">ID</th>
                    <th className="px-6 py-4 border-r last:border-r-0">NAME</th>
                    <th className="px-6 py-4 border-r last:border-r-0 text-center">IMAGE</th>
                    <th className="px-6 py-4 border-r last:border-r-0">STATUS</th>
                    <th className="px-6 py-4 text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-20 text-center text-gray-400 italic">
                        Loading brands...
                      </td>
                    </tr>
                  ) : filteredBrands.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-20 text-center text-gray-400 italic">
                        No matching records found
                      </td>
                    </tr>
                  ) : (
                    filteredBrands.map((brand) => {
                      const isActive = Number(brand.status) === 1;
                      return (
                        <tr key={brand.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 text-purple-600 font-medium">#{brand.id}</td>
                          <td className="px-6 py-4 font-semibold text-slate-700">{brand.name}</td>
                          <td className="px-6 py-4">
                            <div className="w-12 h-12 mx-auto bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                              {brand.image ? <img src={getImageUrl(brand.image)} alt="" className="w-full h-full object-cover" /> : <span className="text-[8px] text-gray-400">NO IMAGE</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={isActive}
                                  disabled={statusUpdatingId === brand.id}
                                  onChange={() => handleStatusToggle(brand)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                              </label>
                              <span className={`text-xs font-bold ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
                                {isActive ? 'ON' : 'OFF'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div
                              className="relative inline-block"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => setActionBrandId((prev) => (prev === brand.id ? null : brand.id))}
                                className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all"
                              >
                                <MoreVertical size={18} />
                              </button>
                              {actionBrandId === brand.id && (
                                <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 z-10 py-1">
                                  <button
                                    onClick={() => startEdit(brand)}
                                    className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBrand(brand)}
                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <MediaLibraryModal
        open={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onSelect={handleMediaSelect}
      />
    </div>
  );
}