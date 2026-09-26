import { useEffect, useState } from 'react';
import {
  Save,
  Banknote,
  QrCode,
  Settings,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import api from '../../../lib/api';
import { useToastStore } from '../../../store/toastStore';

const DEFAULT_CONFIG = {
  cod: {
    enabled: true,
    title: 'Cash on Delivery',
  },
  razorpay: {
    enabled: false,
    title: 'Razorpay UPI QR',
    environment: 'test',
    key_id: '',
    key_secret: '',
    key_secret_configured: false,
    currency: 'INR',
  },
  payu: {
    enabled: false,
    title: 'PayU Checkout',
    environment: 'test',
    merchant_key: '',
    merchant_salt: '',
    merchant_salt_configured: false,
    currency: 'INR',
  },
};

export default function PaymentMethods() {
  const { showToast } = useToastStore();
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState('razorpay');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  const handleTestConnection = async () => {
    try {
      setTestingConnection(true);
      const res = await api.post('/admin/payment-methods/test-razorpay', {
        key_id: config.razorpay.key_id,
        key_secret: config.razorpay.key_secret,
      });
      showToast(res.data.message || 'Razorpay connection test successful!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Razorpay connection test failed', 'error');
    } finally {
      setTestingConnection(false);
    }
  };

  const activeMethod = config[activeTab];

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const res = await api.get('/admin/payment-methods');
        setConfig({
          cod: { ...DEFAULT_CONFIG.cod, ...res.data.methods?.cod },
          razorpay: {
            ...DEFAULT_CONFIG.razorpay,
            ...res.data.methods?.razorpay,
            key_secret: '',
          },
          payu: {
            ...DEFAULT_CONFIG.payu,
            ...res.data.methods?.payu,
            merchant_salt: '',
          },
        });
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to load payment gateways', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentMethods();
  }, [showToast]);

  const updateMethod = (method, updates) => {
    setConfig(prev => ({
      ...prev,
      [method]: {
        ...prev[method],
        ...updates,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.put('/admin/payment-methods', {
        cod: {
          enabled: config.cod.enabled,
        },
        razorpay: {
          enabled: config.razorpay.enabled,
          environment: config.razorpay.environment,
          key_id: config.razorpay.key_id,
          key_secret: config.razorpay.key_secret,
        },
        payu: {
          enabled: config.payu.enabled,
          environment: config.payu.environment,
          merchant_key: config.payu.merchant_key,
          merchant_salt: config.payu.merchant_salt,
        },
      });

      setConfig({
        cod: { ...DEFAULT_CONFIG.cod, ...res.data.methods?.cod },
        razorpay: {
          ...DEFAULT_CONFIG.razorpay,
          ...res.data.methods?.razorpay,
          key_secret: '',
        },
        payu: {
          ...DEFAULT_CONFIG.payu,
          ...res.data.methods?.payu,
          merchant_salt: '',
        },
      });
      showToast(res.data.message || 'Payment gateways saved', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save payment gateways', 'error');
    } finally {
      setSaving(false);
    }
  };

  const methods = [
    {
      id: 'cod',
      name: 'Cash On Delivery',
      icon: <Banknote size={16} />,
      enabled: config.cod.enabled,
      subtitle: 'Offline Indian delivery payment',
    },
    {
      id: 'razorpay',
      name: 'Razorpay UPI QR',
      icon: <QrCode size={16} />,
      enabled: config.razorpay.enabled && config.razorpay.key_secret_configured && Boolean(config.razorpay.key_id?.startsWith?.('rzp_')),
      subtitle: 'Indian online payment gateway',
    },
    {
      id: 'payu',
      name: 'PayU Checkout',
      icon: <CreditCard size={16} />,
      enabled: config.payu.enabled && config.payu.merchant_salt_configured && Boolean(config.payu.merchant_key),
      subtitle: 'Hosted PayU checkout page',
    },
  ];

  if (loading) {
    return (
      <div className="h-full bg-[#F7F8FA] p-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F7F8FA] p-4 font-sans text-[#455560] overflow-hidden flex flex-col">
      <div className="mb-4 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white rounded shadow-sm">
            <Settings size={16} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#334257]">Payment Gateways</h1>
            <p className="text-[10px] text-gray-400 font-medium">Indian payment methods for checkout</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        <div className="w-[260px] space-y-2 shrink-0 overflow-hidden">
          {methods.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full cursor-pointer bg-white px-3 py-3 rounded-lg border transition-all text-left ${
                activeTab === item.id
                  ? 'border-purple-500 shadow-sm ring-1 ring-purple-500/10'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-1.5 rounded bg-purple-50 text-purple-600 shrink-0">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[11px] font-bold text-[#334257] truncate">{item.name}</h4>
                    <p className="text-[9px] font-semibold text-gray-400 truncate">{item.subtitle}</p>
                  </div>
                </div>
                {item.enabled ? (
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                ) : (
                  <XCircle size={13} className="text-gray-300 shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded border border-gray-100 flex items-center justify-center shadow-sm text-purple-600">
                {activeTab === 'cod' ? <Banknote size={16} /> : activeTab === 'razorpay' ? <QrCode size={16} /> : <CreditCard size={16} />}
              </div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                {activeMethod.title} Config
              </h2>
            </div>
            <ToggleSwitch
              checked={Boolean(activeMethod.enabled)}
              onChange={() => updateMethod(activeTab, { enabled: !activeMethod.enabled })}
            />
          </div>

          <div className="p-5 flex-1 space-y-4 overflow-y-auto">
            {activeTab === 'cod' && (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 flex gap-3">
                <Banknote size={18} className="text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-900">Cash on Delivery</p>
                  <p className="text-[11px] font-semibold text-emerald-700 mt-1">
                    When enabled, customers can place orders without online payment.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'razorpay' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <AdminInput
                    label="Gateway Title"
                    value={config.razorpay.title}
                    readOnly
                  />
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter ml-0.5">
                      Environment
                    </label>
                    <select
                      value={config.razorpay.environment}
                      onChange={(e) => updateMethod('razorpay', { environment: e.target.value })}
                      className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-3 py-2 rounded text-[11px] font-bold text-slate-700 focus:border-blue-500 outline-none"
                    >
                      <option value="test">Test</option>
                      <option value="live">Live</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <AdminInput
                    label="Razorpay Key ID"
                    value={config.razorpay.key_id}
                    onChange={(value) => updateMethod('razorpay', { key_id: value })}
                    placeholder="rzp_test_..."
                  />
                  <AdminInput
                    label="Razorpay Key Secret"
                    type="password"
                    value={config.razorpay.key_secret}
                    onChange={(value) => updateMethod('razorpay', { key_secret: value })}
                    placeholder={config.razorpay.key_secret_configured ? 'Saved - leave blank to keep' : 'Enter secret key'}
                  />
                </div>

                <div className="bg-[#E9F3FF] p-3 rounded-lg border border-[#D1E7FF] flex gap-3">
                  <Info size={14} className="text-[#0067FF] shrink-0" />
                  <div className="text-[10px]">
                    <p className="font-bold text-[#004BB9] uppercase tracking-tighter">Checkout Behavior</p>
                    <p className="mt-1 text-[#004BB9] font-semibold">
                      Razorpay opens UPI payment (QR scan or UPI ID) for the exact checkout total. Enable UPI in your Razorpay Dashboard (Settings → Payment methods). Test keys must use Test mode; live keys need KYC and UPI enabled by Razorpay support if you see server errors.
                    </p>
                  </div>
                </div>

                <div className={`p-3 rounded-lg border flex items-start gap-3 ${
                  config.razorpay.key_secret_configured && config.razorpay.key_id?.startsWith?.('rzp_')
                    ? 'bg-emerald-50 border-emerald-100'
                    : 'bg-amber-50 border-amber-100'
                }`}>
                  <ShieldCheck size={16} className={`shrink-0 ${
                    config.razorpay.key_secret_configured ? 'text-emerald-600' : 'text-amber-600'
                  }`} />
                  <div className="text-[10px] font-bold">
                    {config.razorpay.key_secret_configured && config.razorpay.key_id?.startsWith?.('rzp_') ? (
                      <p className="text-emerald-800">Razorpay is ready — customers can select it on checkout.</p>
                    ) : (
                      <>
                        <p className="text-amber-900">Razorpay is not ready yet</p>
                        <p className="text-amber-800 font-semibold mt-1">
                          Turn ON the toggle, paste your Key ID (rzp_test_...) and Key Secret from{' '}
                          <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noreferrer" className="underline">
                            Razorpay Dashboard → API Keys
                          </a>
                          , then click Save.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payu' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <AdminInput
                    label="Gateway Title"
                    value={config.payu.title}
                    readOnly
                  />
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter ml-0.5">
                      Environment
                    </label>
                    <select
                      value={config.payu.environment}
                      onChange={(e) => updateMethod('payu', { environment: e.target.value })}
                      className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-3 py-2 rounded text-[11px] font-bold text-slate-700 focus:border-blue-500 outline-none"
                    >
                      <option value="test">Test</option>
                      <option value="live">Live</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <AdminInput
                    label="PayU Merchant Key"
                    value={config.payu.merchant_key}
                    onChange={(value) => updateMethod('payu', { merchant_key: value })}
                    placeholder="Enter Merchant Key"
                  />
                  <AdminInput
                    label="PayU Merchant Salt"
                    type="password"
                    value={config.payu.merchant_salt}
                    onChange={(value) => updateMethod('payu', { merchant_salt: value })}
                    placeholder={config.payu.merchant_salt_configured ? 'Saved - leave blank to keep' : 'Enter merchant salt'}
                  />
                </div>

                <div className="bg-[#E9F3FF] p-3 rounded-lg border border-[#D1E7FF] flex gap-3">
                  <Info size={14} className="text-[#0067FF] shrink-0" />
                  <div className="text-[10px]">
                    <p className="font-bold text-[#004BB9] uppercase tracking-tighter">Checkout Behavior</p>
                    <p className="mt-1 text-[#004BB9] font-semibold">
                      PayU redirects customers to the secure hosted checkout page. After payment is complete, customers are redirected back to the order success page. Ensure the Merchant Key and Salt match your PayU environment (Sandbox/Production).
                    </p>
                  </div>
                </div>

                <div className={`p-3 rounded-lg border flex items-start gap-3 ${
                  config.payu.merchant_salt_configured && config.payu.merchant_key
                    ? 'bg-emerald-50 border-emerald-100'
                    : 'bg-amber-50 border-amber-100'
                }`}>
                  <ShieldCheck size={16} className={`shrink-0 ${
                    config.payu.merchant_salt_configured ? 'text-emerald-600' : 'text-amber-600'
                  }`} />
                  <div className="text-[10px] font-bold">
                    {config.payu.merchant_salt_configured && config.payu.merchant_key ? (
                      <p className="text-emerald-800">PayU Checkout is ready — customers can select it on checkout.</p>
                    ) : (
                      <>
                        <p className="text-amber-900">PayU is not ready yet</p>
                        <p className="text-amber-800 font-semibold mt-1">
                          Turn ON the toggle, paste your Merchant Key and Merchant Salt from your PayU Dashboard, then click Save.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-5 py-3 bg-slate-50 border-t border-gray-100 flex justify-end gap-2 shrink-0">
            {activeTab === 'razorpay' && (
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection || saving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-md flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed mr-auto sm:mr-0"
              >
                {testingConnection ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                Test Connection
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || testingConnection}
              className="px-6 py-2 bg-[#004BB9] text-white rounded text-[11px] font-bold hover:bg-[#003A8F] shadow-md flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const AdminInput = ({ label, type = 'text', placeholder, value, onChange, readOnly = false }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter ml-0.5">{label}</label>
    <input
      type={type}
      value={value}
      readOnly={readOnly}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-3 py-2 rounded text-[11px] font-bold text-slate-700 focus:border-blue-400 outline-none transition-all read-only:text-slate-400"
    />
  </div>
);

const ToggleSwitch = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={`w-9 h-5 rounded-full p-0.5 flex items-center transition-all ${checked ? 'bg-blue-600 justify-end' : 'bg-gray-200 justify-start'}`}
  >
    <span className="w-4 h-4 bg-white rounded-full shadow-xs" />
  </button>
);
