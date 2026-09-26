import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Loader2, Save, X, Eye, EyeOff } from 'lucide-react';
import api from '../../lib/api';

const HomePageManager = () => {
  const [activeTab, setActiveTab] = useState('sliders');
  const [sliders, setSliders] = useState([]);
  const [siteContent, setSiteContent] = useState({
    newsletter_title: '',
    newsletter_description: '',
    site_name: '',
    site_tagline: '',
  });
  const [categories, setCategories] = useState([]);
  const [featuredCategories, setFeaturedCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingSlider, setEditingSlider] = useState(null);
  const [newSlider, setNewSlider] = useState({
    title: '',
    description: '',
    image: '',
    link: '',
    order: 0,
  });

  // Fetch all data
  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Fetch sliders
      const slidersRes = await api.get('/config/sliders');
      setSliders(slidersRes.data?.slides || []);

      // Fetch site content
      const contentRes = await api.get('/config/site-content');
      setSiteContent(contentRes.data?.data || {});

      // Fetch categories
      const categoriesRes = await api.get('/categories?include_inactive=false');
      setCategories(categoriesRes.data?.categories || []);

      // Fetch featured categories (if available)
      const featuredRes = await api.get('/api/admin/featured-sections');
      setFeaturedCategories(featuredRes.data?.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Handle add/update slider
  const handleSaveSlider = async () => {
    try {
      if (!newSlider.title.trim()) {
        alert('Please enter a title');
        return;
      }

      setSaving(true);

      if (editingSlider) {
        // Update existing slider
        const formData = new FormData();
        formData.append('title', newSlider.title);
        formData.append('description', newSlider.description);
        formData.append('link', newSlider.link);
        formData.append('order', newSlider.order);
        if (typeof newSlider.image === 'object' && newSlider.image) {
          formData.append('image', newSlider.image);
        }

        await api.put(`/config/sliders/${editingSlider.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // Create new slider
        const formData = new FormData();
        formData.append('title', newSlider.title);
        formData.append('description', newSlider.description);
        formData.append('link', newSlider.link);
        formData.append('order', newSlider.order);
        if (typeof newSlider.image === 'object' && newSlider.image) {
          formData.append('image', newSlider.image);
        }

        await api.post('/config/sliders', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      // Refresh data
      await fetchAllData();
      setNewSlider({ title: '', description: '', image: '', link: '', order: 0 });
      setEditingSlider(null);
      alert(editingSlider ? 'Slider updated successfully!' : 'Slider added successfully!');
    } catch (error) {
      console.error('Error saving slider:', error);
      alert('Error saving slider. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete slider
  const handleDeleteSlider = async (id) => {
    if (window.confirm('Are you sure you want to delete this slider?')) {
      try {
        setSaving(true);
        await api.delete(`/config/sliders/${id}`);
        await fetchAllData();
        alert('Slider deleted successfully!');
      } catch (error) {
        console.error('Error deleting slider:', error);
        alert('Error deleting slider. Please try again.');
      } finally {
        setSaving(false);
      }
    }
  };

  // Handle save site content
  const handleSaveContent = async () => {
    try {
      setSaving(true);
      await api.post('/config/site-content', siteContent);
      alert('Site content updated successfully!');
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Error saving content. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle toggle featured category
  const handleToggleFeaturedCategory = async (categoryId, isActive) => {
    try {
      setSaving(true);
      if (isActive) {
        await api.post(`/api/admin/featured-sections/remove/${categoryId}`);
      } else {
        await api.post(`/api/admin/featured-sections/add/${categoryId}`);
      }
      await fetchAllData();
      alert('Featured category updated successfully!');
    } catch (error) {
      console.error('Error updating featured category:', error);
      alert('Error updating featured category. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Home Page Manager</h1>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('sliders')}
                className={`flex-1 px-6 py-3 font-medium ${
                  activeTab === 'sliders'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Hero Sliders
              </button>
              <button
                onClick={() => setActiveTab('content')}
                className={`flex-1 px-6 py-3 font-medium ${
                  activeTab === 'content'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Site Content
              </button>
              <button
                onClick={() => setActiveTab('featured')}
                className={`flex-1 px-6 py-3 font-medium ${
                  activeTab === 'featured'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Featured Categories
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Sliders Tab */}
              {activeTab === 'sliders' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Manage Hero Sliders</h2>

                  {/* Add/Edit Form */}
                  <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold mb-4">
                      {editingSlider ? 'Edit Slider' : 'Add New Slider'}
                    </h3>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title *
                        </label>
                        <input
                          type="text"
                          value={newSlider.title}
                          onChange={(e) =>
                            setNewSlider({ ...newSlider, title: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter slider title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Link
                        </label>
                        <input
                          type="text"
                          value={newSlider.link}
                          onChange={(e) =>
                            setNewSlider({ ...newSlider, link: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter slider link"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={newSlider.description}
                        onChange={(e) =>
                          setNewSlider({ ...newSlider, description: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter slider description"
                        rows="3"
                      />
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setNewSlider({ ...newSlider, image: e.target.files[0] })
                        }
                        className="w-full"
                      />
                      {typeof newSlider.image === 'string' && newSlider.image && (
                        <img
                          src={newSlider.image}
                          alt="Preview"
                          className="mt-2 h-32 object-cover rounded"
                        />
                      )}
                    </div>

                    <div className="flex gap-2 mt-6">
                      <button
                        onClick={handleSaveSlider}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save Slider
                      </button>
                      {editingSlider && (
                        <button
                          onClick={() => {
                            setEditingSlider(null);
                            setNewSlider({ title: '', description: '', image: '', link: '', order: 0 });
                          }}
                          className="flex items-center gap-2 px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sliders List */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Current Sliders</h3>
                    {sliders.length === 0 ? (
                      <p className="text-gray-500">No sliders found</p>
                    ) : (
                      <div className="space-y-4">
                        {sliders.map((slider) => (
                          <div
                            key={slider.id}
                            className="border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                          >
                            <div className="flex-1">
                              <h4 className="font-semibold">{slider.title}</h4>
                              <p className="text-sm text-gray-600">{slider.description}</p>
                              {slider.image && (
                                <img
                                  src={slider.image}
                                  alt={slider.title}
                                  className="mt-2 h-24 object-cover rounded"
                                />
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingSlider(slider);
                                  setNewSlider(slider);
                                }}
                                className="flex items-center gap-1 px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSlider(slider.id)}
                                disabled={saving}
                                className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Site Content Tab */}
              {activeTab === 'content' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Site Content</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Site Name
                      </label>
                      <input
                        type="text"
                        value={siteContent.site_name || ''}
                        onChange={(e) =>
                          setSiteContent({ ...siteContent, site_name: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter site name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Site Tagline
                      </label>
                      <input
                        type="text"
                        value={siteContent.site_tagline || ''}
                        onChange={(e) =>
                          setSiteContent({ ...siteContent, site_tagline: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter site tagline"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Newsletter Title
                      </label>
                      <input
                        type="text"
                        value={siteContent.newsletter_title || ''}
                        onChange={(e) =>
                          setSiteContent({ ...siteContent, newsletter_title: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter newsletter title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Newsletter Description
                      </label>
                      <textarea
                        value={siteContent.newsletter_description || ''}
                        onChange={(e) =>
                          setSiteContent({
                            ...siteContent,
                            newsletter_description: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter newsletter description"
                        rows="4"
                      />
                    </div>

                    <button
                      onClick={handleSaveContent}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Content
                    </button>
                  </div>
                </div>
              )}

              {/* Featured Categories Tab */}
              {activeTab === 'featured' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Featured Categories</h2>

                  {categories.length === 0 ? (
                    <p className="text-gray-500">No categories available</p>
                  ) : (
                    <div className="space-y-2">
                      {categories.map((category) => {
                        const isFeatured = featuredCategories.some(
                          (fc) => fc.category_id === category.id
                        );
                        return (
                          <div
                            key={category.id}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                          >
                            <div>
                              <h4 className="font-semibold">{category.name}</h4>
                              <p className="text-sm text-gray-600">
                                {category.description || 'No description'}
                              </p>
                            </div>
                            <button
                              onClick={() => handleToggleFeaturedCategory(category.id, isFeatured)}
                              disabled={saving}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                                isFeatured
                                  ? 'bg-green-500 text-white hover:bg-green-600'
                                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                              } disabled:opacity-50`}
                            >
                              {isFeatured ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <EyeOff className="w-4 h-4" />
                              )}
                              {isFeatured ? 'Featured' : 'Not Featured'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePageManager;
