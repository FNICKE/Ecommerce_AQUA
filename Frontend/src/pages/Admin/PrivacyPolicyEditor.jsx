import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../../store/toastStore';
import api from '../../lib/api';
import { RotateCcw, Eye, Save, Info, ShieldCheck } from 'lucide-react';

export default function PrivacyPolicyEditor() {
  const navigate = useNavigate();
  const { showToast } = useToastStore();

  const [content, setContent] = useState('');
  const [initialContent, setInitialContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let script = document.querySelector('script[src="https://cdn.jsdelivr.net/npm/tinymce@6/tinymce.min.js"]');
    
    const onScriptLoaded = () => {
      loadData();
    };

    if (!script) {
      script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tinymce@6/tinymce.min.js';
      script.referrerPolicy = 'origin';
      script.onload = onScriptLoaded;
      script.onerror = () => {
        showToast('Unable to load TinyMCE text editor', 'error');
        setLoading(false);
      };
      document.body.appendChild(script);
    } else if (window.tinymce) {
      onScriptLoaded();
    } else {
      script.addEventListener('load', onScriptLoaded);
    }

    return () => {
      if (window.tinymce) {
        window.tinymce.remove('#editor-privacy_policy');
      }
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/config/policies/privacy_policy');
      const data = res.data?.policy?.content || '';
      
      setContent(data);
      setInitialContent(data);

      setTimeout(() => {
        initTinyMCE(data);
      }, 100);
    } catch (err) {
      // Fallback check to /config/public
      try {
        const publicRes = await api.get('/config/public');
        const fallbackData = publicRes.data?.privacy_policy || '';
        setContent(fallbackData);
        setInitialContent(fallbackData);
        setTimeout(() => {
          initTinyMCE(fallbackData);
        }, 100);
      } catch (e) {
        showToast('Failed to load policy data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const initTinyMCE = (initialVal) => {
    if (!window.tinymce) return;

    window.tinymce.remove('#editor-privacy_policy');

    window.tinymce.init({
      selector: '#editor-privacy_policy',
      min_height: 400,
      autoresize_bottom_margin: 20,
      autoresize_overflow_padding: 10,
      menubar: 'file edit view insert format tools table help',
      plugins: 'autoresize advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table code help wordcount',
      toolbar: 'undo redo | blocks fontfamily fontsize | bold italic forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media | code fullscreen preview',
      setup: (editor) => {
        editor.on('init', () => {
          editor.setContent(initialVal || '');
        });
        editor.on('change keyup', () => {
          setContent(editor.getContent());
        });
      }
    });
  };

  const handleReset = () => {
    setContent(initialContent);
    if (window.tinymce) {
      const editor = window.tinymce.get('editor-privacy_policy');
      if (editor) editor.setContent(initialContent);
    }
    showToast('Reset to last saved content', 'info');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      let textContent = content;
      if (window.tinymce) {
        const editor = window.tinymce.get('editor-privacy_policy');
        if (editor) textContent = editor.getContent();
      }

      await api.put('/config/policies/privacy_policy', {
        content: textContent,
        title: 'Privacy Policy'
      });

      setInitialContent(textContent);
      setContent(textContent);
      showToast('Privacy Policy updated successfully!', 'success');
    } catch (err) {
      console.error('Failed to save policy:', err);
      showToast(err.response?.data?.message || 'Failed to update policy', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8">
        <Info size={28} className="text-purple-600 animate-pulse mb-3" />
        <p className="text-sm font-semibold text-gray-500">Loading Privacy Policy editor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-4 sm:p-6 font-sans flex flex-col">
      {/* Top Header Breadcrumb */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/system')}
            className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
            title="Back to System Settings"
          >
            <RotateCcw size={18} className="text-purple-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="text-purple-600" size={22} />
              Privacy Policy Editor
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Manage user privacy guidelines and data protection terms</p>
          </div>
        </div>
        <div className="text-xs text-gray-400">
          Admin / System / <span className="text-slate-700 font-semibold">Privacy Policy</span>
        </div>
      </div>

      {/* Main Content Box */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Policy Document</span>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">Privacy Policy</span>
          </div>
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold px-3.5 py-2 rounded-xl transition no-underline"
            title="View Live Public Page"
          >
            <Eye size={14} /> View Live Page
          </a>
        </div>

        {/* Rich Text Editor */}
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
            Policy Content (Rich Text / HTML Editor)
          </label>
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-inner">
            <textarea
              id="editor-privacy_policy"
              defaultValue={content}
              className="w-full h-[480px] outline-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-bold text-xs rounded-xl transition border-none cursor-pointer flex items-center gap-2"
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-100 transition border-none cursor-pointer flex items-center gap-2"
          >
            <Save size={14} /> {saving ? 'Saving...' : 'Update Privacy Policy'}
          </button>
        </div>
      </div>
    </div>
  );
}
