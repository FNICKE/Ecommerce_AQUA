import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../../../store/toastStore';
import api from '../../../lib/api';
import { 
  RotateCcw, 
  Save, 
  Upload, 
  ChevronLeft, 
  Loader2, 
  ShieldCheck, 
  HelpCircle, 
  Sparkles 
} from 'lucide-react';

// Custom toggle switch matching the mockup aesthetic
const ToggleSwitch = ({ enabled, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={`relative inline-flex items-center h-7 w-16 cursor-pointer rounded border border-gray-200 transition-colors duration-200 outline-none select-none shrink-0 ${
      enabled ? 'bg-green-600' : 'bg-red-500'
    }`}
  >
    <span className="w-full flex justify-between px-1.5 text-[9px] font-bold text-white uppercase select-none">
      {enabled ? (
        <>
          <span className="leading-5">ON</span>
          <span className="w-4 h-4 bg-white rounded shadow-sm self-center" />
        </>
      ) : (
        <>
          <span className="w-4 h-4 bg-white rounded shadow-sm self-center" />
          <span className="leading-5">OFF</span>
        </>
      )}
    </span>
  </button>
);

// Custom premium color picker input with transparent checkered background indicator
const ColorPickerInput = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-1.5 flex-1 min-w-[120px]">
    <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-tight">{label}</label>
    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm h-10 px-3">
      <input 
        type="text" 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 outline-none text-sm text-gray-700 font-mono w-full"
        placeholder="#000000"
      />
      <div 
        className="relative w-7 h-7 rounded border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center ml-2 cursor-pointer"
        style={{
          backgroundImage: 'conic-gradient(#ddd 0.25turn, #fff 0.25turn 0.5turn, #ddd 0.5turn 0.75turn, #fff 0.75turn)',
          backgroundSize: '8px 8px'
        }}
      >
        <input 
          type="color" 
          value={value || '#ffffff'} 
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
        <div className="w-full h-full" style={{ backgroundColor: value || 'transparent' }} />
      </div>
    </div>
  </div>
);

// Sub-component for individual settings sections (like visual cards in mockup)
const SectionCard = ({ title, subtitle, children, toggleState, onToggle }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-5">
    <div className="flex justify-between items-center border-b border-gray-100 pb-3 flex-wrap gap-2">
      <div>
        <h3 className="text-[16px] font-bold text-slate-700 uppercase tracking-tight">{title}</h3>
        {subtitle && <p className="text-[11px] text-gray-400 font-medium mt-1">{subtitle}</p>}
      </div>
      {onToggle && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-400 uppercase">Enable / Disable</span>
          <ToggleSwitch enabled={toggleState} onChange={onToggle} />
        </div>
      )}
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

export default function GeneralSettings() {
  const navigate = useNavigate();
  const { showToast } = useToastStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialData, setInitialData] = useState(null);

  // Core configuration states
  const [siteTitle, setSiteTitle] = useState('');
  const [siteName, setSiteName] = useState('');
  const [supportNumber, setSupportNumber] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [copyright, setCopyright] = useState('');
  const [address, setAddress] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [mapIframe, setMapIframe] = useState('');
  const [logo, setLogo] = useState('');
  const [favicon, setFavicon] = useState('');
  const [siteTitleImage, setSiteTitleImage] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  
  // Custom switch toggles
  const [devMode, setDevMode] = useState(false);
  const [appDownloadEnabled, setAppDownloadEnabled] = useState(false);
  const [appTitle, setAppTitle] = useState('');
  const [appTagline, setAppTagline] = useState('');
  const [appDesc, setAppDesc] = useState('');
  const [appPromoHeader, setAppPromoHeader] = useState('');
  const [playstoreUrl, setPlaystoreUrl] = useState('');
  const [applestoreUrl, setApplestoreUrl] = useState('');

  // Social Links
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialYoutube, setSocialYoutube] = useState('');
  const [socialWhatsapp, setSocialWhatsapp] = useState('');

  // Footer Settings
  const [footerDescription, setFooterDescription] = useState('');
  const [footerQuickLinks, setFooterQuickLinks] = useState([
    { text: 'Aquarium Collections', url: '/category' },
    { text: 'Products Catalog', url: '/products' },
    { text: 'About Our Brand', url: '/about' },
    { text: 'Contact Us', url: '/contact' }
  ]);
  const [footerSupportLinks, setFooterSupportLinks] = useState([
    { text: 'Track Order', url: '/my-orders' },
    { text: 'Privacy Policy', url: '/privacy' },
    { text: 'Terms of Service', url: '/terms' }
  ]);

  // Feature Section Switches & Content
  const [shippingEnabled, setShippingEnabled] = useState(true);
  const [shippingTitle, setShippingTitle] = useState('');
  const [shippingDesc, setShippingDesc] = useState('');
  
  const [returnsEnabled, setReturnsEnabled] = useState(true);
  const [returnsTitle, setReturnsTitle] = useState('');
  const [returnsDesc, setReturnsDesc] = useState('');

  const [supportEnabled, setSupportEnabled] = useState(true);
  const [supportTitle, setSupportTitle] = useState('');
  const [supportDesc, setSupportDesc] = useState('');

  const [safetyEnabled, setSafetyEnabled] = useState(true);
  const [safetyTitle, setSafetyTitle] = useState('');
  const [safetyDesc, setSafetyDesc] = useState('');

  // Colors & Themes
  const [primaryColor, setPrimaryColor] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [fontColor, setFontColor] = useState('');
  const [themeColor, setThemeColor] = useState('default');

  const logoInputRef = useRef(null);
  const faviconInputRef = useRef(null);
  const siteTitleImageInputRef = useRef(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/config/general');
      const data = res.data?.data || {};
      
      setInitialData(data);
      applySettings(data);
    } catch (err) {
      showToast('Failed to load general settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applySettings = (data) => {
    setSiteTitle(data.site_title || '');
    setSiteName(data.site_name || '');
    setSupportNumber(data.support_number || '');
    setSupportEmail(data.support_email || '');
    setCopyright(data.copyright_details || '');
    setAddress(data.address || '');
    setShortDesc(data.short_description || data.footer_description || '');
    setMapIframe(data.map_iframe || '');
    setLogo(data.logo || '');
    setFavicon(data.favicon || '');
    setSiteTitleImage(data.site_title_image || '');
    setMetaKeywords(data.meta_keywords || '');
    setMetaDescription(data.meta_description || '');
    
    setDevMode(data.developer_mode === '1');
    setAppDownloadEnabled(data.app_download_enabled === '1');
    setAppTitle(data.app_download_title || '');
    setAppTagline(data.app_download_tagline || '');
    setAppDesc(data.app_download_description || '');
    setAppPromoHeader(data.app_download_promo_header || '');
    setPlaystoreUrl(data.app_download_playstore_url || '');
    setApplestoreUrl(data.app_download_applestore_url || '');

    setSocialFacebook(data.social_facebook || '');
    setSocialInstagram(data.social_instagram || '');
    setSocialYoutube(data.social_youtube || '');
    setSocialWhatsapp(data.social_whatsapp || '');

    setFooterDescription(data.short_description || data.footer_description || '');
    try { const ql = JSON.parse(data.footer_quick_links || '[]'); if (Array.isArray(ql) && ql.length) setFooterQuickLinks(ql); } catch {}
    try { const sl = JSON.parse(data.footer_support_links || '[]'); if (Array.isArray(sl) && sl.length) setFooterSupportLinks(sl); } catch {};

    setShippingEnabled(data.feature_shipping_enabled === '1');
    setShippingTitle(data.feature_shipping_title || '');
    setShippingDesc(data.feature_shipping_description || '');

    setReturnsEnabled(data.feature_returns_enabled === '1');
    setReturnsTitle(data.feature_returns_title || '');
    setReturnsDesc(data.feature_returns_description || '');

    setSupportEnabled(data.feature_support_enabled === '1');
    setSupportTitle(data.feature_support_title || '');
    setSupportDesc(data.feature_support_description || '');

    setSafetyEnabled(data.feature_safety_enabled === '1');
    setSafetyTitle(data.feature_safety_title || '');
    setSafetyDesc(data.feature_safety_description || '');

    setPrimaryColor(data.theme_classic_primary_color || '');
    setSecondaryColor(data.theme_classic_secondary_color || '');
    setFontColor(data.theme_classic_font_color || '');
    setThemeColor(data.theme_color || 'default');
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
        site_title: siteTitle,
        site_name: siteName,
        support_number: supportNumber,
        support_email: supportEmail,
        copyright_details: copyright,
        address: address,
        short_description: shortDesc,
        map_iframe: mapIframe,
        logo: logo,
        favicon: favicon,
        site_title_image: siteTitleImage,
        meta_keywords: metaKeywords,
        meta_description: metaDescription,
        developer_mode: devMode ? '1' : '0',
        app_download_enabled: appDownloadEnabled ? '1' : '0',
        app_download_title: appTitle,
        app_download_tagline: appTagline,
        app_download_description: appDesc,
        app_download_promo_header: appPromoHeader,
        app_download_playstore_url: playstoreUrl,
        app_download_applestore_url: applestoreUrl,
        social_facebook: socialFacebook,
        social_twitter: '',
        social_instagram: socialInstagram,
        social_youtube: socialYoutube,
        social_whatsapp: socialWhatsapp,
        footer_description: footerDescription,
        footer_quick_links: JSON.stringify(footerQuickLinks),
        footer_support_links: JSON.stringify(footerSupportLinks),
        feature_shipping_enabled: shippingEnabled ? '1' : '0',
        feature_shipping_title: shippingTitle,
        feature_shipping_description: shippingDesc,
        feature_returns_enabled: returnsEnabled ? '1' : '0',
        feature_returns_title: returnsTitle,
        feature_returns_description: returnsDesc,
        feature_support_enabled: supportEnabled ? '1' : '0',
        feature_support_title: supportTitle,
        feature_support_description: supportDesc,
        feature_safety_enabled: safetyEnabled ? '1' : '0',
        feature_safety_title: safetyTitle,
        feature_safety_description: safetyDesc,
        theme_classic_primary_color: primaryColor,
        theme_classic_secondary_color: secondaryColor,
        theme_classic_font_color: fontColor,
        theme_color: themeColor
      };

      await api.put('/config/general', payload);
      setInitialData(payload);

      // Update window site title / name and dispatch event for live preview updates
      window.siteTitle = siteTitle;
      window.siteName = siteName;
      window.metaKeywords = metaKeywords;
      window.metaDescription = metaDescription;
      window.dispatchEvent(new Event('siteTitleLoaded'));

      // Instantly apply color variables to document.documentElement for real-time preview
      const root = document.documentElement;
      if (primaryColor && primaryColor.trim() !== '') {
        root.style.setProperty('--primary', primaryColor);
        const adjustColorBrightness = (hex, percent) => {
          if (!hex || hex.trim() === '') return '';
          let num = parseInt(hex.replace("#",""), 16),
          amt = Math.round(2.55 * percent),
          R = (num >> 16) + amt,
          G = (num >> 8 & 0x00FF) + amt,
          B = (num & 0x0000FF) + amt;
          return "#" + (0x1000000 + (R<255?R<0?0:R:255)*0x10000 + (G<255?G<0?0:G:255)*0x100 + (B<255?B<0?0:B:255)).toString(16).slice(1);
        };
        root.style.setProperty('--primary-dark', adjustColorBrightness(primaryColor, -15));
        root.style.setProperty('--primary-light', adjustColorBrightness(primaryColor, 40));
      }
      if (secondaryColor && secondaryColor.trim() !== '') {
        root.style.setProperty('--secondary', secondaryColor);
      }
      if (fontColor && fontColor.trim() !== '') {
        root.style.setProperty('--text-primary', fontColor);
      }

      showToast('General settings updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to update general settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append(type, file);

    try {
      showToast(`Uploading ${type}...`, 'info');
      const res = await api.post(`/config/general/${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (type === 'logo') {
        setLogo(res.data.logo_url);
      } else if (type === 'site_title_image') {
        setSiteTitleImage(res.data.site_title_image_url);
      } else {
        const favUrl = res.data.favicon_url;
        setFavicon(favUrl);
        if (favUrl && favUrl.trim() !== '') {
          const faviconUrl = favUrl.startsWith('/')
            ? `${api.defaults.baseURL?.replace('/api', '') || ''}${favUrl}`
            : favUrl;
          let faviconLink = document.querySelector("link[rel~='icon']");
          if (!faviconLink) {
            faviconLink = document.createElement('link');
            faviconLink.rel = 'icon';
            document.head.appendChild(faviconLink);
          }
          faviconLink.href = faviconUrl;
        }
      }
      showToast(`${type.toUpperCase()} uploaded successfully!`, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || `Failed to upload ${type}`, 'error');
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#F8F9FB] p-4 flex flex-col items-center justify-center">
        <Loader2 size={36} className="text-purple-600 animate-spin mb-4" />
        <p className="text-gray-500 font-semibold text-sm">Loading general website settings...</p>
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
          <h2 className="text-xl font-bold text-[#334257]">General Website Settings</h2>
        </div>
        <div className="text-xs md:text-sm text-gray-400 font-medium">
          Home / <span className="text-slate-600 font-semibold">General Website Settings</span>
        </div>
      </div>

      {/* Main Form Fields Container */}
      <div className="space-y-8 flex-1 max-w-7xl mx-auto w-full">
        
        {/* Section 1: Main settings */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-tight">
                Website Name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                value={siteName} 
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="Enter Website Name"
                className="px-3 h-10 border border-gray-200 rounded-lg focus:border-purple-500 outline-none text-sm text-gray-700 shadow-sm bg-white font-medium" 
              />
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-tight">
                Home Title <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                value={siteTitle} 
                onChange={(e) => setSiteTitle(e.target.value)}
                placeholder="Enter Home Title"
                className="w-full px-3 h-10 border border-gray-200 rounded-lg focus:border-purple-500 outline-none text-sm text-gray-700 shadow-sm bg-white font-medium" 
              />
              
              {/* Site Title Image Actions/Preview */}
              <div className="flex flex-col gap-2 mt-1.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => siteTitleImageInputRef.current?.click()}
                    className="h-8 px-2.5 bg-[#6d28d9] hover:bg-[#5b21b6] text-white text-[10px] font-bold rounded-lg shadow-sm transition uppercase flex items-center gap-1.5 shrink-0 cursor-pointer border-none"
                    title="Upload Site Title Image"
                  >
                    <Upload size={12} /> Upload Image
                  </button>
                  <input 
                    type="file" 
                    ref={siteTitleImageInputRef} 
                    onChange={(e) => handleImageUpload(e, 'site_title_image')} 
                    className="hidden" 
                    accept="image/*" 
                  />
                  <p className="text-[9px] text-gray-400 font-medium italic mt-0.5">*Optional Title Image</p>
                </div>
                
                {siteTitleImage && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg border border-gray-100 shadow-sm p-1 flex items-center justify-center relative overflow-hidden select-none">
                      <img 
                        src={siteTitleImage.startsWith('/') ? `${api.defaults.baseURL?.replace('/api', '') || ''}${siteTitleImage}` : siteTitleImage} 
                        alt="Site Title Image" 
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setSiteTitleImage('')}
                      className="text-[10px] text-red-500 hover:text-red-700 font-bold uppercase transition bg-transparent border-none cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
            <InputField 
              label="Support Number" 
              required 
              value={supportNumber} 
              onChange={setSupportNumber} 
            />
            <InputField 
              label="Support Email" 
              required 
              value={supportEmail} 
              onChange={setSupportEmail} 
            />
          </div>

          <TextareaField 
            label="Copyright Details" 
            required 
            rows={2} 
            value={copyright} 
            onChange={setCopyright} 
          />
          <TextareaField 
            label="Address" 
            required 
            rows={3} 
            value={address} 
            onChange={setAddress} 
          />
          <TextareaField 
            label="Short Description" 
            required 
            rows={3} 
            value={shortDesc} 
            onChange={(val) => {
              setShortDesc(val);
              setFooterDescription(val);
            }} 
          />
          <TextareaField 
            label="Map Iframe" 
            required 
            rows={3} 
            value={mapIframe} 
            onChange={setMapIframe} 
          />

          {/* Section 2: Logo and Favicon uploading */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
            {/* Logo box */}
            <div className="space-y-3">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1">
                Logo <span className="text-red-500">*</span>
                <span className="text-[10px] text-gray-400 normal-case font-normal">(Recommended Size : larger than 120 x 120 & smaller than 150 x 150 pixels.)</span>
              </label>
              
              <div className="flex flex-col gap-4">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex items-center gap-2 bg-[#6d28d9] hover:bg-[#5b21b6] text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition uppercase w-fit cursor-pointer border-none"
                >
                  <Upload size={14} /> Upload
                </button>
                <p className="text-[11px] text-gray-400 font-semibold italic">*Only Choose When Update is necessary</p>
                
                <input 
                  type="file" 
                  ref={logoInputRef} 
                  onChange={(e) => handleImageUpload(e, 'logo')} 
                  className="hidden" 
                  accept="image/*" 
                />

                {/* Logo preview display */}
                {logo ? (
                  <div className="w-32 h-32 bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-center relative overflow-hidden select-none">
                    <img 
                      src={logo.startsWith('/') ? `${api.defaults.baseURL?.replace('/api', '') || ''}${logo}` : logo} 
                      alt="Logo" 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                    <HelpCircle size={28} />
                    <span className="text-[10px] uppercase font-bold mt-1">No Logo</span>
                  </div>
                )}
              </div>
            </div>

            {/* Favicon Box */}
            <div className="space-y-3">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-tight">
                Favicon <span className="text-red-500">*</span>
              </label>
              
              <div className="flex flex-col gap-4">
                <button
                  type="button"
                  onClick={() => faviconInputRef.current?.click()}
                  className="inline-flex items-center gap-2 bg-[#6d28d9] hover:bg-[#5b21b6] text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition uppercase w-fit cursor-pointer border-none"
                >
                  <Upload size={14} /> Upload
                </button>
                <p className="text-[11px] text-gray-400 font-semibold italic">*Only Choose When Update is necessary</p>
                
                <input 
                  type="file" 
                  ref={faviconInputRef} 
                  onChange={(e) => handleImageUpload(e, 'favicon')} 
                  className="hidden" 
                  accept="image/*" 
                />

                {/* Favicon preview display */}
                {favicon ? (
                  <div className="w-24 h-24 bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-center relative overflow-hidden select-none">
                    <img 
                      src={favicon.startsWith('/') ? `${api.defaults.baseURL?.replace('/api', '') || ''}${favicon}` : favicon} 
                      alt="Favicon" 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                    <HelpCircle size={24} />
                    <span className="text-[10px] uppercase font-bold mt-1">No Favicon</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Metadata keywords */}
          <div className="pt-6 border-t border-gray-100 space-y-4">
            <TextareaField 
              label="Meta Keywords" 
              required 
              rows={2} 
              value={metaKeywords} 
              onChange={setMetaKeywords} 
            />
            <TextareaField 
              label="Meta Description" 
              required 
              rows={4} 
              value={metaDescription} 
              onChange={setMetaDescription} 
            />
          </div>
        </div>

        {/* Section 4: Developer Mode */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-2">
          <h3 className="text-[16px] font-bold text-slate-700 uppercase tracking-tight">Developer Mode</h3>
          <p className="text-[11px] text-gray-400 font-medium">Enable / Disable (Keep it OFF in Production, only turn it on when you require eShop Support.)</p>
          <div className="pt-3">
            <ToggleSwitch enabled={devMode} onChange={() => setDevMode(!devMode)} />
          </div>
        </div>

        {/* Section 5: App Download Settings */}
        <SectionCard 
          title="App download Section" 
          subtitle="Enable / Disable" 
          toggleState={appDownloadEnabled}
          onToggle={() => setAppDownloadEnabled(!appDownloadEnabled)}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Title" required value={appTitle} onChange={setAppTitle} />
            <InputField label="Tagline" required value={appTagline} onChange={setAppTagline} />
          </div>
          <TextareaField label="Short Description" required rows={3} value={appDesc} onChange={setAppDesc} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Promo Header Description" required value={appPromoHeader} onChange={setAppPromoHeader} />
            <InputField label="Playstore URL" required value={playstoreUrl} onChange={setPlaystoreUrl} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Applestore URL" required value={applestoreUrl} onChange={setApplestoreUrl} />
          </div>
        </SectionCard>

        {/* Section 6: Social Media links */}
        <SectionCard title="Social Media Links">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Facebook" value={socialFacebook} onChange={setSocialFacebook} placeholder="https://facebook.com/yourpage" />
            <InputField label="Instagram" value={socialInstagram} onChange={setSocialInstagram} placeholder="https://instagram.com/yourpage" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="WhatsApp Number" value={socialWhatsapp} onChange={setSocialWhatsapp} placeholder="e.g. 8454064310" />
            <InputField label="YouTube" value={socialYoutube} onChange={setSocialYoutube} placeholder="https://youtube.com/@yourchannel" />
          </div>
        </SectionCard>

        {/* Section 6b: Footer Settings */}
        <SectionCard title="Footer Settings" subtitle="Manage footer description and navigation links shown on the website">
          <TextareaField
            label="Footer Description"
            rows={3}
            value={footerDescription}
            onChange={(val) => {
              setShortDesc(val);
              setFooterDescription(val);
            }}
            placeholder="Short description shown in the footer about your business..."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <LinkListEditor
              title="Shop & Explore Links"
              links={footerQuickLinks}
              onChange={setFooterQuickLinks}
            />
            <LinkListEditor
              title="Customer Care Links"
              links={footerSupportLinks}
              onChange={setFooterSupportLinks}
            />
          </div>
        </SectionCard>

        {/* Section 7: Feature Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-100 pb-2">
            <h3 className="text-[16px] font-bold text-slate-700 uppercase tracking-tight">Feature Section</h3>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Feature 1: Shipping */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start border-b border-gray-100/50 pb-6">
              <div className="space-y-2">
                <span className="text-sm font-bold text-slate-700 block">Shipping</span>
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold block">Enable / Disable</span>
                  <ToggleSwitch enabled={shippingEnabled} onChange={() => setShippingEnabled(!shippingEnabled)} />
                </div>
              </div>
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <InputField label="Title" value={shippingTitle} onChange={setShippingTitle} />
                </div>
                <div className="md:col-span-2">
                  <TextareaField label="Description" rows={2} value={shippingDesc} onChange={setShippingDesc} />
                </div>
              </div>
            </div>

            {/* Feature 2: Returns */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start border-b border-gray-100/50 pb-6">
              <div className="space-y-2">
                <span className="text-sm font-bold text-slate-700 block">Returns</span>
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold block">Enable / Disable</span>
                  <ToggleSwitch enabled={returnsEnabled} onChange={() => setReturnsEnabled(!returnsEnabled)} />
                </div>
              </div>
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <InputField label="Title" value={returnsTitle} onChange={setReturnsTitle} />
                </div>
                <div className="md:col-span-2">
                  <TextareaField label="Description" rows={2} value={returnsDesc} onChange={setReturnsDesc} />
                </div>
              </div>
            </div>

            {/* Feature 3: Support */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start border-b border-gray-100/50 pb-6">
              <div className="space-y-2">
                <span className="text-sm font-bold text-slate-700 block">Support</span>
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold block">Enable / Disable</span>
                  <ToggleSwitch enabled={supportEnabled} onChange={() => setSupportEnabled(!supportEnabled)} />
                </div>
              </div>
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <InputField label="Title" value={supportTitle} onChange={setSupportTitle} />
                </div>
                <div className="md:col-span-2">
                  <TextareaField label="Description" rows={2} value={supportDesc} onChange={setSupportDesc} />
                </div>
              </div>
            </div>

            {/* Feature 4: Safety & Security */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start pb-2">
              <div className="space-y-2">
                <span className="text-sm font-bold text-slate-700 block">Safety & Security</span>
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold block">Enable / Disable</span>
                  <ToggleSwitch enabled={safetyEnabled} onChange={() => setSafetyEnabled(!safetyEnabled)} />
                </div>
              </div>
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <InputField label="Title" value={safetyTitle} onChange={setSafetyTitle} />
                </div>
                <div className="md:col-span-2">
                  <TextareaField label="Description" rows={2} value={safetyDesc} onChange={setSafetyDesc} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 8: Themes and color specs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="space-y-4">
            <h3 className="text-[16px] font-bold text-slate-700 uppercase tracking-tight">Theme Classic Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <ColorPickerInput label="Primary Colour" value={primaryColor} onChange={setPrimaryColor} />
              <ColorPickerInput label="Secondary Colour" value={secondaryColor} onChange={setSecondaryColor} />
              <ColorPickerInput label="Font Colour" value={fontColor} onChange={setFontColor} />
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-gray-100">
            <h3 className="text-[16px] font-bold text-slate-700 uppercase tracking-tight">Theme Settings</h3>
            <div className="max-w-md">
              <InputField label="Theme color" value={themeColor} onChange={setThemeColor} />
            </div>
          </div>
        </div>

        {/* Save actions */}
        <div className="flex gap-4 pt-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="px-8 py-3.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold text-sm rounded-xl shadow-md shadow-amber-100 transition border-none cursor-pointer uppercase flex items-center gap-2 select-none"
          >
            <RotateCcw size={15} /> Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-10 py-3.5 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold text-sm rounded-xl shadow-lg shadow-green-100 transition border-none cursor-pointer uppercase flex items-center gap-2 select-none"
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save size={15} /> Update Settings
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

// Reusable Inner Input component
const InputField = ({ label, required, value, onChange, placeholder }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-tight">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input 
      type="text"
      value={value || ''} 
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} 
      className="px-3 h-10 border border-gray-200 rounded-lg focus:border-purple-500 outline-none text-sm text-gray-700 shadow-sm bg-white font-medium" 
    />
  </div>
);

// Reusable Inner Textarea component
const TextareaField = ({ label, required, rows = 3, value, onChange, placeholder }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-tight">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <textarea 
      rows={rows}
      value={value || ''} 
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} 
      className="p-3 border border-gray-200 rounded-lg focus:border-purple-500 outline-none text-sm text-gray-700 shadow-sm bg-white font-medium resize-y" 
    />
  </div>
);

// Footer link list editor
const LinkListEditor = ({ title, links, onChange }) => {
  const updateLink = (index, field, value) => {
    const updated = links.map((l, i) => i === index ? { ...l, [field]: value } : l);
    onChange(updated);
  };
  const addLink = () => onChange([...links, { text: '', url: '' }]);
  const removeLink = (index) => onChange(links.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-[12px] font-bold text-slate-500 uppercase tracking-tight">{title}</span>
        <button
          type="button"
          onClick={addLink}
          className="text-[11px] bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg font-bold transition cursor-pointer border-none"
        >
          + Add Link
        </button>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {links.map((link, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              type="text"
              value={link.text || ''}
              onChange={(e) => updateLink(i, 'text', e.target.value)}
              placeholder="Link Text"
              className="flex-1 px-2 h-8 border border-gray-200 rounded-lg text-xs text-gray-700 outline-none focus:border-purple-500 bg-white font-medium"
            />
            <input
              type="text"
              value={link.url || ''}
              onChange={(e) => updateLink(i, 'url', e.target.value)}
              placeholder="/path or URL"
              className="flex-1 px-2 h-8 border border-gray-200 rounded-lg text-xs text-gray-700 outline-none focus:border-purple-500 bg-white font-medium"
            />
            <button
              type="button"
              onClick={() => removeLink(i)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-500 font-bold text-base transition cursor-pointer border-none shrink-0"
            >
              ×
            </button>
          </div>
        ))}
        {links.length === 0 && (
          <p className="text-[11px] text-gray-400 italic">No links added yet. Click "+ Add Link" to start.</p>
        )}
      </div>
    </div>
  );
};
