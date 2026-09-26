import React, { useState, useEffect, useCallback } from 'react';
import { 
  RotateCcw, Trash2, Pencil, Check, X,
  ChevronDown, Search, Loader2, AlertCircle, CheckCircle, HelpCircle
} from 'lucide-react';
import api from '../../../lib/api';

export default function ProductsFAQs() {
  const [faqs, setFaqs] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });

  // New FAQ form
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  
  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Inline edit
  const [editingFaqId, setEditingFaqId] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState('');
  const [editingAnswer, setEditingAnswer] = useState('');

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 3500);
  };

  const fetchProductsAndFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const [faqsRes, productsRes] = await Promise.all([
        api.get('/admin/products-faqs'),
        api.get('/products') // Correct endpoint from routes/products.js
      ]);
      setFaqs(faqsRes.data.faqs || []);
      
      // Products response structure could be res.data.data or res.data.products depending on productController
      setProducts(productsRes.data.data || productsRes.data.products || productsRes.data || []);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProductsAndFaqs();
  }, [fetchProductsAndFaqs]);

  const handleCreateFaq = async (e) => {
    e.preventDefault();
    if (!selectedProductId || !newQuestion.trim() || !newAnswer.trim()) return;
    
    setSaving(true);
    try {
      await api.post(`/admin/products/${selectedProductId}/faqs`, {
        question: newQuestion,
        answer: newAnswer
      });
      setSelectedProductId('');
      setNewQuestion('');
      setNewAnswer('');
      showToast('success', 'FAQ added successfully!');
      fetchProductsAndFaqs();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to add FAQ');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateFaq = async (id) => {
    if (!editingQuestion.trim() || !editingAnswer.trim()) return;
    try {
      await api.put(`/admin/products-faqs/${id}`, {
        question: editingQuestion,
        answer: editingAnswer
      });
      setEditingFaqId(null);
      showToast('success', 'FAQ updated successfully!');
      fetchProductsAndFaqs();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to update FAQ');
    }
  };

  const handleDeleteFaq = async (id) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await api.delete(`/admin/products-faqs/${id}`);
      showToast('success', 'FAQ deleted successfully!');
      fetchProductsAndFaqs();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to delete FAQ');
    }
  };

  const filteredFaqs = faqs.filter(faq => 
    faq.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header Breadcrumb */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#4e5e7a]">Manage Products FAQs</h2>
        <p className="text-sm text-gray-500">
          Home / <span className="text-purple-600">Product FAQs</span>
        </p>
      </div>

      {/* Toast */}
      {toast.message && (
        <div className={`flex items-center gap-3 p-4 rounded-lg border text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4 text-green-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Add Product FAQ Form */}
        <div className="lg:col-span-4">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-[#4e5e7a] mb-5 border-b pb-3">Add Product FAQ</h3>
            <form onSubmit={handleCreateFaq} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">
                  Select Product <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select 
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500 appearance-none bg-white"
                  >
                    <option value="">-- Select Product --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">
                  Question <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                  required
                  placeholder="e.g. Is this product organic?" 
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">
                  Answer <span className="text-red-500">*</span>
                </label>
                <textarea 
                  value={newAnswer}
                  onChange={e => setNewAnswer(e.target.value)}
                  required
                  placeholder="Provide a helpful answer..." 
                  rows="3"
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setSelectedProductId(''); setNewQuestion(''); setNewAnswer(''); }}
                  className="flex-1 bg-amber-500 text-white py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-amber-600 transition-colors"
                >
                  Reset
                </button>
                <button 
                  type="submit" 
                  disabled={saving || !selectedProductId || !newQuestion.trim() || !newAnswer.trim()}
                  className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-green-700 disabled:opacity-50 flex justify-center items-center"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : "Add FAQ"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: FAQs Table */}
        <div className="lg:col-span-8">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            {/* Table Controls */}
            <div className="flex flex-wrap items-center justify-between mb-6">
               <h3 className="font-bold text-[#4e5e7a] text-lg">All FAQs</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3 text-gray-400" />
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search FAQs" 
                    className="border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-1 focus:ring-purple-500 outline-none w-64"
                  />
                </div>
                <button onClick={fetchProductsAndFaqs} className="p-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
                  <RotateCcw size={18} />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-[#4e5e7a] font-bold border-b">
                  <tr>
                    <th className="px-4 py-4 w-16">ID</th>
                    <th className="px-4 py-4 uppercase tracking-wider">Product Name</th>
                    <th className="px-4 py-4 uppercase tracking-wider min-w-[200px]">Question</th>
                    <th className="px-4 py-4 uppercase tracking-wider min-w-[200px]">Answer</th>
                    <th className="px-4 py-4 uppercase tracking-wider text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-12 text-center text-gray-400">
                        <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                        Loading FAQs...
                      </td>
                    </tr>
                  ) : filteredFaqs.length > 0 ? (
                    filteredFaqs.map((faq) => (
                      <tr key={faq.id} className="border-b hover:bg-gray-50 transition-colors align-top">
                        <td className="px-4 py-4">{faq.id}</td>
                        <td className="px-4 py-4 font-medium text-[#4e5e7a] whitespace-normal min-w-[150px]">
                          {faq.product_name || `Unknown Product (#${faq.product_id})`}
                        </td>
                        
                        <td className="px-4 py-4 whitespace-normal">
                          {editingFaqId === faq.id ? (
                            <input
                              className="w-full border border-purple-300 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-purple-500"
                              value={editingQuestion}
                              onChange={(e) => setEditingQuestion(e.target.value)}
                            />
                          ) : (
                            faq.question
                          )}
                        </td>
                        
                        <td className="px-4 py-4 whitespace-normal">
                          {editingFaqId === faq.id ? (
                            <textarea
                              className="w-full border border-purple-300 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-purple-500"
                              value={editingAnswer}
                              onChange={(e) => setEditingAnswer(e.target.value)}
                              rows="2"
                            />
                          ) : (
                            faq.answer
                          )}
                        </td>

                        <td className="px-4 py-4 text-center">
                           <div className="flex items-center justify-center gap-2">
                            {editingFaqId === faq.id ? (
                              <>
                                <button
                                  onClick={() => handleUpdateFaq(faq.id)}
                                  className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg"
                                  title="Save"
                                >
                                  <Check size={15} />
                                </button>
                                <button
                                  onClick={() => setEditingFaqId(null)}
                                  className="p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-lg"
                                  title="Cancel"
                                >
                                  <X size={15} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingFaqId(faq.id);
                                    setEditingQuestion(faq.question);
                                    setEditingAnswer(faq.answer);
                                  }}
                                  className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg"
                                  title="Edit FAQ"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  onClick={() => handleDeleteFaq(faq.id)}
                                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg"
                                  title="Delete FAQ"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-16 text-center text-gray-400 bg-gray-50/50">
                        <HelpCircle size={40} className="mx-auto mb-3 opacity-20" />
                        {searchTerm ? "No FAQs match your search" : "No Product FAQs found. Create your first one!"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}