import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../../../store/toastStore';
import api, { BACKEND_URL } from '../../../lib/api';
import { 
  Upload, 
  Save, 
  HelpCircle, 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle,
  RotateCcw,
  Loader2,
  Image as ImageIcon 
} from 'lucide-react';

const StoreSetting = () => {
  const navigate = useNavigate();
  const { showToast } = useToastStore();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialData, setInitialData] = useState(null);

  // System Settings states
  const [appName, setAppName] = useState('');
  const [supportNumber, setSupportNumber] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [copyright, setCopyright] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [taxName, setTaxName] = useState('GST Number');
  const [taxNumber, setTaxNumber] = useState('');
  const [lowStockLimit, setLowStockLimit] = useState('15');
  const [address, setAddress] = useState('');

  // Maintenance Messages
  const [customerMaintMsg, setCustomerMaintMsg] = useState('');
  const [deliveryMaintMsg, setDeliveryMaintMsg] = useState('');

  // Logo asset
  const [logo, setLogo] = useState('');

  // Versions
  const [androidVersion, setAndroidVersion] = useState('1.0.0');
  const [iosVersion, setIosVersion] = useState('1.0.0');

  // Deliverability
  const [globalFreeDelivery, setGlobalFreeDelivery] = useState('500');

  // Refer & Earn
  const [referMethod, setReferMethod] = useState('Percentage (%)');
  const [referBonus, setReferBonus] = useState('10');
  const [referMinOrder, setReferMinOrder] = useState('100');

  // Toggles
  const [settings, setSettings] = useState({
    enableCartButton: true,
    expandProductImages: false,
    enableLocalPickup: false,
    zipcodeWiseDelivery: true,
    orderDeliveryOtp: true,
    referEarnStatus: true,
    systemStatus: true,
    customerAppMaint: false,
    deliveryBoyMaint: false,
    googleLogin: true,
    appleLogin: false,
    whatsappShare: true,
    pincodeWise: true,
    cityWise: false,
    walletBalance: false
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/config/store');
      const data = res.data?.data || {};
      
      setInitialData(data);
      applySettings(data);
    } catch (err) {
      showToast('Failed to load store settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applySettings = (data) => {
    setAppName(data.site_title || '');
    setSupportNumber(data.support_number || '');
    setSupportEmail(data.support_email || '');
    setCopyright(data.copyright_details || '');
    setTimezone(data.system_timezone || 'Asia/Kolkata');
    setTaxName(data.tax_name || 'GST Number');
    setTaxNumber(data.tax_number || '');
    setLowStockLimit(data.low_stock_limit || '15');
    setAddress(data.address || '');

    setCustomerMaintMsg(data.customer_app_maintenance_msg || '');
    setDeliveryMaintMsg(data.delivery_boy_maintenance_msg || '');

    setLogo(data.logo || '');
    
    setAndroidVersion(data.store_setting_android_version || '1.0.0');
    setIosVersion(data.store_setting_ios_version || '1.0.0');

    setGlobalFreeDelivery(data.global_free_delivery_threshold || '500');

    setReferMethod(data.refer_earn_method || 'Percentage (%)');
    setReferBonus(data.refer_earn_bonus || '10');
    setReferMinOrder(data.refer_earn_min_order || '100');

    setSettings({
      enableCartButton: data.store_setting_enable_cart_button === '1',
      expandProductImages: data.store_setting_expand_product_images === '1',
      enableLocalPickup: data.store_setting_enable_local_pickup === '1',
      zipcodeWiseDelivery: data.store_setting_zipcode_wise_delivery === '1',
      orderDeliveryOtp: data.store_setting_order_delivery_otp === '1',
      referEarnStatus: data.refer_earn_status === '1',
      systemStatus: data.store_setting_system_status === '1',
      customerAppMaint: data.store_setting_customer_app_maintenance === '1',
      deliveryBoyMaint: data.store_setting_delivery_boy_maintenance === '1',
      googleLogin: data.store_setting_google_login === '1',
      appleLogin: data.store_setting_apple_login === '1',
      whatsappShare: data.store_setting_whatsapp_share === '1',
      pincodeWise: data.store_setting_pincode_wise === '1',
      cityWise: data.store_setting_city_wise === '1',
      walletBalance: data.store_setting_wallet_balance === '1'
    });
  };

  const handleReset = () => {
    if (initialData) {
      applySettings(initialData);
      showToast('Reset to saved settings', 'info');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        site_title: appName,
        support_number: supportNumber,
        support_email: supportEmail,
        copyright_details: copyright,
        system_timezone: timezone,
        tax_name: taxName,
        tax_number: taxNumber,
        low_stock_limit: lowStockLimit,
        address: address,
        customer_app_maintenance_msg: customerMaintMsg,
        delivery_boy_maintenance_msg: deliveryMaintMsg,
        logo: logo,
        store_setting_android_version: androidVersion,
        store_setting_ios_version: iosVersion,
        global_free_delivery_threshold: globalFreeDelivery,
        refer_earn_method: referMethod,
        refer_earn_bonus: referBonus,
        refer_earn_min_order: referMinOrder,
        store_setting_enable_cart_button: settings.enableCartButton ? '1' : '0',
        store_setting_expand_product_images: settings.expandProductImages ? '1' : '0',
        store_setting_enable_local_pickup: settings.enableLocalPickup ? '1' : '0',
        store_setting_zipcode_wise_delivery: settings.zipcodeWiseDelivery ? '1' : '0',
        store_setting_order_delivery_otp: settings.orderDeliveryOtp ? '1' : '0',
        refer_earn_status: settings.referEarnStatus ? '1' : '0',
        store_setting_system_status: settings.systemStatus ? '1' : '0',
        store_setting_customer_app_maintenance: settings.customerAppMaint ? '1' : '0',
        store_setting_delivery_boy_maintenance: settings.deliveryBoyMaint ? '1' : '0',
        store_setting_google_login: settings.googleLogin ? '1' : '0',
        store_setting_apple_login: settings.appleLogin ? '1' : '0',
        store_setting_whatsapp_share: settings.whatsappShare ? '1' : '0',
        store_setting_pincode_wise: settings.pincodeWise ? '1' : '0',
        store_setting_city_wise: settings.cityWise ? '1' : '0',
        store_setting_wallet_balance: settings.walletBalance ? '1' : '0'
      };

      await api.put('/config/store', payload);
      setInitialData(payload);
      showToast('Store settings updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to update store settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    try {
      showToast('Uploading app logo...', 'info');
      const res = await api.post('/config/store/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setLogo(res.data.logo_url);
      showToast('Logo uploaded successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to upload logo', 'error');
    }
  };

  const toggleSwitch = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const SectionCard = ({ title, children, subtitle, badge }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-5 transition-all">
      <div className="flex justify-between items-center border-b pb-3">
        <div>
          <h3 className="text-[16px] font-bold text-slate-700 uppercase tracking-tight">{title}</h3>
          {subtitle && <p className="text-[11px] text-red-500 font-semibold mt-1">{subtitle}</p>}
        </div>
        {badge}
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </div>
  );

  if (loading) {
    return (
      <div className="h-screen bg-[#F8F9FB] p-4 flex flex-col items-center justify-center">
        <Loader2 size={36} className="text-purple-600 animate-spin mb-4" />
        <p className="text-gray-500 font-semibold text-sm">Loading store settings...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-20 animate-fadeIn font-sans bg-[#f4f7fe]">
      {/* Header & Breadcrumb */}
      <div className="flex justify-between items-center select-none">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 text-slate-600 transition-colors border border-gray-100"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-slate-700">Store Settings</h2>
        </div>
        <div className="text-sm text-gray-400">
          Home / System settings / <span className="text-slate-600 font-semibold">Store Setting</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          <SectionCard title="System Settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <Input label="App Name" required value={appName} onChange={setAppName} />
              <Input label="Support Number" required value={supportNumber} onChange={setSupportNumber} />
              <Input label="Support Email" required value={supportEmail} onChange={setSupportEmail} />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Copyright Details</label>
                <textarea 
                  value={copyright} 
                  onChange={(e) => setCopyright(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm min-h-[40px] outline-none focus:border-purple-500 bg-white font-medium text-gray-700" 
                  placeholder="© 2026 AQUA MACHINE" 
                />
              </div>
              <Input label="System Timezone" required value={timezone} onChange={setTimezone} />
              <Input label="Tax Name" value={taxName} onChange={setTaxName} />
              <Input label="Tax Number" value={taxNumber} onChange={setTaxNumber} placeholder="Ex: GSTIN24000..." />
              <Input label="Low stock limit" value={lowStockLimit} onChange={setLowStockLimit} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Address <span className="text-red-500">*</span></label>
              <textarea 
                value={address} 
                onChange={(e) => setAddress(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm h-20 outline-none focus:border-purple-500 bg-white font-medium text-gray-700" 
              />
            </div>
          </SectionCard>

          <SectionCard 
            title="Maintenance Mode" 
            subtitle="[ Enabling this will show 'Under Maintenance' screen to users ]"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-gray-100">
                  <span className="text-sm font-bold text-slate-700">Customer App</span>
                  <Switch enabled={settings.customerAppMaint} onChange={() => toggleSwitch('customerAppMaint')} />
                </div>
                <textarea 
                  value={customerMaintMsg} 
                  onChange={(e) => setCustomerMaintMsg(e.target.value)}
                  placeholder="Message for customers..." 
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm h-16 outline-none focus:border-purple-500 bg-white font-medium text-gray-700" 
                />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-gray-100">
                  <span className="text-sm font-bold text-slate-700">Delivery Boy App</span>
                  <Switch enabled={settings.deliveryBoyMaint} onChange={() => toggleSwitch('deliveryBoyMaint')} />
                </div>
                <textarea 
                  value={deliveryMaintMsg} 
                  onChange={(e) => setDeliveryMaintMsg(e.target.value)}
                  placeholder="Message for delivery boys..." 
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm h-16 outline-none focus:border-purple-500 bg-white font-medium text-gray-700" 
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Cron Job Settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-600 uppercase">Promo Code Cron</label>
                  <span className="bg-indigo-600 text-[9px] text-white px-1.5 py-0.5 rounded cursor-pointer select-none">How it works?</span>
                </div>
                <input readOnly value={`${BACKEND_URL}/admin/cron/promo`} className="w-full p-2 bg-gray-50 border rounded text-[10px] text-gray-400 font-mono outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase">Flash Sale Cron</label>
                <input readOnly value={`${BACKEND_URL}/admin/cron/flash`} className="w-full p-2 bg-gray-50 border rounded text-[10px] text-gray-400 font-mono outline-none" />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6">
          <SectionCard title="Logo & Assets">
            <div 
              onClick={() => fileInputRef.current.click()}
              className="group border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-purple-400 transition-all bg-slate-50 relative overflow-hidden min-h-[150px] select-none"
            >
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
              {logo ? (
                <img 
                  src={logo.startsWith('/') ? `${api.defaults.baseURL?.replace('/api', '') || ''}${logo}` : logo} 
                  alt="App Logo" 
                  className="w-24 h-24 object-contain" 
                />
              ) : (
                <>
                  <Upload className="text-gray-400 group-hover:text-purple-500 animate-pulse" size={30} />
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Upload App Logo</p>
                </>
              )}
            </div>
            
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <ToggleRow label="Enable Cart Button?" enabled={settings.enableCartButton} onToggle={() => toggleSwitch('enableCartButton')} />
              <ToggleRow label="Expand Images?" enabled={settings.expandProductImages} onToggle={() => toggleSwitch('expandProductImages')} />
              <ToggleRow label="Local Pickup?" enabled={settings.enableLocalPickup} onToggle={() => toggleSwitch('enableLocalPickup')} />
            </div>
          </SectionCard>

          <SectionCard title="App Versions">
            <ToggleRow label="System Status" enabled={settings.systemStatus} onToggle={() => toggleSwitch('systemStatus')} />
            <div className="grid grid-cols-2 gap-4 mt-2">
              <Input label="Android" value={androidVersion} onChange={setAndroidVersion} />
              <Input label="iOS" value={iosVersion} onChange={setIosVersion} />
            </div>
          </SectionCard>

          <SectionCard title="Deliverability">
            <ToggleRow label="Pincode Wise" enabled={settings.pincodeWise} onToggle={() => toggleSwitch('pincodeWise')} />
            <ToggleRow label="City Wise" enabled={settings.cityWise} onToggle={() => toggleSwitch('cityWise')} />
            <Input label="Global Free Delivery (₹)" value={globalFreeDelivery} onChange={setGlobalFreeDelivery} />
          </SectionCard>
        </div>
      </div>

      {/* Refer & Earn */}
      <SectionCard title="Refer & Earn System">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <ToggleRow label="Status" enabled={settings.referEarnStatus} onToggle={() => toggleSwitch('referEarnStatus')} />
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Method</label>
            <select 
              value={referMethod} 
              onChange={(e) => setReferMethod(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none bg-white font-medium text-gray-700 focus:border-purple-500"
            >
              <option>Percentage (%)</option>
              <option>Fixed Amount (₹)</option>
            </select>
          </div>
          <Input label="Bonus" value={referBonus} onChange={setReferBonus} />
          <Input label="Min Order" value={referMinOrder} onChange={setReferMinOrder} />
        </div>
      </SectionCard>

      {/* Actions */}
      <div className="flex justify-end gap-4 select-none">
        <button 
          onClick={handleReset}
          disabled={saving}
          className="bg-slate-200 text-slate-700 px-6 py-2.5 rounded-lg font-bold hover:bg-slate-300 disabled:opacity-50 transition-all flex items-center gap-2 border-none cursor-pointer"
        >
          <RotateCcw size={16} /> Reset
        </button>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-purple-600 text-white px-10 py-2.5 rounded-lg font-bold hover:bg-purple-700 disabled:bg-purple-400 transition-all shadow-lg flex items-center gap-2 border-none cursor-pointer"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save size={16} /> SAVE SETTINGS
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Reusable Controlled Input component
const Input = ({ label, required, value, onChange, placeholder }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[12px] font-bold text-slate-500 uppercase tracking-tight">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input 
      value={value || ''} 
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} 
      className="px-3 py-1.5 border border-gray-200 rounded-lg focus:border-purple-500 outline-none text-sm shadow-sm font-medium text-gray-700 bg-white" 
    />
  </div>
);

const ToggleRow = ({ label, enabled, onToggle }) => (
  <div className="flex justify-between items-center">
    <span className="text-sm text-slate-600 font-medium">{label}</span>
    <Switch enabled={enabled} onChange={onToggle} />
  </div>
);

const Switch = ({ enabled, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors border-none cursor-pointer ${enabled ? 'bg-purple-600' : 'bg-gray-300'}`}
  >
    <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
  </button>
);

export default StoreSetting;
