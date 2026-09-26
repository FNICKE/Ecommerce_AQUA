import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../../../store/toastStore';
import api from '../../../lib/api';
import { 
  RotateCcw, 
  Save, 
  ChevronLeft, 
  Loader2, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';

const FirebaseLogo = ({ size = 20, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    fill="currentColor" 
    className={className}
  >
    <path d="M3.89 15.75L2 6.06c-.11-.53.25-.86.68-.61l9.16 5.25-7.95 5.05zm8.94-13.54c-.34-.41-.95-.41-1.3 0L9.04 4.7l2.84 2.87 1.2-2.39c.2-.41.05-1.02-.25-1.12zm2.59 18.17l6.39-11.55c.29-.53-.11-1.19-.73-1.02l-4.57 1.25-2.92-2.87 3.54 9.68v4.51zM11.88 10.7L9.04 4.7l-5.15 11.05 11.53 4.63 6.5-11.56c.62-.17 1.02.49.73 1.02l-11.88-5.14zm4.62 5.8L11.88 10.7l-8 5.05 11.54 4.63c.62.25 1.25-.13 1.08-.75l-4.62-5.8z" />
  </svg>
);

const InputField = ({ label, value, onChange, placeholder, type = "text" }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{label}</label>
    <input 
      type={type} 
      value={value || ''} 
      onChange={(e) => onChange(e.target.value)} 
      placeholder={placeholder}
      className="px-4 h-10 border border-gray-200 rounded-lg focus:border-purple-500 outline-none text-sm text-gray-700 shadow-sm bg-white font-medium transition" 
    />
  </div>
);

export default function FirebaseSettings() {
  const navigate = useNavigate();
  const { showToast } = useToastStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialData, setInitialData] = useState(null);

  // Firebase configurations state
  const [apiKey, setApiKey] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [databaseURL, setDatabaseURL] = useState('');
  const [projectId, setProjectId] = useState('');
  const [storageBucket, setStorageBucket] = useState('');
  const [messagingSenderId, setMessagingSenderId] = useState('');
  const [appId, setAppId] = useState('');
  const [measurementId, setMeasurementId] = useState('');

  useEffect(() => {
    loadFirebaseSettings();
  }, []);

  const loadFirebaseSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/config/firebase');
      if (res.data.success) {
        const data = res.data.data || {};
        setApiKey(data.apiKey || '');
        setAuthDomain(data.authDomain || '');
        setDatabaseURL(data.databaseURL || '');
        setProjectId(data.projectId || '');
        setStorageBucket(data.storageBucket || '');
        setMessagingSenderId(data.messagingSenderId || '');
        setAppId(data.appId || '');
        setMeasurementId(data.measurementId || '');
        setInitialData(data);
      }
    } catch (err) {
      showToast('Failed to load Firebase credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (initialData) {
      setApiKey(initialData.apiKey || '');
      setAuthDomain(initialData.authDomain || '');
      setDatabaseURL(initialData.databaseURL || '');
      setProjectId(initialData.projectId || '');
      setStorageBucket(initialData.storageBucket || '');
      setMessagingSenderId(initialData.messagingSenderId || '');
      setAppId(initialData.appId || '');
      setMeasurementId(initialData.measurementId || '');
      showToast('Reset to saved credentials', 'info');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        apiKey,
        authDomain,
        databaseURL,
        projectId,
        storageBucket,
        messagingSenderId,
        appId,
        measurementId
      };

      await api.put('/config/firebase', payload);
      setInitialData(payload);
      showToast('Firebase credentials updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to update Firebase configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  const isConfigured = !!(apiKey && projectId && appId);

  if (loading) {
    return (
      <div className="h-screen bg-[#F8F9FB] p-4 flex flex-col items-center justify-center">
        <Loader2 size={36} className="text-purple-600 animate-spin mb-4" />
        <p className="text-gray-500 font-semibold text-sm">Loading Firebase configuration...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-20 animate-fadeIn font-sans bg-[#F8F9FB] min-h-screen">
      
      {/* Header and Breadcrumb */}
      <div className="flex justify-between items-center select-none pb-2 border-b border-gray-100/50 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/admin/web-settings')}
            className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 hover:bg-gray-50 text-slate-600 transition-colors"
            title="Back to Web Settings"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-xl font-bold text-[#334257]">Firebase Settings</h2>
        </div>
        <div className="text-xs md:text-sm text-gray-400 font-medium">
          Home / <span className="text-slate-600 font-semibold">Firebase Settings</span>
        </div>
      </div>

      <div className="space-y-8 flex-1 max-w-5xl mx-auto w-full">
        {/* Connection Status Banner */}
        <div className={`p-5 rounded-2xl border flex items-center justify-between gap-4 ${
          isConfigured 
            ? 'bg-emerald-50 border-emerald-100/80 text-emerald-800' 
            : 'bg-amber-50 border-amber-100/80 text-amber-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isConfigured ? 'bg-emerald-100' : 'bg-amber-100'}`}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold">
                {isConfigured ? 'Firebase Service Connected' : 'Firebase Partially Configured'}
              </h4>
              <p className="text-xs opacity-80 font-medium mt-0.5">
                {isConfigured 
                  ? 'Your push notification messaging, custom SMS templates, and cloud authentication structures are fully active.' 
                  : 'Complete the projectId, apiKey, and appId configurations to authorize background services.'}
              </p>
            </div>
          </div>
          {isConfigured && (
            <span className="bg-emerald-600 text-white text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-wider select-none shrink-0 flex items-center gap-1.5 shadow-sm">
              <Sparkles size={11} /> Active
            </span>
          )}
        </div>

        {/* Credentials Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-100 pb-3 flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <FirebaseLogo size={20} />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-slate-700 uppercase tracking-tight">Firebase Credentials & Parameters</h3>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Paste web SDK config object properties directly from the Firebase console.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField 
              label="API Key (apiKey)" 
              value={apiKey} 
              onChange={setApiKey} 
              placeholder="Ex: AIzaSyA1..." 
            />
            <InputField 
              label="Project ID (projectId)" 
              value={projectId} 
              onChange={setProjectId} 
              placeholder="Ex: my-app-12345" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField 
              label="Auth Domain (authDomain)" 
              value={authDomain} 
              onChange={setAuthDomain} 
              placeholder="Ex: my-app-12345.firebaseapp.com" 
            />
            <InputField 
              label="Database URL (databaseURL)" 
              value={databaseURL} 
              onChange={setDatabaseURL} 
              placeholder="Ex: https://my-app-12345.firebaseio.com" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField 
              label="Storage Bucket (storageBucket)" 
              value={storageBucket} 
              onChange={setStorageBucket} 
              placeholder="Ex: my-app-12345.appspot.com" 
            />
            <InputField 
              label="Messaging Sender ID (messagingSenderId)" 
              value={messagingSenderId} 
              onChange={setMessagingSenderId} 
              placeholder="Ex: 874635198273" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField 
              label="Application ID (appId)" 
              value={appId} 
              onChange={setAppId} 
              placeholder="Ex: 1:874635198273:web:a1b2c3d4..." 
            />
            <InputField 
              label="Measurement ID (measurementId)" 
              value={measurementId} 
              onChange={setMeasurementId} 
              placeholder="Ex: G-ABC123XYZ" 
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3.5">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="h-10 px-5 border border-gray-200 hover:bg-gray-50 text-gray-400 text-xs font-bold rounded-lg shadow-sm transition uppercase flex items-center gap-1.5 cursor-pointer bg-white"
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-10 px-8 bg-[#004BB9] hover:bg-[#003d96] text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition uppercase flex items-center gap-2 cursor-pointer border-none"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save size={14} /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
