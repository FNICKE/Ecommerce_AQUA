import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { 
  MessageSquare, Star, User, Trash2, Plus, 
  Loader2, ArrowLeft, Image as ImageIcon, AlertCircle, Sparkles,
  Upload, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../../../lib/imageUrl';

export default function ReviewSettings() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [stars, setStars] = useState(5);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'url'
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/reviews');
      setReviews(res.data.reviews || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !reviewText.trim()) {
      setError('Name and Review content are required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Create FormData
      const fd = new FormData();
      fd.append('name', name.trim());
      if (designation.trim()) {
        fd.append('designation', designation.trim());
      }
      fd.append('review', reviewText.trim());
      fd.append('stars', stars);

      if (uploadMode === 'file') {
        if (imageFile) {
          fd.append('image', imageFile);
        }
      } else {
        if (imageUrl.trim()) {
          fd.append('image', imageUrl.trim());
        }
      }

      await api.post('/admin/reviews', fd, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('Review added successfully!');
      setName('');
      setDesignation('');
      setReviewText('');
      setStars(5);
      setImageUrl('');
      setImageFile(null);
      setImagePreview(null);
      setUploadMode('file');
      
      // Auto dismiss success toast and reload
      setTimeout(() => setSuccess(null), 3000);
      fetchReviews();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to add review');
    } finally {
      setSubmitting(false);
    }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      setError(null);
      await api.delete(`/admin/reviews/${id}`);
      setSuccess('Review deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
      fetchReviews();
    } catch (err) {
      console.error(err);
      setError('Failed to delete review');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/admin/system')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border-none bg-transparent cursor-pointer text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 m-0">Customer Reviews Settings</h2>
            <p className="text-xs text-gray-500 mt-0.5">Add and manage testimonials displayed on the homepage</p>
          </div>
        </div>
        <div className="text-sm text-gray-400 self-start sm:self-center">
          System / <span className="text-slate-600 dark:text-slate-300">Reviews Settings</span>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-4 rounded-xl flex items-center gap-2 text-sm">
          <Sparkles size={16} />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Form Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col gap-5 lg:col-span-1">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-slate-700">
            <Plus size={18} className="text-purple-600" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 m-0">Add Customer Testimonial</h3>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Reviewer Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 dark:text-slate-400">Reviewer Name *</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ramesh Patil"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Designation */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 dark:text-slate-400">Designation / Tagline</label>
              <input 
                type="text" 
                value={designation}
                onChange={e => setDesignation(e.target.value)}
                placeholder="e.g. Verified Buyer or Spices Lover"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 dark:text-slate-100"
              />
            </div>

            {/* Stars Rating */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 dark:text-slate-400">Star Rating *</label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setStars(val)}
                    className="p-1 bg-transparent border-none cursor-pointer"
                  >
                    <Star 
                      size={24} 
                      className={val <= stars ? "fill-amber-400 text-amber-400" : "text-gray-300"} 
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Review Comment */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 dark:text-slate-400">Review Text *</label>
              <textarea 
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="Write the customer's comment..."
                rows={4}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 resize-none dark:text-slate-100"
              />
            </div>

            {/* Image Avatar Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 dark:text-slate-400">Reviewer Avatar Image</label>
              
              <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg w-fit mb-2">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold border-none cursor-pointer transition-all ${uploadMode === 'file' ? 'bg-white dark:bg-slate-800 text-purple-700 shadow-sm' : 'bg-transparent text-gray-500 hover:text-slate-700'}`}
                >
                  Upload Image
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold border-none cursor-pointer transition-all ${uploadMode === 'url' ? 'bg-white dark:bg-slate-800 text-purple-700 shadow-sm' : 'bg-transparent text-gray-500 hover:text-slate-700'}`}
                >
                  Image URL
                </button>
              </div>

              {uploadMode === 'file' ? (
                imagePreview ? (
                  <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-purple-500/30 group">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white border-none cursor-pointer transition-opacity"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 bg-slate-50 dark:bg-slate-900 rounded-xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2">
                    <Upload size={24} className="text-purple-500" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Click to upload avatar</span>
                    <span className="text-[10px] text-gray-400">JPG, PNG or WEBP (Max 5MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setImageFile(file);
                          setImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                )
              ) : (
                <div className="relative">
                  <ImageIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="Paste image address/URL or leave empty"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 dark:text-slate-100"
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 border-none cursor-pointer hover:shadow-lg transition-all disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
              {submitting ? 'Saving Testimonial...' : 'Add Testimonial'}
            </button>
          </form>
        </div>

        {/* Right Column: Review Listing Cards */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-700">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 m-0">Active Testimonials ({reviews.length})</h3>
            <p className="text-xs text-gray-400">Total displayed reviews</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={36} className="text-purple-600 animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <MessageSquare size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="font-semibold text-sm">No testimonials added yet</p>
              <p className="text-xs text-gray-400 mt-1">Create one using the form on the left to show on your homepage.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {reviews.map((rev) => (
                <div 
                  key={rev.id}
                  className="p-4 rounded-xl border border-gray-100 dark:border-slate-700 hover:shadow-sm transition-shadow flex flex-col gap-3 relative bg-gray-50/50 dark:bg-slate-900/50 group"
                >
                  {/* Delete Button */}
                  <button 
                    onClick={() => handleDelete(rev.id)}
                    className="absolute top-3 right-3 p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border-none cursor-pointer"
                    title="Delete Review"
                  >
                    <Trash2 size={14} />
                  </button>

                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center shrink-0 border border-purple-200">
                      {rev.image ? (
                        <img 
                          src={getImageUrl(rev.image)} 
                          alt={rev.name} 
                          className="w-full h-full object-cover"
                          onError={e => { e.target.src = ''; }}
                        />
                      ) : (
                        <User size={18} className="text-purple-600" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{rev.name}</h4>
                      {rev.designation && (
                        <p className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 truncate">{rev.designation}</p>
                      )}
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        size={12} 
                        className={i < rev.stars ? "fill-amber-400 text-amber-400" : "text-gray-300"} 
                      />
                    ))}
                  </div>

                  {/* Review text */}
                  <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                    "{rev.review}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
