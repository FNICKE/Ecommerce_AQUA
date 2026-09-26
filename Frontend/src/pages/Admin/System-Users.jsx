import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Pencil, X, RotateCcw, Search, Loader2, AlertCircle, CheckCircle,
  Shield, Mail, Phone, User
} from 'lucide-react';
import api from '../../lib/api';

export default function SystemUsers() {
  // ─── State ───────────────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Add/Edit form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    mobile: '',
    password: ''
  });

  // ─── Helpers ─────────────────────────────────────────────────────
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 3500);
  };

  // ─── Fetch Users ─────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/system-users');
      setUsers(res.data.users || res.data || []);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to load users');
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ─── Handle Form Input ────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ─── Handle Edit ──────────────────────────────────────────────────
  const handleEdit = (user) => {
    setEditingId(user.id);
    setFormData({
      username: user.username || '',
      email: user.email || '',
      mobile: user.mobile || '',
      password: ''
    });
    setShowForm(true);
  };

  // ─── Handle Submit ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username?.trim() || !formData.email?.trim() || !formData.mobile?.trim()) {
      showToast('error', 'Username, email, and mobile are required');
      return;
    }

    if (!editingId && !formData.password?.trim()) {
      showToast('error', 'Password is required for new users');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim()
      };

      if (formData.password?.trim()) {
        payload.password = formData.password.trim();
      }

      if (editingId) {
        // Update user
        await api.put(`/admin/system-users/${editingId}`, payload);
        showToast('success', 'User updated successfully');
      } else {
        // Create user
        payload.password = formData.password.trim();
        await api.post('/admin/system-users', payload);
        showToast('success', 'User created successfully');
      }

      // Reset form and refresh
      setShowForm(false);
      setEditingId(null);
      setFormData({
        username: '',
        email: '',
        mobile: '',
        password: ''
      });
      fetchUsers();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to save user');
      console.error('Submit error:', err);
    } finally {
      setSaving(false);
    }
  };

  // ─── Handle Toggle Status ─────────────────────────────────────────
  const handleToggleStatus = async (userId, currentStatus) => {
    if (userId === 1) {
      showToast('error', 'Cannot change status of primary admin user');
      return;
    }
    
    setSaving(true);
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      await api.put(`/admin/system-users/${userId}/status`, { status: newStatus });
      showToast('success', `User marked as ${newStatus === 1 ? 'Active' : 'Inactive'}`);
      fetchUsers();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to update status');
      console.error('Toggle status error:', err);
    } finally {
      setSaving(false);
    }
  };

  // ─── Handle Delete ────────────────────────────────────────────────
  const handleDelete = async (userId) => {
    if (userId === 1) {
      showToast('error', 'Cannot delete the primary admin user');
      return;
    }

    setSaving(true);
    try {
      await api.delete(`/admin/system-users/${userId}`);
      showToast('success', 'User deleted successfully');
      setDeleteConfirm(null);
      fetchUsers();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to delete user');
      console.error('Delete error:', err);
    } finally {
      setSaving(false);
    }
  };

  // ─── Handle Reset Form ────────────────────────────────────────────
  const handleResetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      username: '',
      email: '',
      mobile: '',
      password: ''
    });
  };

  // ─── Filter Users ────────────────────────────────────────────────
  const filteredUsers = users.filter(user =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.mobile?.includes(searchTerm)
  );

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 flex items-center gap-3">
              <Shield className="w-7 h-7 sm:w-10 sm:h-10 text-blue-600" />

              System Users Management
            </h1>
          </div>
          <p className="text-slate-600">Manage admin and staff users</p>
        </div>

        {/* Toast Notification */}
        {toast.message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {toast.message}
          </div>
        )}

        {/* Content Container */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Form Section */}
          {showForm && (
            <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">
                  {editingId ? 'Edit User' : 'New User'}
                </h2>
                <button
                  onClick={handleResetForm}
                  className="text-slate-400 hover:text-slate-600 transition"
                  disabled={saving}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <User className="w-4 h-4 inline mr-2" />
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter username"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Mobile
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="Enter mobile number"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Password {editingId && '(leave blank to keep current)'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={editingId ? 'Leave blank to keep current' : 'Enter password'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={saving}
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      {editingId ? 'Update User' : 'Create User'}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResetForm}
                  disabled={saving}
                  className="w-full bg-slate-200 hover:bg-slate-300 text-slate-900 font-medium py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </form>
            </div>
          )}

          {/* Users List Section */}
          <div className={`${showForm ? 'lg:col-span-3' : 'lg:col-span-4'} bg-white rounded-xl shadow-lg p-6 border border-slate-200`}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">

              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by username, email, or mobile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={() => setShowForm(true)}
                disabled={loading || saving}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
                Add User
              </button>

              <button
                onClick={fetchUsers}
                disabled={loading || saving}
                className="text-slate-600 hover:text-slate-900 p-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Users Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-sm font-semibold text-slate-700">ID</th>
                      <th className="px-4 py-3 text-sm font-semibold text-slate-700">Username</th>
                      <th className="px-4 py-3 text-sm font-semibold text-slate-700">Email</th>
                      <th className="px-4 py-3 text-sm font-semibold text-slate-700">Mobile</th>
                      <th className="px-4 py-3 text-sm font-semibold text-slate-700">Status</th>
                      <th className="px-4 py-3 text-sm font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="px-4 py-3 text-sm text-slate-900">{user.id}</td>
                        <td className="px-4 py-3 text-sm text-slate-900 font-medium">{user.username}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{user.mobile}</td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => handleToggleStatus(user.id, user.status)}
                            disabled={saving || user.id === 1}
                            title={user.id === 1 ? "Cannot change primary admin status" : "Click to toggle status"}
                            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition ${
                              user.status === 1 
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                                : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                            } ${user.id === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {user.status === 1 ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(user)}
                              disabled={saving}
                              className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(user.id)}
                              disabled={saving || user.id === 1}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Delete User?</h3>
              <p className="text-slate-600 mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={saving}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 font-medium py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={saving}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
