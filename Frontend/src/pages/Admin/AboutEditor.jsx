import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../../store/toastStore';
import api from '../../lib/api';
import { Phone, Mail, MapPin, RotateCcw, Save, Info, BookOpen, Heart, Award, ShieldCheck, Upload, Image } from 'lucide-react';
import MediaLibraryModal from '../../components/MediaLibraryModal';
import { getImageUrl } from '../../lib/imageUrl';

const TinyMCEEditor = ({ id, initialValue, scriptLoaded, onChange }) => {
  useEffect(() => {
    if (scriptLoaded && window.tinymce) {
      window.tinymce.remove(`#${id}`);
      window.tinymce.init({
        selector: `#${id}`,
        min_height: 140,
        max_height: 1200,
        autoresize_bottom_margin: 16,
        autoresize_overflow_padding: 8,
        menubar: false,
        plugins: 'autoresize advlist autolink lists link charmap preview anchor searchreplace visualblocks code fullscreen table code help wordcount',
        toolbar: 'undo redo | bold italic forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist | code removeformat',
        setup: (editor) => {
          editor.on('init', () => {
            editor.setContent(initialValue || '');
          });
          editor.on('change keyup undo redo input NodeChange', () => {
            const content = editor.getContent();
            onChange(content);
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
      className="w-full border border-gray-200 rounded-lg p-2 min-h-[150px]"
    />
  );
};

export default function AboutEditor() {
  const navigate = useNavigate();
  const { showToast } = useToastStore();

  const [activeTab, setActiveTab] = useState('heritage');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  
  // Media library states
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [activeImageField, setActiveImageField] = useState(null);

  const [initial, setInitial] = useState(null);
  const [form, setForm] = useState({
    heritage_title: '',
    heritage_p1: '',
    heritage_p2: '',
    heritage_label1_val: '',
    heritage_label1_txt: '',
    heritage_label2_val: '',
    heritage_label2_txt: '',

    promise_title: '',
    promise1_title: '',
    promise1_desc: '',
    promise2_title: '',
    promise2_desc: '',
    promise3_title: '',
    promise3_desc: '',

    why_title1: '',
    why_desc1: '',
    why_title2: '',
    why_desc2: '',
    why_title3: '',
    why_desc3: '',
    why_title4: '',
    why_desc4: '',
    heritage_image1: '',
    heritage_image2: '',
  });

  const image1InputRef = useRef(null);
  const image2InputRef = useRef(null);
  const [uploadingImage1, setUploadingImage1] = useState(false);
  const [uploadingImage2, setUploadingImage2] = useState(false);

  const handleImageUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append(field, file);

    const isImage1 = field === 'heritage_image1';
    const setUploading = isImage1 ? setUploadingImage1 : setUploadingImage2;

    try {
      setUploading(true);
      showToast(`Uploading image...`, 'info');
      const res = await api.post(`/config/about/${field}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setForm(prev => ({ ...prev, [field]: res.data.image_url }));
      showToast('Image uploaded successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to upload image', 'error');
    } finally {
      setUploading(false);
    }
  };

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

  const handleChooseFromMedia = (field) => {
    setActiveImageField(field);
    setShowMediaModal(true);
  };

  const handleMediaSelect = (item) => {
    if (activeImageField) {
      const imagePath = item.path || item.imagePath || item.url || '';
      setForm(prev => ({ ...prev, [activeImageField]: imagePath }));
    }
    setShowMediaModal(false);
    setActiveImageField(null);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/config/public');
        const cfg = res.data || {};
        const page = cfg.about_page || {};

        const next = {
          heritage_title: page.heritage_title || 'A Legacy Carved in Tradition & Purity',
          heritage_p1: page.heritage_p1 || '',
          heritage_p2: page.heritage_p2 || '',
          heritage_label1_val: page.heritage_label1_val || '100%',
          heritage_label1_txt: page.heritage_label1_txt || 'Natural',
          heritage_label2_val: page.heritage_label2_val || '4+',
          heritage_label2_txt: page.heritage_label2_txt || 'Generations',

          promise_title: page.promise_title || 'The  Promise',
          promise1_title: page.promise1_title || 'Zero Adulteration',
          promise1_desc: page.promise1_desc || '',
          promise2_title: page.promise2_title || 'Sun-Dried Excellence',
          promise2_desc: page.promise2_desc || '',
          promise3_title: page.promise3_title || 'Quality Certified',
          promise3_desc: page.promise3_desc || '',

          why_title1: page.why_title1 || 'Global Shipping',
          why_desc1: page.why_desc1 || '',
          why_title2: page.why_title2 || 'Airtight Seal',
          why_desc2: page.why_desc2 || '',
          why_title3: page.why_title3 || '10k+ Families',
          why_desc3: page.why_desc3 || '',
          why_title4: page.why_title4 || 'Make In India',
          why_desc4: page.why_desc4 || '',
          heritage_image1: page.heritage_image1 || '',
          heritage_image2: page.heritage_image2 || '',
        };

        setInitial(next);
        setForm(next);
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to load about us configuration', 'error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [showToast]);

  const canSave = useMemo(() => {
    return Boolean(
      form.heritage_title.trim() && 
      form.heritage_p1.trim() && 
      form.promise_title.trim()
    );
  }, [form.heritage_title, form.heritage_p1, form.promise_title]);

  const handleReset = () => {
    if (!initial) return;
    setForm(initial);
    showToast('Reset to saved values', 'info');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/config/about', form);
      showToast('About page config updated successfully', 'success');
      // Reload page to re-fetch values fresh
      navigate(0);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save about us configurations', 'error');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'heritage', label: 'Our Heritage', icon: BookOpen },
    { id: 'promise', label: 'The Promise', icon: Heart },
    { id: 'highlights', label: 'Highlights & Shipping', icon: Award },
  ];

  if (loading) {
    return (
      <div className="h-screen bg-[#F8F9FB] p-4 flex items-center justify-center">
        <Info size={22} className="text-purple-600 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F8F9FB] p-6 font-sans overflow-hidden flex flex-col">
      {/* Top Breadcrumb Bar */}
      <div className="mb-5 flex items-center gap-2 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white rounded shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
          title="Back"
        >
          <RotateCcw size={18} className="text-purple-600" />
        </button>
        <h1 className="text-base font-bold text-[#334257]">About us editor</h1>
      </div>

      {/* Main Two-Column Panel */}
      <div className="flex flex-1 gap-5 min-h-0 overflow-hidden">
        {/* Left Column Sidebar */}
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

        {/* Right Column Form Card */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden shadow-sm">
          <div className="p-6 flex-1 overflow-auto space-y-6">
            
            {/* TAB 1: Our Heritage */}
            {activeTab === 'heritage' && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Heritage Section Title</label>
                  <input
                    value={form.heritage_title}
                    onChange={(e) => setForm((p) => ({ ...p, heritage_title: e.target.value }))}
                    className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-4 py-2.5 rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400 focus:bg-white transition"
                    placeholder="A Legacy Carved in Tradition & Purity"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Heritage Paragraph 1</label>
                  <TinyMCEEditor
                    id="editor-heritage_p1"
                    initialValue={form.heritage_p1}
                    scriptLoaded={scriptLoaded}
                    onChange={(val) => setForm((p) => ({ ...p, heritage_p1: val }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Heritage Paragraph 2</label>
                  <TinyMCEEditor
                    id="editor-heritage_p2"
                    initialValue={form.heritage_p2}
                    scriptLoaded={scriptLoaded}
                    onChange={(val) => setForm((p) => ({ ...p, heritage_p2: val }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  <div className="border border-solid border-gray-150 p-4 rounded-xl space-y-3 bg-gray-50/50">
                    <span className="text-[10px] font-extrabold text-purple-600 uppercase tracking-widest block">Statistic Label 1</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Value</label>
                        <input
                          value={form.heritage_label1_val}
                          onChange={(e) => setForm((p) => ({ ...p, heritage_label1_val: e.target.value }))}
                          className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-3 py-2 rounded-lg text-[10px] font-bold text-slate-700 outline-none focus:border-purple-400 focus:bg-white transition"
                          placeholder="100%"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Text</label>
                        <input
                          value={form.heritage_label1_txt}
                          onChange={(e) => setForm((p) => ({ ...p, heritage_label1_txt: e.target.value }))}
                          className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-3 py-2 rounded-lg text-[10px] font-bold text-slate-700 outline-none focus:border-purple-400 focus:bg-white transition"
                          placeholder="Natural"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border border-solid border-gray-150 p-4 rounded-xl space-y-3 bg-gray-50/50">
                    <span className="text-[10px] font-extrabold text-purple-600 uppercase tracking-widest block">Statistic Label 2</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Value</label>
                        <input
                          value={form.heritage_label2_val}
                          onChange={(e) => setForm((p) => ({ ...p, heritage_label2_val: e.target.value }))}
                          className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-3 py-2 rounded-lg text-[10px] font-bold text-slate-700 outline-none focus:border-purple-400 focus:bg-white transition"
                          placeholder="4+"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Text</label>
                        <input
                          value={form.heritage_label2_txt}
                          onChange={(e) => setForm((p) => ({ ...p, heritage_label2_txt: e.target.value }))}
                          className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-3 py-2 rounded-lg text-[10px] font-bold text-slate-700 outline-none focus:border-purple-400 focus:bg-white transition"
                          placeholder="Generations"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Heritage Images Upload Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-gray-150 mt-4 select-none">
                  {/* Image 1 Box */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      Heritage Image 1
                    </label>
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-2 select-none">
                        <button
                          type="button"
                          onClick={() => image1InputRef.current?.click()}
                          disabled={uploadingImage1}
                          className="inline-flex items-center gap-2 bg-[#6d28d9] hover:bg-[#5b21b6] text-white text-[10px] font-bold px-4 py-2 rounded-lg shadow-sm transition uppercase cursor-pointer border-none disabled:opacity-60"
                        >
                          <Upload size={13} /> {uploadingImage1 ? 'Uploading...' : 'Upload Image 1'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChooseFromMedia('heritage_image1')}
                          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-4 py-2 rounded-lg shadow-sm transition uppercase cursor-pointer border-none"
                        >
                          <Image size={13} /> Media Library
                        </button>
                      </div>
                      <input 
                        type="file" 
                        ref={image1InputRef} 
                        onChange={(e) => handleImageUpload(e, 'heritage_image1')} 
                        className="hidden" 
                        accept="image/*" 
                      />

                      {form.heritage_image1 ? (
                        <div className="w-full h-40 bg-gray-50 rounded-xl border border-gray-150 p-2 flex items-center justify-center relative overflow-hidden select-none">
                           <img 
                            src={getImageUrl(form.heritage_image1)} 
                            alt="Heritage Image 1" 
                            className="max-w-full max-h-full object-contain rounded-lg"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-40 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                          <Image size={28} />
                          <span className="text-[10px] uppercase font-bold mt-1">No Image 1</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Image 2 Box */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      Heritage Image 2
                    </label>
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-2 select-none">
                        <button
                          type="button"
                          onClick={() => image2InputRef.current?.click()}
                          disabled={uploadingImage2}
                          className="inline-flex items-center gap-2 bg-[#6d28d9] hover:bg-[#5b21b6] text-white text-[10px] font-bold px-4 py-2 rounded-lg shadow-sm transition uppercase cursor-pointer border-none disabled:opacity-60"
                        >
                          <Upload size={13} /> {uploadingImage2 ? 'Uploading...' : 'Upload Image 2'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChooseFromMedia('heritage_image2')}
                          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-4 py-2 rounded-lg shadow-sm transition uppercase cursor-pointer border-none"
                        >
                          <Image size={13} /> Media Library
                        </button>
                      </div>
                      <input 
                        type="file" 
                        ref={image2InputRef} 
                        onChange={(e) => handleImageUpload(e, 'heritage_image2')} 
                        className="hidden" 
                        accept="image/*" 
                      />

                      {form.heritage_image2 ? (
                        <div className="w-full h-40 bg-gray-50 rounded-xl border border-gray-150 p-2 flex items-center justify-center relative overflow-hidden select-none">
                           <img 
                            src={getImageUrl(form.heritage_image2)} 
                            alt="Heritage Image 2" 
                            className="max-w-full max-h-full object-contain rounded-lg"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-40 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                          <Image size={28} />
                          <span className="text-[10px] uppercase font-bold mt-1">No Image 2</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: The Promise */}
            {activeTab === 'promise' && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Promise Main Section Title</label>
                  <input
                    value={form.promise_title}
                    onChange={(e) => setForm((p) => ({ ...p, promise_title: e.target.value }))}
                    className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-4 py-2.5 rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400 focus:bg-white transition"
                    placeholder="The Promise"
                  />
                </div>

                <div className="border border-solid border-gray-150 p-5 rounded-2xl space-y-4 bg-gray-50/40">
                  <span className="text-[10px] font-extrabold text-green-600 uppercase tracking-widest block">Promise Card 1</span>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Title</label>
                      <input
                        value={form.promise1_title}
                        onChange={(e) => setForm((p) => ({ ...p, promise1_title: e.target.value }))}
                        className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-4 py-2.5 rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400 focus:bg-white transition"
                        placeholder="Zero Adulteration"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Description</label>
                      <TinyMCEEditor
                        id="editor-promise1_desc"
                        initialValue={form.promise1_desc}
                        scriptLoaded={scriptLoaded}
                        onChange={(val) => setForm((p) => ({ ...p, promise1_desc: val }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-solid border-gray-150 p-5 rounded-2xl space-y-4 bg-gray-50/40">
                  <span className="text-[10px] font-extrabold text-purple-600 uppercase tracking-widest block">Promise Card 2</span>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Title</label>
                      <input
                        value={form.promise2_title}
                        onChange={(e) => setForm((p) => ({ ...p, promise2_title: e.target.value }))}
                        className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-4 py-2.5 rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400 focus:bg-white transition"
                        placeholder="Sun-Dried Excellence"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Description</label>
                      <TinyMCEEditor
                        id="editor-promise2_desc"
                        initialValue={form.promise2_desc}
                        scriptLoaded={scriptLoaded}
                        onChange={(val) => setForm((p) => ({ ...p, promise2_desc: val }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-solid border-gray-150 p-5 rounded-2xl space-y-4 bg-gray-50/40">
                  <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest block">Promise Card 3</span>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Title</label>
                      <input
                        value={form.promise3_title}
                        onChange={(e) => setForm((p) => ({ ...p, promise3_title: e.target.value }))}
                        className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-4 py-2.5 rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400 focus:bg-white transition"
                        placeholder="Quality Certified"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Description</label>
                      <TinyMCEEditor
                        id="editor-promise3_desc"
                        initialValue={form.promise3_desc}
                        scriptLoaded={scriptLoaded}
                        onChange={(val) => setForm((p) => ({ ...p, promise3_desc: val }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Logistics & Highlights */}
            {activeTab === 'highlights' && (
              <div className="space-y-5">
                <span className="text-[11px] font-extrabold text-purple-700 uppercase tracking-widest block border-b pb-2">Why Us Logistics Badges (Purple Section)</span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-solid border-gray-150 p-4 rounded-xl space-y-3 bg-gray-50/30">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Badge 1</span>
                    <input
                      value={form.why_title1}
                      onChange={(e) => setForm((p) => ({ ...p, why_title1: e.target.value }))}
                      className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-3 py-2 rounded-lg text-[10px] font-bold text-slate-700 outline-none focus:border-purple-400 focus:bg-white transition"
                      placeholder="Global Shipping"
                    />
                    <TinyMCEEditor
                      id="editor-why_desc1"
                      initialValue={form.why_desc1}
                      scriptLoaded={scriptLoaded}
                      onChange={(val) => setForm((p) => ({ ...p, why_desc1: val }))}
                    />
                  </div>

                  <div className="border border-solid border-gray-150 p-4 rounded-xl space-y-3 bg-gray-50/30">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Badge 2</span>
                    <input
                      value={form.why_title2}
                      onChange={(e) => setForm((p) => ({ ...p, why_title2: e.target.value }))}
                      className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-3 py-2 rounded-lg text-[10px] font-bold text-slate-700 outline-none focus:border-purple-400 focus:bg-white transition"
                      placeholder="Airtight Seal"
                    />
                    <TinyMCEEditor
                      id="editor-why_desc2"
                      initialValue={form.why_desc2}
                      scriptLoaded={scriptLoaded}
                      onChange={(val) => setForm((p) => ({ ...p, why_desc2: val }))}
                    />
                  </div>

                  <div className="border border-solid border-gray-150 p-4 rounded-xl space-y-3 bg-gray-50/30">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Badge 3</span>
                    <input
                      value={form.why_title3}
                      onChange={(e) => setForm((p) => ({ ...p, why_title3: e.target.value }))}
                      className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-3 py-2 rounded-lg text-[10px] font-bold text-slate-700 outline-none focus:border-purple-400 focus:bg-white transition"
                      placeholder="10k+ Families"
                    />
                    <TinyMCEEditor
                      id="editor-why_desc3"
                      initialValue={form.why_desc3}
                      scriptLoaded={scriptLoaded}
                      onChange={(val) => setForm((p) => ({ ...p, why_desc3: val }))}
                    />
                  </div>

                  <div className="border border-solid border-gray-150 p-4 rounded-xl space-y-3 bg-gray-50/30">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Badge 4</span>
                    <input
                      value={form.why_title4}
                      onChange={(e) => setForm((p) => ({ ...p, why_title4: e.target.value }))}
                      className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-3 py-2 rounded-lg text-[10px] font-bold text-slate-700 outline-none focus:border-purple-400 focus:bg-white transition"
                      placeholder="Make In India"
                    />
                    <TinyMCEEditor
                      id="editor-why_desc4"
                      initialValue={form.why_desc4}
                      scriptLoaded={scriptLoaded}
                      onChange={(val) => setForm((p) => ({ ...p, why_desc4: val }))}
                    />
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Form Actions Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="px-5 py-2 text-[11px] font-bold text-gray-400 flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed bg-transparent border-none cursor-pointer"
            >
              <RotateCcw size={14} /> Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave || saving}
              className="px-8 py-2.5 bg-[#004BB9] text-white rounded-lg text-[11px] font-bold shadow-lg shadow-blue-100 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed border-none cursor-pointer"
            >
              <Save size={14} /> {saving ? 'Saving...' : 'Update About Page'}
            </button>
          </div>
        </div>
      </div>

      <MediaLibraryModal
        open={showMediaModal}
        onClose={() => {
          setShowMediaModal(false);
          setActiveImageField(null);
        }}
        onSelect={handleMediaSelect}
      />
    </div>
  );
}
