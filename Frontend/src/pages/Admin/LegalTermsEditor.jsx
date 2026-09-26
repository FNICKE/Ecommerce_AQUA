import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToastStore } from '../../store/toastStore';
import api from '../../lib/api';
import { 
  RotateCcw, 
  Eye, 
  Save, 
  Info, 
  ShieldCheck, 
  HelpCircle, 
  Truck, 
  RotateCcw as ReturnIcon, 
  CheckSquare,
  FileText
} from 'lucide-react';

const POLICY_CONFIG = {
  privacy_policy: {
    key: 'privacy_policy',
    title: 'Privacy Policy',
    shortDesc: 'Customer data protection & privacy guidelines',
    publicUrl: '/privacy',
    icon: ShieldCheck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  terms_conditions: {
    key: 'terms_conditions',
    title: 'Terms & Conditions',
    shortDesc: 'User agreement, legal rights and service rules',
    publicUrl: '/terms',
    icon: CheckSquare,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200'
  },
  return_policy: {
    key: 'return_policy',
    title: 'Return & Refund Policy',
    shortDesc: 'Product return window, refund procedure & terms',
    publicUrl: '/return-policy',
    icon: ReturnIcon,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200'
  },
  shipping_policy: {
    key: 'shipping_policy',
    title: 'Shipping Policy',
    shortDesc: 'Dispatch timelines, courier partners & delivery guidelines',
    publicUrl: '/shipping-policy',
    icon: Truck,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  }
};

export default function LegalTermsEditor({ initialTab }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToastStore();

  // Determine active tab from prop, query parameter or pathname
  const getActiveTabFromLocation = () => {
    if (initialTab && POLICY_CONFIG[initialTab]) return initialTab;
    
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam && POLICY_CONFIG[tabParam]) return tabParam;

    if (location.pathname.includes('return-policy')) return 'return_policy';
    if (location.pathname.includes('shipping-policy')) return 'shipping_policy';
    if (location.pathname.includes('terms-conditions') || location.pathname.includes('terms')) return 'terms_conditions';
    return 'privacy_policy';
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromLocation);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Policy content state
  const [policies, setPolicies] = useState({
    privacy_policy: '',
    terms_conditions: '',
    return_policy: '',
    shipping_policy: ''
  });

  const [initialPolicies, setInitialPolicies] = useState({
    privacy_policy: '',
    terms_conditions: '',
    return_policy: '',
    shipping_policy: ''
  });

  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  useEffect(() => {
    setActiveTab(getActiveTabFromLocation());
  }, [location.pathname, location.search, initialTab]);

  // Load TinyMCE Script
  useEffect(() => {
    let script = document.querySelector('script[src="https://cdn.jsdelivr.net/npm/tinymce@6/tinymce.min.js"]');
    
    const onScriptLoaded = () => {
      setScriptLoaded(true);
      loadPolicyData();
    };

    if (!script) {
      script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tinymce@6/tinymce.min.js';
      script.referrerPolicy = 'origin';
      script.onload = onScriptLoaded;
      script.onerror = () => {
        showToast('Unable to load rich text editor (TinyMCE)', 'error');
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
        Object.keys(POLICY_CONFIG).forEach(key => {
          window.tinymce.remove(`#editor-${key}`);
        });
      }
    };
  }, []);

  const loadPolicyData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/config/policies');
      const policyList = res.data?.policies || [];
      
      const loaded = {
        privacy_policy: '',
        terms_conditions: '',
        return_policy: '',
        shipping_policy: ''
      };

      policyList.forEach(p => {
        if (loaded[p.type] !== undefined) {
          loaded[p.type] = p.content || '';
        }
      });

      // Also fallback to /config/public if any are empty
      if (!loaded.privacy_policy || !loaded.terms_conditions) {
        const publicRes = await api.get('/config/public');
        if (!loaded.privacy_policy && publicRes.data?.privacy_policy) loaded.privacy_policy = publicRes.data.privacy_policy;
        if (!loaded.terms_conditions && publicRes.data?.terms_conditions) loaded.terms_conditions = publicRes.data.terms_conditions;
        if (!loaded.return_policy && publicRes.data?.return_policy) loaded.return_policy = publicRes.data.return_policy;
        if (!loaded.shipping_policy && publicRes.data?.shipping_policy) loaded.shipping_policy = publicRes.data.shipping_policy;
      }

      setPolicies(loaded);
      setInitialPolicies(loaded);

      // Initialize editor for active tab after short delay
      setTimeout(() => {
        initEditorForTab(activeTabRef.current, loaded[activeTabRef.current]);
      }, 150);

    } catch (err) {
      console.error('Failed to load policies:', err);
      showToast(err.response?.data?.message || 'Failed to load policy data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const initEditorForTab = (tabKey, content) => {
    if (!window.tinymce) return;

    const editorId = `editor-${tabKey}`;
    window.tinymce.remove(`#${editorId}`);

    window.tinymce.init({
      selector: `#${editorId}`,
      height: 480,
      menubar: 'file edit view insert format tools table help',
      plugins: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table code help wordcount',
      toolbar: 'undo redo | blocks fontfamily fontsize | bold italic forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media | code fullscreen preview',
      setup: (editor) => {
        editor.on('init', () => {
          editor.setContent(content || policies[tabKey] || '');
        });
        editor.on('change keyup', () => {
          const newContent = editor.getContent();
          setPolicies(prev => ({ ...prev, [tabKey]: newContent }));
        });
      }
    });
  };

  const handleTabChange = (newTab) => {
    // Save current editor content to state before switching
    if (window.tinymce) {
      const currentEditorId = `editor-${activeTab}`;
      const currentEditor = window.tinymce.get(currentEditorId);
      if (currentEditor) {
        const content = currentEditor.getContent();
        setPolicies(prev => ({ ...prev, [activeTab]: content }));
        window.tinymce.remove(`#${currentEditorId}`);
      }
    }

    setActiveTab(newTab);

    // Initialize editor for new tab
    setTimeout(() => {
      initEditorForTab(newTab, policies[newTab]);
    }, 100);
  };

  const handleResetCurrent = () => {
    const original = initialPolicies[activeTab] || '';
    setPolicies(prev => ({ ...prev, [activeTab]: original }));

    if (window.tinymce) {
      const editor = window.tinymce.get(`editor-${activeTab}`);
      if (editor) editor.setContent(original);
    }

    showToast(`${POLICY_CONFIG[activeTab]?.title} reset to last saved version`, 'info');
  };

  const handleSaveCurrent = async () => {
    try {
      setSaving(true);
      
      let currentContent = policies[activeTab];
      if (window.tinymce) {
        const editor = window.tinymce.get(`editor-${activeTab}`);
        if (editor) currentContent = editor.getContent();
      }

      await api.put(`/config/policies/${activeTab}`, {
        content: currentContent,
        title: POLICY_CONFIG[activeTab]?.title
      });

      setInitialPolicies(prev => ({ ...prev, [activeTab]: currentContent }));
      setPolicies(prev => ({ ...prev, [activeTab]: currentContent }));

      showToast(`${POLICY_CONFIG[activeTab]?.title} updated successfully!`, 'success');
    } catch (err) {
      console.error('Save policy error:', err);
      showToast(err.response?.data?.message || 'Failed to save policy', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);

      const allUpdated = { ...policies };
      if (window.tinymce) {
        const editor = window.tinymce.get(`editor-${activeTab}`);
        if (editor) allUpdated[activeTab] = editor.getContent();
      }

      await api.put('/config/policies', allUpdated);

      setInitialPolicies(allUpdated);
      setPolicies(allUpdated);

      showToast('All policies updated successfully!', 'success');
    } catch (err) {
      console.error('Save all policies error:', err);
      showToast(err.response?.data?.message || 'Failed to update all policies', 'error');
    } finally {
      setSaving(false);
    }
  };

  const currentConfig = POLICY_CONFIG[activeTab] || POLICY_CONFIG.privacy_policy;
  const CurrentIcon = currentConfig.icon;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8">
        <Info size={28} className="text-purple-600 animate-pulse mb-3" />
        <p className="text-sm font-semibold text-gray-500">Loading policy editors...</p>
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
              <FileText className="text-purple-600" size={22} />
              Policies & Legal Terms Editor
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Manage customer-facing legal guidelines and operational policies</p>
          </div>
        </div>
        <div className="text-xs text-gray-400">
          Admin / System / <span className="text-slate-700 font-semibold">{currentConfig.title}</span>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 mb-6 flex flex-wrap gap-2">
        {Object.values(POLICY_CONFIG).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer border-none ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                  : 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon size={16} />
              <span>{tab.title}</span>
            </button>
          );
        })}
      </div>

      {/* Main Editor Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6 flex-1">
        {/* Policy Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentConfig.bgColor} ${currentConfig.color} border ${currentConfig.borderColor}`}>
              <CurrentIcon size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 m-0">{currentConfig.title}</h2>
              <p className="text-xs text-gray-500 m-0 mt-0.5">{currentConfig.shortDesc}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={currentConfig.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold px-3.5 py-2 rounded-xl transition no-underline"
              title="Open public page in new tab"
            >
              <Eye size={14} /> View Live Page
            </a>
          </div>
        </div>

        {/* Rich Text Editor Container */}
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
            {currentConfig.title} Content (HTML / Rich Text)
          </label>
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-inner">
            <textarea
              key={activeTab}
              id={`editor-${activeTab}`}
              defaultValue={policies[activeTab] || ''}
              className="w-full h-[480px] outline-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResetCurrent}
              disabled={saving}
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-bold text-xs rounded-xl transition border-none cursor-pointer flex items-center gap-2"
            >
              <RotateCcw size={14} /> Reset
            </button>
            <button
              type="button"
              onClick={handleSaveCurrent}
              disabled={saving}
              className="px-8 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-100 transition border-none cursor-pointer flex items-center gap-2"
            >
              <Save size={14} /> {saving ? 'Saving...' : `Save ${currentConfig.title}`}
            </button>
          </div>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-green-100 transition border-none cursor-pointer flex items-center gap-2"
          >
            <Save size={14} /> Save All 4 Policies
          </button>
        </div>
      </div>
    </div>
  );
}
