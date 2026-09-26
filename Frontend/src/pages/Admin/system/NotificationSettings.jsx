import React, { useEffect, useState, useRef } from 'react';
import { Mail, Save, RotateCcw, MessageSquare, Bell, Loader2, Plus, Trash2 } from 'lucide-react';
import api from '../../../lib/api';
import { useToastStore } from '../../../store/toastStore';

const TinyMCEEditor = ({ id, initialValue, scriptLoaded }) => {
  useEffect(() => {
    if (scriptLoaded && window.tinymce) {
      window.tinymce.remove(`#${id}`);
      window.tinymce.init({
        selector: `#${id}`,
        height: 300,
        menubar: 'file edit view insert format tools table help',
        plugins: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table code help wordcount',
        toolbar: 'undo redo | blocks fontfamily fontsize | bold italic forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media | code fullscreen preview',
        setup: (editor) => {
          editor.on('init', () => {
            editor.setContent(initialValue || '');
          });
        }
      });
    }

    return () => {
      if (window.tinymce) {
        window.tinymce.remove(`#${id}`);
      }
    };
  }, [scriptLoaded, id]);

  return (
    <textarea 
      id={id}
      defaultValue={initialValue}
      className="w-full border border-gray-200 rounded-lg p-2 min-h-[180px]"
    />
  );
};

const NotificationSettings = () => {
  const { showToast } = useToastStore();
  const [activeTab, setActiveTab] = useState('email');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [initialForm, setInitialForm] = useState(null);
  const [form, setForm] = useState({
    mail_mailer: 'smtp',
    mail_host: '',
    mail_driver: 'smtp',
    mail_port: '465',
    mail_encryption: 'ssl',
    mail_username: '',
    mail_email_id: '',
    mail_password: '',
  });

  // SMS settings placeholders for future expansion
  const [smsForm, setSmsForm] = useState({
    sms_gateway: 'twilio',
    twilio_sid: '',
    twilio_auth_token: '',
    twilio_from_number: '',
    sms_enabled: '0'
  });

  // Email Templates states
  const [templates, setTemplates] = useState([]);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTemplateForm, setNewTemplateForm] = useState({
    name: '',
    code: '',
    subject: '',
    type: 'customer'
  });

  // Email Logs states
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const LOGS_PER_PAGE = 10;

  // Send Test Email
  const [testEmailTo, setTestEmailTo] = useState('');
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState(null); // { success, message }

  // Dynamic TinyMCE Script Loader
  useEffect(() => {
    if (window.tinymce) {
      setScriptLoaded(true);
      return;
    }

    let script = document.querySelector('script[src="https://cdn.jsdelivr.net/npm/tinymce@6/tinymce.min.js"]');
    let isNewScript = false;

    if (!script) {
      script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tinymce@6/tinymce.min.js';
      script.referrerPolicy = 'origin';
      isNewScript = true;
      document.body.appendChild(script);
    }

    const handleLoad = () => {
      setScriptLoaded(true);
    };

    const handleError = () => {
      console.error('Unable to load TinyMCE text editor.');
    };

    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);

    return () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
      if (isNewScript) {
        script.remove();
      }
    };
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchTemplates();
    fetchLogs();
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'sms') {
      setActiveTab('sms');
    } else if (tabParam === 'email') {
      setActiveTab('email');
    }
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/config/email');
      if (res.data?.success && res.data.data) {
        const loaded = res.data.data;
        const normalized = {
          mail_mailer: loaded.mail_mailer || 'smtp',
          mail_host: loaded.mail_host || '',
          mail_driver: loaded.mail_driver || 'smtp',
          mail_port: loaded.mail_port || '465',
          mail_encryption: loaded.mail_encryption || 'ssl',
          mail_username: loaded.mail_username || '',
          mail_email_id: loaded.mail_email_id || '',
          mail_password: loaded.mail_password || '',
        };
        setForm(normalized);
        setInitialForm(normalized);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load SMTP settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/config/templates');
      if (res.data?.success) {
        setTemplates(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load email templates', 'error');
    }
  };

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await api.get('/config/email-logs');
      if (res.data?.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load email logs', 'error');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailTo.trim()) {
      setTestEmailResult({ success: false, message: 'Please enter a recipient email address.' });
      return;
    }
    try {
      setTestEmailSending(true);
      setTestEmailResult(null);
      const res = await api.post('/config/test-email', { to: testEmailTo.trim() });
      if (res.data?.success) {
        setTestEmailResult({ success: true, message: `✅ Email sent to ${testEmailTo}! Check inbox (and spam/junk folder).`, details: res.data.details });
      } else {
        setTestEmailResult({ success: false, message: res.data?.message || 'Failed to send test email.' });
      }
    } catch (err) {
      setTestEmailResult({ success: false, message: err.response?.data?.message || err.message || 'SMTP error. Check your settings.' });
    } finally {
      setTestEmailSending(false);
    }
  };

  const handleReset = () => {
    if (initialForm) {
      setForm(initialForm);
      showToast('Reset to saved values', 'info');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.put('/config/email', form);
      if (res.data?.success) {
        setInitialForm(form);
        showToast('Notification email settings saved successfully!', 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save email settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTemplateField = (id, field, value) => {
    setTemplates(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, [field]: value };
      }
      return t;
    }));
  };

  const handleSaveTemplate = async (tplId) => {
    try {
      const editorId = `editor-${tplId}`;
      const content = window.tinymce ? window.tinymce.get(editorId)?.getContent() : '';
      const tpl = templates.find(t => t.id === tplId);

      const res = await api.put(`/config/templates/${tplId}`, {
        name: tpl.name,
        subject: tpl.subject,
        content: content,
        type: tpl.type
      });

      if (res.data?.success) {
        showToast('Template updated successfully!', 'success');
        fetchTemplates();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save template', 'error');
    }
  };

  const handleDeleteTemplateClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      const res = await api.delete(`/config/templates/${id}`);
      if (res.data?.success) {
        showToast('Template deleted successfully', 'success');
        fetchTemplates();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete template', 'error');
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    try {
      const content = window.tinymce ? window.tinymce.get('editor-new')?.getContent() : '';
      const res = await api.post('/config/templates', {
        ...newTemplateForm,
        content: content
      });
      if (res.data?.success) {
        showToast('Template created successfully!', 'success');
        setShowNewForm(false);
        setNewTemplateForm({
          name: '',
          code: '',
          subject: '',
          type: 'customer'
        });
        fetchTemplates();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create template', 'error');
    }
  };

  const insertPlaceholderToTinyMCE = (editorId, placeholder) => {
    if (window.tinymce) {
      const editor = window.tinymce.get(editorId);
      if (editor) {
        editor.insertContent(placeholder);
      }
    }
  };

  const tabs = [
    { id: 'email', label: 'Email settings', icon: Mail },
    { id: 'sms', label: 'SMS Gateway setting', icon: MessageSquare },
  ];

  if (loading) {
    return (
      <div className="h-screen bg-[#F8F9FB] p-4 flex flex-col items-center justify-center">
        <Loader2 size={36} className="text-purple-600 animate-spin mb-4" />
        <p className="text-gray-500 font-semibold text-sm">Loading notification settings...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F8F9FB] p-6 font-sans overflow-hidden flex flex-col">
      {/* Header */}
      <div className="mb-5 flex items-center gap-2 shrink-0 select-none">
        <div className="p-2 bg-white rounded shadow-sm border border-gray-100">
          <Bell size={18} className="text-purple-600" />
        </div>
        <h1 className="text-base font-bold text-[#334257]">Notification settings</h1>
      </div>

      <div className="flex flex-1 gap-5 min-h-0 overflow-hidden select-none">
        {/* Sidebar Tabs */}
        <div className="w-[260px] flex flex-col gap-2 shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full p-3 rounded-xl border border-solid flex items-center gap-3 transition cursor-pointer text-left bg-white ${
                  isActive 
                    ? 'border-purple-500 text-purple-700 shadow-sm font-bold bg-purple-50/10' 
                    : 'border-gray-200 text-[#334257] hover:bg-gray-50 font-medium'
                }`}
              >
                <div className={`p-2 rounded ${isActive ? 'bg-purple-100 text-purple-600' : 'bg-gray-50 text-gray-500'}`}>
                  <Icon size={14} />
                </div>
                <span className="text-[11px] uppercase tracking-wider">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Settings Form Container */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden shadow-sm select-none">
          {activeTab === 'email' ? (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-auto divide-y divide-gray-100">
                {/* SMTP settings section */}
                <form onSubmit={handleSave} className="p-6 space-y-5 select-none">
                  <div className="flex justify-between items-center pb-2">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">SMTP Server Configuration</h3>
                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        onClick={handleReset}
                        className="px-4 py-1.5 text-[10px] font-bold text-gray-400 flex items-center gap-1 border border-solid border-gray-200 rounded-lg bg-white cursor-pointer hover:text-gray-600 transition"
                      >
                        <RotateCcw size={12} /> Reset
                      </button>
                      <button 
                        type="submit" 
                        disabled={saving}
                        className="px-5 py-1.5 bg-[#004BB9] text-white rounded-lg text-[10px] font-bold shadow-md shadow-blue-100 flex items-center gap-1.5 border-none cursor-pointer hover:bg-blue-700 transition disabled:opacity-60"
                      >
                        <Save size={12} /> {saving ? 'Saving...' : 'Save Settings'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Mailer name</label>
                      <input 
                        type="text" 
                        value={form.mail_mailer} 
                        onChange={(e) => setForm(p => ({ ...p, mail_mailer: e.target.value }))}
                        className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-4 py-2.5 rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400 focus:bg-white transition" 
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Host name</label>
                      <input 
                        type="text" 
                        value={form.mail_host}
                        onChange={(e) => setForm(p => ({ ...p, mail_host: e.target.value }))}
                        placeholder="Ex: smtp.mailtrap.io" 
                        className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-4 py-2.5 rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400 focus:bg-white transition" 
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Driver</label>
                      <input 
                        type="text" 
                        value={form.mail_driver}
                        onChange={(e) => setForm(p => ({ ...p, mail_driver: e.target.value }))}
                        className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-4 py-2.5 rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400 focus:bg-white transition" 
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Port</label>
                      <input 
                        type="text" 
                        value={form.mail_port}
                        onChange={(e) => setForm(p => ({ ...p, mail_port: e.target.value }))}
                        className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-4 py-2.5 rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400 focus:bg-white transition" 
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Encryption</label>
                      <select 
                        value={form.mail_encryption}
                        onChange={(e) => setForm(p => ({ ...p, mail_encryption: e.target.value }))}
                        className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-4 py-2.5 rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400 focus:bg-white transition cursor-pointer"
                      >
                        <option value="ssl">ssl (Port 465)</option>
                        <option value="tls">tls (Port 587)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Username</label>
                    <input 
                      type="text" 
                      value={form.mail_username}
                      onChange={(e) => setForm(p => ({ ...p, mail_username: e.target.value }))}
                      placeholder="Ex: ex@gmail.com" 
                      className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-4 py-2.5 rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400 focus:bg-white transition" 
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Sender Email ID</label>
                    <input 
                      type="email" 
                      value={form.mail_email_id}
                      onChange={(e) => setForm(p => ({ ...p, mail_email_id: e.target.value }))}
                      placeholder="Ex: ex@gmail.com" 
                      className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-4 py-2.5 rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400 focus:bg-white transition" 
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Password</label>
                    <input 
                      type="password" 
                      value={form.mail_password}
                      onChange={(e) => setForm(p => ({ ...p, mail_password: e.target.value }))}
                      placeholder="Ex: ••••••••••" 
                      className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-4 py-2.5 rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400 focus:bg-white transition" 
                      required
                    />
                  </div>
                </form>

                {/* ─── Send Test Email Panel ─── */}
                <div className="p-6 border-t border-gray-100 bg-gradient-to-r from-blue-50/40 to-purple-50/30">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600 shrink-0">
                      <Mail size={15} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Send Test Email</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">Verify your SMTP settings by sending a real test email right now</p>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    <input
                      type="email"
                      value={testEmailTo}
                      onChange={e => { setTestEmailTo(e.target.value); setTestEmailResult(null); }}
                      placeholder="Enter recipient email address e.g. yourname@gmail.com"
                      className="flex-1 bg-white border border-[#E8ECEF] px-4 py-2.5 rounded-lg text-[11px] font-semibold text-slate-700 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 transition"
                    />
                    <button
                      type="button"
                      onClick={handleSendTestEmail}
                      disabled={testEmailSending || !testEmailTo.trim()}
                      className="px-5 py-2.5 bg-purple-600 text-white rounded-lg text-[10px] font-bold shadow-md shadow-purple-100 hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none whitespace-nowrap flex items-center gap-1.5"
                    >
                      {testEmailSending ? (
                        <><Loader2 size={12} className="animate-spin" /> Sending...</>
                      ) : (
                        <><Mail size={12} /> Send Test Email</>
                      )}
                    </button>
                  </div>

                  {/* Result Banner */}
                  {testEmailResult && (
                    <div className={`mt-3 px-4 py-3 rounded-xl border text-[11px] font-semibold ${
                      testEmailResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                      <p>{testEmailResult.message}</p>
                      {testEmailResult.success && testEmailResult.details && (
                        <p className="mt-1 text-[10px] font-mono text-emerald-600 opacity-70">
                          Server response: {testEmailResult.details.response} &nbsp;·&nbsp; Message ID: {testEmailResult.details.messageId}
                        </p>
                      )}
                      {!testEmailResult.success && (
                        <p className="mt-1 text-[10px] text-red-500 opacity-80">
                          Tip: Check your SMTP Host, Port, Username, Password above and click Save Settings first.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Inline Templates section */}
                <div className="p-6 space-y-6 select-none bg-slate-50/20">
                  <div className="flex justify-between items-center pb-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Email Templates</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">Automated emails dispatched on checkout and notifications</p>
                    </div>
                    {!showNewForm && (
                      <button
                        type="button"
                        onClick={() => setShowNewForm(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-[10px] font-bold shadow-md shadow-purple-100 hover:bg-purple-700 transition cursor-pointer flex items-center gap-1.5 border-none"
                      >
                        <Plus size={12} /> Add Template
                      </button>
                    )}
                  </div>

                  {/* Add New Template Form Block */}
                  {showNewForm && (
                    <div className="border border-solid border-purple-200 bg-purple-50/10 rounded-xl p-5 space-y-4">
                      <div className="flex justify-between items-center border-b border-gray-150 pb-2">
                        <h4 className="text-xs font-bold text-purple-700">Add New Email Template</h4>
                        <button
                          type="button"
                          onClick={() => setShowNewForm(false)}
                          className="text-gray-400 hover:text-gray-600 text-xs font-bold bg-transparent border-none cursor-pointer"
                        >
                          ✕ Cancel
                        </button>
                      </div>
                      <form onSubmit={handleCreateTemplate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Template Name</label>
                            <input 
                              type="text"
                              value={newTemplateForm.name}
                              onChange={(e) => setNewTemplateForm(p => ({ ...p, name: e.target.value }))}
                              className="w-full bg-white border border-[#E8ECEF] px-3 py-2 rounded-lg text-[11px] font-semibold text-slate-700 outline-none focus:border-purple-400 transition"
                              required
                              placeholder="Ex: Customer Order Shipped"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Template Code (Unique identifier)</label>
                            <input 
                              type="text"
                              value={newTemplateForm.code}
                              onChange={(e) => setNewTemplateForm(p => ({ ...p, code: e.target.value }))}
                              className="w-full bg-white border border-[#E8ECEF] px-3 py-2 rounded-lg text-[11px] font-semibold text-slate-700 outline-none focus:border-purple-400 transition"
                              required
                              placeholder="Ex: order_shipped"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Template Type</label>
                            <select
                              value={newTemplateForm.type}
                              onChange={(e) => setNewTemplateForm(p => ({ ...p, type: e.target.value }))}
                              className="w-full bg-white border border-[#E8ECEF] px-3 py-2 rounded-lg text-[11px] font-semibold text-slate-700 outline-none focus:border-purple-400 transition cursor-pointer"
                            >
                              <option value="customer">Customer Email</option>
                              <option value="admin">Admin Email</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Email Subject Line</label>
                            <input 
                              type="text"
                              value={newTemplateForm.subject}
                              onChange={(e) => setNewTemplateForm(p => ({ ...p, subject: e.target.value }))}
                              className="w-full bg-white border border-[#E8ECEF] px-3 py-2 rounded-lg text-[11px] font-semibold text-slate-700 outline-none focus:border-purple-400 transition"
                              required
                              placeholder="Ex: Your Order #{order_id} has been dispatched!"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Email Body Message</label>
                          <TinyMCEEditor 
                            id="editor-new"
                            initialValue=""
                            scriptLoaded={scriptLoaded}
                          />
                        </div>

                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1.5 select-none">
                          <h5 className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Click to Insert Dynamic Placeholders</h5>
                          <div className="flex flex-wrap gap-1">
                            {['store_name', 'customer_name', 'order_id', 'order_date', 'payment_method', 'items_table', 'total_amount', 'shipping_address'].map(token => (
                              <button
                                key={token}
                                type="button"
                                onClick={() => insertPlaceholderToTinyMCE('editor-new', `{${token}}`)}
                                className="text-[9px] font-mono bg-white border border-gray-200 px-1.5 py-0.5 rounded text-slate-600 hover:border-purple-400 hover:bg-purple-50 cursor-pointer transition"
                              >
                                {`{${token}}`}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                          <button 
                            type="button"
                            onClick={() => setShowNewForm(false)}
                            className="px-4 py-2 border border-solid border-gray-250 rounded-lg text-[10px] font-bold text-gray-500 bg-white hover:bg-gray-50 cursor-pointer transition"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit"
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg text-[10px] font-bold shadow-md hover:bg-purple-700 cursor-pointer transition border-none"
                          >
                            Create Template
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* List of Templates Rendered Directly on Page */}
                  {templates.length === 0 ? (
                    <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50/50">
                      <p className="text-[11px] text-gray-400 font-semibold">No email templates configured yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {templates.map(tpl => (
                        <div key={tpl.id} className="border border-solid border-gray-200 rounded-xl bg-white p-5 space-y-4 shadow-sm hover:shadow-md transition">
                          <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{tpl.name}</h4>
                              <p className="text-[9px] font-mono text-gray-400 mt-0.5">Code: {tpl.code} | Recipient: {tpl.type === 'admin' ? 'Admin' : 'Customer'}</p>
                            </div>
                            <div className="flex gap-2">
                              {!tpl.is_default && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTemplateClick(tpl.id)}
                                  className="px-3 py-1.5 border border-solid border-red-200 text-red-500 rounded-lg text-[10px] font-bold hover:bg-red-50 cursor-pointer transition"
                                >
                                  Delete
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleSaveTemplate(tpl.id)}
                                className="px-5 py-1.5 bg-[#004BB9] text-white rounded-lg text-[10px] font-bold shadow-md shadow-blue-50 hover:bg-blue-700 cursor-pointer transition border-none"
                              >
                                Save Template Changes
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-500 uppercase">Template Name</label>
                              <input 
                                type="text"
                                value={tpl.name}
                                onChange={(e) => handleUpdateTemplateField(tpl.id, 'name', e.target.value)}
                                className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-3 py-2 rounded-lg text-[11px] font-semibold text-slate-700 outline-none focus:border-purple-400 focus:bg-white transition"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-500 uppercase">Email Subject Line</label>
                              <input 
                                type="text"
                                value={tpl.subject}
                                onChange={(e) => handleUpdateTemplateField(tpl.id, 'subject', e.target.value)}
                                className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-3 py-2 rounded-lg text-[11px] font-semibold text-slate-700 outline-none focus:border-purple-400 focus:bg-white transition"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Email Body Message</label>
                            <TinyMCEEditor 
                              id={`editor-${tpl.id}`}
                              initialValue={tpl.content}
                              scriptLoaded={scriptLoaded}
                            />
                          </div>

                          {/* Placeholder helpers under each editor */}
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1.5 select-none">
                            <h5 className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Click to Insert Dynamic Placeholders</h5>
                            <div className="flex flex-wrap gap-1">
                              {['store_name', 'customer_name', 'order_id', 'order_date', 'payment_method', 'items_table', 'total_amount', 'shipping_address'].map(token => (
                                <button
                                  key={token}
                                  type="button"
                                  onClick={() => insertPlaceholderToTinyMCE(`editor-${tpl.id}`, `{${token}}`)}
                                  className="text-[9px] font-mono bg-white border border-gray-200 px-1.5 py-0.5 rounded text-slate-600 hover:border-purple-400 hover:bg-purple-50 cursor-pointer transition"
                                >
                                  {`{${token}}`}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Email Dispatch History Logs — Customer Only */}
                  {(() => {
                    const customerLogs = logs.filter(l => l.template_code === 'order_confirmation');
                    const totalPages = Math.max(1, Math.ceil(customerLogs.length / LOGS_PER_PAGE));
                    const safePage = Math.min(logsPage, totalPages);
                    const pageLogs = customerLogs.slice((safePage - 1) * LOGS_PER_PAGE, safePage * LOGS_PER_PAGE);

                    return (
                      <div className="mt-8 pt-6 border-t border-gray-150 space-y-4 select-none bg-white">
                        <div className="flex justify-between items-center pb-2">
                          <div>
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Customer Email History</h3>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              Showing customer order confirmation emails · {customerLogs.length} total record{customerLogs.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => { fetchLogs(); setLogsPage(1); }}
                            disabled={loadingLogs}
                            className="px-4 py-1.5 text-[10px] font-bold text-slate-600 flex items-center gap-1 border border-solid border-gray-200 rounded-lg bg-white cursor-pointer hover:bg-gray-50 transition"
                          >
                            {loadingLogs ? 'Refreshing...' : 'Refresh Logs'}
                          </button>
                        </div>

                        {customerLogs.length === 0 ? (
                          <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50/50">
                            <p className="text-[11px] text-gray-400 font-semibold">No customer email logs recorded yet.</p>
                          </div>
                        ) : (
                          <>
                            <div className="overflow-x-auto border border-solid border-gray-100 rounded-xl shadow-sm">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-gray-100">
                                    <th className="p-3 whitespace-nowrap">#</th>
                                    <th className="p-3 whitespace-nowrap">Timestamp</th>
                                    <th className="p-3 whitespace-nowrap">Recipient</th>
                                    <th className="p-3 whitespace-nowrap">Subject</th>
                                    <th className="p-3 whitespace-nowrap">Status</th>
                                    <th className="p-3 whitespace-nowrap">Error Details</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-[11px]">
                                  {pageLogs.map((log, idx) => (
                                    <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                                      <td className="p-3 text-gray-400 font-mono text-[9px]">
                                        {(safePage - 1) * LOGS_PER_PAGE + idx + 1}
                                      </td>
                                      <td className="p-3 text-gray-400 font-mono text-[9px] whitespace-nowrap">
                                        {new Date(log.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                      </td>
                                      <td className="p-3 text-[#334257] font-semibold">{log.recipient}</td>
                                      <td className="p-3 text-[#334257] max-w-[180px] truncate" title={log.subject}>
                                        {log.subject}
                                      </td>
                                      <td className="p-3">
                                        {log.status === 'sent' ? (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-solid border-emerald-200">
                                            ✓ Sent
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-50 text-red-700 border border-solid border-red-200">
                                            ✗ Failed
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-3 text-gray-500 max-w-[200px] truncate" title={log.error_message || ''}>
                                        {log.error_message ? (
                                          <span className="text-red-500 italic font-medium">{log.error_message}</span>
                                        ) : (
                                          <span className="text-gray-400">—</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                              <div className="flex items-center justify-between pt-3">
                                <p className="text-[10px] text-gray-400 font-medium">
                                  Page {safePage} of {totalPages} · Showing {(safePage - 1) * LOGS_PER_PAGE + 1}–{Math.min(safePage * LOGS_PER_PAGE, customerLogs.length)} of {customerLogs.length}
                                </p>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setLogsPage(1)}
                                    disabled={safePage === 1}
                                    className="px-2 py-1 text-[10px] font-bold border border-gray-200 rounded-lg bg-white text-slate-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                                  >
                                    «
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                                    disabled={safePage === 1}
                                    className="px-3 py-1 text-[10px] font-bold border border-gray-200 rounded-lg bg-white text-slate-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                                  >
                                    ‹ Prev
                                  </button>

                                  {/* Page number pills */}
                                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                                    .reduce((acc, p, i, arr) => {
                                      if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                                      acc.push(p);
                                      return acc;
                                    }, [])
                                    .map((item, i) =>
                                      item === '...' ? (
                                        <span key={`dots-${i}`} className="px-1 text-[10px] text-gray-400">…</span>
                                      ) : (
                                        <button
                                          key={item}
                                          type="button"
                                          onClick={() => setLogsPage(item)}
                                          className={`w-7 h-7 text-[10px] font-bold rounded-lg border cursor-pointer transition ${
                                            safePage === item
                                              ? 'bg-purple-600 text-white border-purple-600'
                                              : 'bg-white text-slate-500 border-gray-200 hover:bg-gray-50'
                                          }`}
                                        >
                                          {item}
                                        </button>
                                      )
                                    )
                                  }

                                  <button
                                    type="button"
                                    onClick={() => setLogsPage(p => Math.min(totalPages, p + 1))}
                                    disabled={safePage === totalPages}
                                    className="px-3 py-1 text-[10px] font-bold border border-gray-200 rounded-lg bg-white text-slate-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                                  >
                                    Next ›
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setLogsPage(totalPages)}
                                    disabled={safePage === totalPages}
                                    className="px-2 py-1 text-[10px] font-bold border border-gray-200 rounded-lg bg-white text-slate-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                                  >
                                    »
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 flex-1 flex flex-col items-center justify-center text-center select-none bg-gray-50/50">
              <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-4 border border-purple-100 animate-pulse">
                <MessageSquare size={32} />
              </div>
              <h2 className="text-sm font-bold text-slate-700 mb-1">SMS Gateway settings is under development</h2>
              <p className="text-xs text-gray-400 max-w-sm leading-relaxed font-medium">
                SMS notification integration (e.g. Twilio, MSG91) is planned for future versions. All database connections and interfaces will be automatically wired up during SMS extension rollout.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
