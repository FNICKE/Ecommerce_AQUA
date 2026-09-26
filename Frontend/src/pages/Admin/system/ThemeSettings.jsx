import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../../../store/toastStore';
import api from '../../../lib/api';
import { 
  RotateCcw, 
  Save, 
  ChevronLeft, 
  Loader2, 
  Palette, 
  Layout, 
  Check 
} from 'lucide-react';

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

export default function ThemeSettings() {
  const navigate = useNavigate();
  const { showToast } = useToastStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [themes, setThemes] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [primaryColor, setPrimaryColor] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [fontColor, setFontColor] = useState('');
  const [initialData, setInitialData] = useState(null);

  // Predefined color presets for Classic mode
  const colorPresets = [
    { name: 'Default (Blue)', primary: '#2596be', secondary: '#015462', font: '#334257' },
    { name: 'Emerald Forest', primary: '#059669', secondary: '#064e3b', font: '#0f172a' },
    { name: 'Crimson Fire', primary: '#dc2626', secondary: '#7f1d1d', font: '#1e293b' },
    { name: 'Midnight Violet', primary: '#7c3aed', secondary: '#4c1d95', font: '#0f172a' },
    { name: 'Sunset Glow', primary: '#ea580c', secondary: '#7c2d12', font: '#1e293b' }
  ];

  useEffect(() => {
    loadThemeSettings();
  }, []);

  const loadThemeSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/config/themes');
      if (res.data.success) {
        setThemes(res.data.themes || []);
        const settings = res.data.settings || {};
        setSelectedTheme(settings.theme_color || 'default');
        setPrimaryColor(settings.theme_classic_primary_color || '');
        setSecondaryColor(settings.theme_classic_secondary_color || '');
        setFontColor(settings.theme_classic_font_color || '');
        setInitialData({
          theme_color: settings.theme_color || 'default',
          theme_classic_primary_color: settings.theme_classic_primary_color || '',
          theme_classic_secondary_color: settings.theme_classic_secondary_color || '',
          theme_classic_font_color: settings.theme_classic_font_color || ''
        });
      }
    } catch (err) {
      showToast('Failed to load theme settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (preset) => {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
    setFontColor(preset.font);
    showToast(`Applied preset: ${preset.name}`, 'info');
  };

  const handleReset = () => {
    if (initialData) {
      setSelectedTheme(initialData.theme_color);
      setPrimaryColor(initialData.theme_classic_primary_color);
      setSecondaryColor(initialData.theme_classic_secondary_color);
      setFontColor(initialData.theme_classic_font_color);
      showToast('Reset to saved theme settings', 'info');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        theme_color: selectedTheme,
        theme_classic_primary_color: primaryColor,
        theme_classic_secondary_color: secondaryColor,
        theme_classic_font_color: fontColor
      };

      await api.put('/config/themes', payload);
      setInitialData(payload);

      // Apply primary, secondary, text CSS variables in real time
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

      showToast('Theme settings updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to update theme settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#F8F9FB] p-4 flex flex-col items-center justify-center">
        <Loader2 size={36} className="text-purple-600 animate-spin mb-4" />
        <p className="text-gray-500 font-semibold text-sm">Loading theme preferences...</p>
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
          <h2 className="text-xl font-bold text-[#334257]">Theme Settings</h2>
        </div>
        <div className="text-xs md:text-sm text-gray-400 font-medium">
          Home / <span className="text-slate-600 font-semibold">Theme Settings</span>
        </div>
      </div>

      <div className="space-y-8 flex-1 max-w-5xl mx-auto w-full">
        {/* Active Layout Type Preset */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-[16px] font-bold text-slate-700 uppercase tracking-tight flex items-center gap-2">
              <Layout size={18} className="text-purple-600" /> Choose Storefront Theme Layout
            </h3>
            <p className="text-xs text-gray-400 font-medium mt-1">Select the layout style for the customer interface.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {themes.map((theme) => {
              const isActive = selectedTheme === theme.slug;
              return (
                <div 
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.slug)}
                  className={`relative cursor-pointer border rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300 ${
                    isActive 
                      ? 'border-purple-600 bg-purple-50/20 shadow-md ring-2 ring-purple-600/10' 
                      : 'border-gray-200 hover:border-gray-300 bg-white shadow-sm'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-4 right-4 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-sm">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  )}
                  <h4 className="text-sm font-bold text-[#334257] capitalize">{theme.name} Theme</h4>
                  <p className="text-xs text-gray-400 leading-relaxed font-medium">
                    {theme.slug === 'classic' 
                      ? 'Features traditional layout customization with custom color pickers and responsive listings.' 
                      : 'A state-of-the-art modern responsive style with enhanced grid layouts and interactive cards.'}
                  </p>
                  <div className="text-[11px] font-semibold text-slate-400 mt-2 uppercase tracking-wide">
                    {theme.slug === 'classic' ? 'Customizable Colors' : 'Highly Optimized'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Color customizer card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-[16px] font-bold text-slate-700 uppercase tracking-tight flex items-center gap-2">
              <Palette size={18} className="text-purple-600" /> Classic Color Specifications
            </h3>
            <p className="text-xs text-gray-400 font-medium mt-1">Configure your primary, secondary, and text colors below.</p>
          </div>

          {/* Quick presets */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Quick Color Presets</h4>
            <div className="flex flex-wrap gap-2.5">
              {colorPresets.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 transition flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <span className="w-3.5 h-3.5 rounded-full inline-block shadow-sm" style={{ backgroundColor: preset.primary }} />
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
            <ColorPickerInput label="Primary Color" value={primaryColor} onChange={setPrimaryColor} />
            <ColorPickerInput label="Secondary Color" value={secondaryColor} onChange={setSecondaryColor} />
            <ColorPickerInput label="Font / Text Color" value={fontColor} onChange={setFontColor} />
          </div>
        </div>

        {/* Save/Reset footer actions */}
        <div className="flex justify-end gap-3.5 pt-4">
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
