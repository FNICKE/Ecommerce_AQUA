import React, { useState, useEffect } from 'react';
import { X, Search, RotateCcw, Upload, CheckCircle } from 'lucide-react';
import api from '../lib/api';
import { getImageUrl } from '../lib/imageUrl';

const PLACEHOLDER_SVG = 'data:image/svg+xml;utf8,<svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="150" height="150" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="18" fill="%239ca3af">No Image</text></svg>';

export default function MediaLibraryModal({ open, onClose, onSelect }) {
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);

  useEffect(() => {
    if (open) {
      fetchMedia();
    }
  }, [open]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await api.get('/media');
      if (res.data.success) {
        const imagesOnly = (res.data.data || []).filter(item =>
          item.type?.startsWith('image/') ||
          ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(String(item.extension || '').toLowerCase())
        );
        setMediaItems(imagesOnly);
      }
    } catch (err) {
      console.error('Failed to load media:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = mediaItems.filter(item =>
    (item.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (item) => {
    const isExternal = item.path && (item.path.startsWith('http://') || item.path.startsWith('https://'));
    const path = isExternal ? item.path : `${item.path || ''}${item.name || ''}`.replace(/\/+/g, '/');
    onSelect({
      id: item.id,
      path,
      name: item.name,
      url: getImageUrl(path),
    });
    onClose();
  };

  const handleFileSelect = (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length) setPendingFiles(prev => [...prev, ...files]);
  };

  const handleUpload = async () => {
    if (pendingFiles.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    pendingFiles.forEach(f => formData.append('files', f));
    try {
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setPendingFiles([]);
        fetchMedia();
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="text-xl font-semibold text-gray-800">Select from Media Library</h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search & Upload */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search media..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button onClick={fetchMedia} className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50" title="Refresh">
              <RotateCcw size={18} />
            </button>
            <label className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2">
              <Upload size={18} />
              Upload New
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} />
            </label>
          </div>
          {pendingFiles.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{pendingFiles.length} file(s) selected</span>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
              <button onClick={() => setPendingFiles([])} className="text-gray-600 hover:text-gray-800 text-sm">Clear</button>
            </div>
          )}
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <RotateCcw size={32} className="animate-spin mb-3 text-purple-600" />
              <p className="text-gray-600">Loading media...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <p>{searchQuery ? 'No matching images found' : 'No images in library yet. Upload some above.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredItems.map(item => {
                const path = item.imagePath || item.url || `${item.path || ''}${item.name || ''}`;
                const fullUrl = getImageUrl(path, PLACEHOLDER_SVG);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="group relative cursor-pointer rounded-lg overflow-hidden border-2 border-gray-200 hover:border-purple-400 hover:shadow-lg transition-all duration-200"
                  >
                    <img
                      src={fullUrl}
                      alt={item.name}
                      className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.src = PLACEHOLDER_SVG; }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <p className="text-white text-xs truncate font-medium">{item.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
