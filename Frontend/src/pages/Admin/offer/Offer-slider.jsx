import React, { useState, useEffect } from 'react';
import { Search, RotateCw, Trash2, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../../lib/api';
import { getImageUrl } from '../../../lib/imageUrl';
import MediaLibraryModal from '../../../components/MediaLibraryModal';

const OfferSlider = () => {
  const [sliders, setSliders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  
  const [formData, setFormData] = useState({
    type: 'categories',
    typeId: '',
    image: '',
    link: ''
  });

  const [showMediaModal, setShowMediaModal] = useState(false);

  useEffect(() => {
    fetchSliders();
    fetchCategories();
  }, []);

  const fetchSliders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/offers/sliders');
      if (res.data.success) {
        setSliders(res.data.sliders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories?include_subcategories=false');
      if (res.data.success) {
        setCategories(res.data.categories || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 3000);
  };

  const handleSelectMedia = (item) => {
    const path = item.imagePath || item.url || `${item.path}${item.name}`;
    setFormData({ ...formData, image: path });
    setShowMediaModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image) return showFeedback('error', 'Select an image');

    try {
      setLoading(true);
      const res = await api.post('/offers/sliders', formData);
      if (res.data.success) {
        showFeedback('success', 'Slider section added');
        setFormData({ type: 'categories', typeId: '', image: '', link: '' });
        fetchSliders();
      }
    } catch (err) {
      console.error('Submit offer slider failed:', err);
      showFeedback('error', 'Failed to add');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this slider?')) return;
    try {
      await api.delete(`/offers/sliders/${id}`); 
      showFeedback('success', 'Deleted');
      fetchSliders();
    } catch (err) {
      console.error('Delete offer slider failed:', err);
      showFeedback('error', 'Failed to delete');
    }
  };


  return (
    <div className="flex flex-col gap-6 p-2">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-700">Manage offer slider</h2>
        <div className="text-sm text-gray-500">
          Home / <span className="text-slate-700">Offer slider</span>
        </div>
      </div>

      {feedback.message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${feedback.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <p className="font-medium">{feedback.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Style/Type</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="categories">Category Slider</option>
                  <option value="default">Default</option>
                </select>
              </div>

              {formData.type === 'categories' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    value={formData.typeId}
                    onChange={(e) => setFormData({...formData, typeId: e.target.value})}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-xs">Image (Recommended 1648x342)</label>
                <div className="flex flex-col gap-2">
                    {formData.image && <img src={getImageUrl(formData.image)} className="w-full h-20 object-cover rounded" alt="Preview"/>}
                    <button type="button" onClick={() => setShowMediaModal(true)} className="w-full py-2 border-2 border-dashed rounded text-gray-500 text-sm hover:bg-gray-50 flex items-center justify-center gap-2">
                        <Upload size={14}/> {formData.image ? 'Change' : 'Select'}
                    </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setFormData({type:'categories', typeId:'', image:'', link:''})} className="flex-1 bg-amber-500 text-white py-2 rounded text-sm">Reset</button>
                <button type="submit" disabled={loading} className="flex-1 bg-lime-500 text-white py-2 rounded text-sm flex items-center justify-center gap-2">
                    {loading && <RotateCw size={14} className="animate-spin"/>} Add
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 flex justify-between items-center border-b">
               <h3 className="font-medium text-slate-600">Active Sliders</h3>
               <button onClick={fetchSliders} className="p-1 hover:bg-gray-100 rounded"><RotateCw size={16} className={loading ? 'animate-spin' : ''}/></button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-slate-600 text-xs uppercase font-bold">
                    <th className="px-4 py-3 border-b">ID</th>
                    <th className="px-4 py-3 border-b">IMAGE</th>
                    <th className="px-4 py-3 border-b">TYPE/ID</th>
                    <th className="px-4 py-3 border-b text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm">
                  {sliders.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">{item.id}</td>
                      <td className="px-4 py-4">
                        <img src={getImageUrl(item.image)} className="h-10 w-24 object-cover rounded border" alt="slider"/>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{item.type} {item.type_id ? `(#${item.type_id})` : ''}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                           <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <MediaLibraryModal open={showMediaModal} onClose={() => setShowMediaModal(false)} onSelect={handleSelectMedia} />
    </div>
  );
};

export default OfferSlider;