import React, { useState, useEffect } from 'react';
import {
  Upload, Search, RotateCcw, Trash2,
  MoreVertical, Download, Grid, List, Edit3, Image as ImageIcon, X
} from 'lucide-react';
import api from '../../lib/api';
import { getImageUrl } from '../../lib/imageUrl';


export default function MediaPage() {
  const ITEMS_PER_PAGE = 10;
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res = await api.get('/media');
      if (res.data.success) {
        setMediaItems(res.data.data || []);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error('Failed to load media:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = mediaItems.filter(item =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files?.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert('No files selected');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        alert(`Uploaded ${res.data.data.length} file(s) successfully`);
        setFiles([]);
        fetchMedia(); // refresh list
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditTitle(item.title || item.name);
    setEditImage(null);
    const currentImageUrl = getImageUrl(item.imagePath || item.thumbnail || item.url || `${item.path}${item.name}`);
    setEditImagePreview(currentImageUrl);
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      alert('Please enter a title');
      return;
    }

    setEditLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', editTitle.trim());
      if (editImage) {
        formData.append('file', editImage);
      }

      const res = await api.put(`/media/${editingItem.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        alert('Media updated successfully');
        setShowEditModal(false);
        setEditingItem(null);
        setEditTitle('');
        setEditImage(null);
        setEditImagePreview(null);
        fetchMedia();
      }
    } catch (err) {
      console.error('Edit failed:', err);
      alert(err.response?.data?.message || 'Failed to update media');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingItem(null);
    setEditTitle('');
    setEditImage(null);
    setEditImagePreview(null);
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete this media file?')) return;
    try {
      await api.delete(`/media/${id}`);
      fetchMedia();
      setOpenMenuId(null);
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected items?`)) return;

    try {
      await Promise.all(selectedIds.map(id => api.delete(`/media/${id}`)));
      setSelectedIds([]);
      fetchMedia();
    } catch (err) {
      console.error(err);
      alert('Bulk delete failed');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Media Details</h2>
        <div className="text-sm text-gray-500">
          Home / <span className="text-purple-600 font-medium">Media</span>
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-6 md:p-8 mb-8">
        <div
          className={`border-2 border-dashed rounded-xl p-10 md:p-16 flex flex-col items-center justify-center transition-all ${
            dragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <label className="cursor-pointer bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold mb-4 transition-colors">
            Select Files
            <input
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/svg+xml,application/pdf"
              className="hidden"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </label>
          <p className="text-gray-600 text-lg font-medium mb-2">or</p>
          <p className="text-gray-800 text-xl md:text-2xl font-bold">Drag & Drop Media Files Here</p>
          {files.length > 0 && (
            <p className="mt-4 text-sm text-gray-600 max-w-md text-center">
              Selected: {files.map(f => f.name).join(', ')}
            </p>
          )}
        </div>

        <div className="flex justify-end mt-6 gap-3">
          {files.length > 0 && (
            <button
              onClick={() => setFiles([])}
              disabled={uploading}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Clear
            </button>
          )}
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            <Upload size={18} />
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 border border-gray-200 rounded-t-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={handleBulkDelete}
          disabled={selectedIds.length === 0}
          className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors"
        >
          <Trash2 size={18} /> Delete Selected
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 border border-gray-300 rounded-lg pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>

          <button onClick={fetchMedia} className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors">
            <RotateCcw size={18} />
          </button>

          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button className="p-2 bg-white text-gray-600 border-r"><Grid size={18} /></button>
            <button className="p-2 bg-gray-700 text-white"><List size={18} /></button>
          </div>

          <button className="p-2 bg-gray-700 text-white rounded-lg">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Media Table */}
      <div className="bg-white rounded-b-xl shadow border border-gray-200 border-t-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
            <RotateCcw size={32} className="animate-spin" />
            Loading media...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
            <ImageIcon size={48} className="opacity-40" />
            {searchQuery ? 'No matching media found' : 'No media uploaded yet'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 w-10"><input type="checkbox" className="rounded" disabled /></th>
                  <th className="p-4 font-semibold text-gray-700">NAME</th>
                  <th className="p-4 font-semibold text-gray-700">PREVIEW</th>
                  <th className="p-4 font-semibold text-gray-700">EXTENSION</th>
                  <th className="p-4 font-semibold text-gray-700">FOLDER</th>
                  <th className="p-4 font-semibold text-gray-700">SIZE</th>
                  <th className="p-4 font-semibold text-gray-700 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedItems.map(item => {
                  const imgSrc = getImageUrl(item.imagePath || item.thumbnail || item.url || `${item.path}${item.name}`);


                  return (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                      </td>
                      <td className="p-4 font-medium text-blue-700 truncate max-w-xs">
                        {item.name}
                      </td>
                      <td className="p-4">
                        <div className="w-20 h-20 border border-gray-200 rounded overflow-hidden bg-gray-50 flex items-center justify-center shadow-sm">
                          <img
                            src={imgSrc}
                            alt={item.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"%3E%3Crect fill="%23f3f4f6" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="10"%3ENo preview%3C/text%3E%3C/svg%3E';
                              e.target.alt = 'Image preview not available';
                            }}
                          />
                        </div>
                      </td>
                      <td className="p-4 text-gray-700 uppercase font-medium text-center">{item.extension}</td>
                      <td className="p-4 text-gray-600 text-sm truncate max-w-xs">{item.path || '—'}</td>
                      <td className="p-4 text-gray-600 text-center">{item.size}</td>
                      <td className="p-4 text-center relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                          className="p-2 hover:bg-purple-50 rounded-full transition-colors"
                        >
                          <MoreVertical size={20} className="text-purple-600" />
                        </button>

                        {openMenuId === item.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                            <div className="absolute right-0 top-8 w-44 bg-white border border-gray-200 rounded-lg shadow-xl z-20 py-1 animate-fade-in">
                              <button 
                                onClick={() => handleOpenEdit(item)}
                                className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-gray-50 text-gray-700"
                              >
                                <Edit3 size={16} /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-red-50 text-red-600"
                              >
                                <Trash2 size={16} /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredItems.length > ITEMS_PER_PAGE && (
              <div className="px-4 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredItems.length)} of {filteredItems.length}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safeCurrentPage === 1}
                    className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 text-sm rounded-md border ${
                          page === safeCurrentPage
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safeCurrentPage === totalPages}
                    className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full animate-in fade-in slide-in-from-bottom-5 duration-300">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">Edit Media</h3>
              <button 
                onClick={handleCloseEditModal}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Preview */}
              <div className="flex justify-center mb-4">
                <img 
                  src={editImagePreview}
                  alt={editingItem.name}
                  className="h-32 w-32 object-contain border border-gray-200 rounded"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"%3E%3Crect fill="%23f3f4f6" width="128" height="128"/%3E%3C/svg%3E';
                  }}
                />
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter media title"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Replace Image
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageChange}
                    className="hidden"
                    id="editImageInput"
                  />
                  <label 
                    htmlFor="editImageInput"
                    className="block w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors"
                  >
                    <div className="text-sm text-gray-600">
                      {editImage ? editImage.name : 'Click or drag to change image'}
                    </div>
                  </label>
                </div>
                {editImage && (
                  <button
                    onClick={() => {
                      setEditImage(null);
                      setEditImagePreview(getImageUrl(editingItem.imagePath || editingItem.thumbnail || editingItem.url || `${editingItem.path}${editingItem.name}`));
                    }}
                    className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
                  >
                    Clear new image
                  </button>
                )}
              </div>

              {/* File Info */}
              <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                <div className="font-semibold text-gray-700 mb-2">Current File Info:</div>
                <div><span className="text-gray-600">File:</span> <span className="font-medium">{editingItem.name}</span></div>
                <div><span className="text-gray-600">Type:</span> <span className="font-medium uppercase">{editingItem.extension}</span></div>
                <div><span className="text-gray-600">Size:</span> <span className="font-medium">{editingItem.size}</span></div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCloseEditModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editLoading}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-50"
              >
                {editLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}