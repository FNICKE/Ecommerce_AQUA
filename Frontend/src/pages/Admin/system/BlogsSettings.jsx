import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { 
  BookOpen, FileText, Trash2, Plus, 
  Loader2, ArrowLeft, Image as ImageIcon, AlertCircle, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BlogsSettings() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/blogs');
      setBlogs(res.data.blogs || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and written Content are required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await api.post('/admin/blogs', {
        title: title.trim(),
        content: content.trim(),
        image: imageUrl.trim() || null
      });

      setSuccess('Blog post added successfully!');
      setTitle('');
      setContent('');
      setImageUrl('');
      
      // Auto dismiss success toast and reload
      setTimeout(() => setSuccess(null), 3000);
      fetchBlogs();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to add blog post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;

    try {
      setError(null);
      await api.delete(`/admin/blogs/${id}`);
      setSuccess('Blog post deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
      fetchBlogs();
    } catch (err) {
      console.error(err);
      setError('Failed to delete blog post');
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
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 m-0">Written Blogs Settings</h2>
            <p className="text-xs text-gray-500 mt-0.5">Write and edit articles displayed to your customers</p>
          </div>
        </div>
        <div className="text-sm text-gray-400 self-start sm:self-center">
          System / <span className="text-slate-600 dark:text-slate-300">Blogs Settings</span>
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
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 m-0">Write a New Blog</h3>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Blog Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 dark:text-slate-400">Blog Title / Name *</label>
              <div className="relative">
                <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Benefits of Pure Turmeric Powder"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Written Blog Content */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 dark:text-slate-400">Written Blog Content *</label>
              <textarea 
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Write your blog contents here..."
                rows={10}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 resize-none dark:text-slate-100"
              />
            </div>

            {/* Image Banner URL */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 dark:text-slate-400">Blog Banner Image URL</label>
              <div className="relative">
                <ImageIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="Paste image URL/address or leave empty"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 border-none cursor-pointer hover:shadow-lg transition-all disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <BookOpen size={16} />}
              {submitting ? 'Publishing Blog...' : 'Publish Blog Post'}
            </button>
          </form>
        </div>

        {/* Right Column: Blog Listing Cards */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-700">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 m-0">Written Blogs List ({blogs.length})</h3>
            <p className="text-xs text-gray-400">Active blog posts</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={36} className="text-purple-600 animate-spin" />
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <BookOpen size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="font-semibold text-sm">No blog posts written yet</p>
              <p className="text-xs text-gray-400 mt-1">Publish your first blog post using the form on the left.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {blogs.map((b) => (
                <div 
                  key={b.id}
                  className="p-4 rounded-xl border border-gray-100 dark:border-slate-700 hover:shadow-sm transition-shadow flex flex-col md:flex-row gap-4 relative bg-gray-50/50 dark:bg-slate-900/50 group"
                >
                  {/* Delete Button */}
                  <button 
                    onClick={() => handleDelete(b.id)}
                    className="absolute top-3 right-3 p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border-none cursor-pointer z-10"
                    title="Delete Blog"
                  >
                    <Trash2 size={14} />
                  </button>

                  {/* Thumbnail Image */}
                  <div className="w-full md:w-32 h-24 rounded-lg overflow-hidden bg-purple-100 shrink-0 border border-purple-200/50 flex items-center justify-center">
                    {b.image ? (
                      <img 
                        src={b.image} 
                        alt={b.title} 
                        className="w-full h-full object-cover"
                        onError={e => { e.target.src = ''; }}
                      />
                    ) : (
                      <BookOpen size={24} className="text-purple-600" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 pr-8">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate mb-1.5">{b.title}</h4>
                    <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                      {b.content}
                    </p>
                    <span className="text-[10px] text-gray-400 mt-2 block">
                      Published on {new Date(b.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
