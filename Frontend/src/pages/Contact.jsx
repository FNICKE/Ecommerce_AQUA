// src/pages/ContactUs.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, MapPin, Send, Loader2, CheckCircle, AlertCircle, Clock, Globe } from 'lucide-react';
import api from '../lib/api';
import SEO from '../components/SEO';

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const [config, setConfig] = useState(null);

  const [status, setStatus] = useState({
    loading: false,
    success: false,
    error: null,
  });

  useEffect(() => {
    const loadContactConfig = async () => {
      try {
        const res = await api.get('/config/public');
        setConfig(res.data || {});
      } catch {
        // Keep page working with existing defaults below
        setConfig(null);
      }
    };
    loadContactConfig();
  }, []);

  const contactInfo = config?.contact_info || {
    phone: '',
    email: '',
    address: '',
  };

  const contactPage = config?.contact_page || {
    intro_text: '',
    areas_we_deliver: '',
    delivery_timings: '',
    business_hours_mon_sat: '',
    business_hours_sunday: '',
    response_time: '',
    headquarters_title: '',
    headquarters_description: '',
    headquarters_address: '',
    website: '',
  };

  const renderRichText = (value) => {
    const str = String(value ?? '');
    if (!str.trim()) return null;

    // If admin stored HTML, render it. Otherwise show as text with preserved line breaks.
    const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(str);
    if (looksLikeHtml) {
      return <div dangerouslySetInnerHTML={{ __html: str }} />;
    }

    return <div className="whitespace-pre-line">{str}</div>;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setStatus({ loading: false, success: false, error: 'Please fill in all required fields.' });
      return;
    }

    setStatus({ loading: true, success: false, error: null });

    try {
      // Simulation of API Call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setStatus({ loading: false, success: true, error: null });
      setFormData({ name: '', email: '', phone: '', message: '' });

      setTimeout(() => setStatus(s => ({ ...s, success: false })), 6000);
    } catch {
      setStatus({ loading: false, success: false, error: 'Something went wrong. Please try again.' });
    }
  };

  return (
    <div className="bg-[#f8f9fc] min-h-screen pb-16">
      <SEO 
        title="Contact Us"
        description={`Get in touch with ${window.siteName || 'our store'} for any inquiries or support.`}
        keywords={['contact us', window.siteName || 'store', 'support']}
      />
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <nav className="flex items-center text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-gray-900 transition">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Contact Us</span>
        </nav>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10 flex flex-col gap-12">
          
          {/* Header Intro block */}
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full mb-4">
              Reach Out to Us
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 leading-tight">
              Let's Start a <span className="text-purple-700">Conversation</span>
            </h1>
            <p className="text-gray-500 text-xs md:text-sm leading-relaxed max-w-2xl mt-2">
              Have questions about our custom aquariums, premium livestock, or wholesale orders? Reach out using the contact details or send us a message below.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 border-t border-gray-100 pt-10 items-start">
            
            {/* LEFT COLUMN: CONTACT INFO & HOURS */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Contact Details Card */}
              <div className="p-6 rounded-2xl bg-[#f8f9fc] border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <span className="w-1 h-5 bg-purple-600 rounded-full"></span>
                  Contact Details
                </h3>
                
                <div className="space-y-5 text-xs md:text-sm">
                  {contactPage?.intro_text && (
                    <div className="text-gray-600 leading-relaxed">
                      {renderRichText(contactPage.intro_text)}
                    </div>
                  )}

                  {(contactInfo.phone || '8454064310') && (
                    <a
                      href={`tel:${(contactInfo.phone || '8454064310').replace(/[^0-9+]/g, '')}`}
                      className="flex items-center gap-3.5 group hover:no-underline cursor-pointer"
                    >
                      <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-600 transition-colors duration-300 shrink-0">
                        <Phone size={18} className="text-purple-700 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider leading-none mb-0.5">Phone</p>
                        <p className="text-gray-900 font-semibold group-hover:text-purple-700 transition-colors">{contactInfo.phone || '8454064310'}</p>
                      </div>
                    </a>
                  )}

                  {contactInfo.email && (
                    <a
                      href={`mailto:${contactInfo.email}`}
                      className="flex items-center gap-3.5 group hover:no-underline cursor-pointer"
                    >
                      <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-600 transition-colors duration-300 shrink-0">
                        <Mail size={18} className="text-purple-700 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider leading-none mb-0.5">Email</p>
                        <p className="text-gray-900 font-semibold group-hover:text-purple-700 transition-colors">{contactInfo.email}</p>
                      </div>
                    </a>
                  )}

                  {contactInfo.address && (
                    <div className="flex items-start gap-3.5 group">
                      <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-600 transition-colors duration-300 shrink-0">
                        <MapPin size={18} className="text-purple-700 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider leading-none mb-0.5">Location</p>
                        <p className="text-gray-900 font-semibold leading-tight">{contactInfo.address}</p>
                      </div>
                    </div>
                  )}

                  {contactPage?.areas_we_deliver && (
                    <div className="pt-2 border-t border-gray-200/50">
                      <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1">Areas we deliver</p>
                      <div className="text-gray-900 font-medium">{renderRichText(contactPage.areas_we_deliver)}</div>
                    </div>
                  )}

                  {contactPage?.delivery_timings && (
                    <div className="pt-2">
                      <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1">Delivery Timings</p>
                      <div className="text-gray-900 font-medium">{renderRichText(contactPage.delivery_timings)}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Business Hours Card */}
              {(contactPage?.business_hours_mon_sat || contactPage?.business_hours_sunday) && (
                <div className="p-6 rounded-2xl bg-purple-950 text-white shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-purple-800 rounded-full blur-2xl opacity-50 group-hover:opacity-80 transition-opacity"></div>
                  <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                    <Clock size={18} className="text-purple-300" />
                    Business Hours
                  </h3>
                  <ul className="space-y-3 text-xs md:text-sm">
                    {contactPage?.business_hours_mon_sat && (
                      <li className="flex justify-between text-purple-200">
                        <span>{contactPage.business_hours_mon_sat.split('|')?.[0] || 'Mon - Sat'}</span>
                        <span className="text-white font-medium">{contactPage.business_hours_mon_sat.split('|')?.[1] || ''}</span>
                      </li>
                    )}
                    {contactPage?.business_hours_sunday && (
                      <li className="flex justify-between text-purple-200">
                        <span>{contactPage.business_hours_sunday.split('|')?.[0] || 'Sunday'}</span>
                        <span className="text-white font-medium italic text-xs">{contactPage.business_hours_sunday.split('|')?.[1] || ''}</span>
                      </li>
                    )}
                  </ul>
                  {contactPage?.response_time && (
                    <div className="mt-4 pt-4 border-t border-purple-800 flex items-center gap-2">
                      <span className="text-[10px] text-purple-300 font-semibold">{contactPage.response_time}</span>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: CONTACT FORM */}
            <div className="lg:col-span-2">
              <div className="p-6 md:p-8 rounded-2xl bg-[#f8f9fc] border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Send Message</h2>
                <p className="text-gray-500 text-xs md:text-sm mb-6">Fill out the form below and our team will get back to you shortly.</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 ml-0.5">Full Name *</label>
                      <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your name"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600/10 focus:border-purple-600 outline-none transition-all text-xs md:text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 ml-0.5">Phone Number</label>
                      <input
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 00000 00000"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600/10 focus:border-purple-600 outline-none transition-all text-xs md:text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 ml-0.5">Email Address *</label>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="example@email.com"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600/10 focus:border-purple-600 outline-none transition-all text-xs md:text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 ml-0.5">Your Message *</label>
                    <textarea
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="How can we help you today?"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600/10 focus:border-purple-600 outline-none transition-all resize-none text-xs md:text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status.loading}
                    className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] shadow-sm disabled:opacity-70 disabled:cursor-not-allowed text-xs md:text-sm cursor-pointer"
                  >
                    {status.loading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>

                  <AnimatePresence>
                    {status.success && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex items-center gap-3 text-green-700 text-xs md:text-sm font-medium">
                          <CheckCircle size={18} /> 
                          Your message has been received! We'll contact you soon.
                        </div>
                      </motion.div>
                    )}

                    {status.error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-700 text-xs md:text-sm font-medium">
                          <AlertCircle size={18} /> {status.error}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>
            </div>

          </div>

          {/* BOTTOM: FACILITY / MAP SECTION */}
          {(contactPage?.headquarters_title || contactPage?.headquarters_address || config?.map_iframe) && (
            <div className="border-t border-gray-100 pt-10">
              <div className="text-center mb-8">
                <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">Visit Our Facility</h2>
                <div className="w-16 h-1 bg-purple-600 mx-auto mt-3 rounded-full"></div>
              </div>
              
              <div className="grid md:grid-cols-2 bg-[#f8f9fc] rounded-2xl border border-gray-100 overflow-hidden items-stretch">
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  {contactPage?.headquarters_title && (
                    <h4 className="text-lg md:text-xl font-bold text-gray-900 mb-3">{contactPage.headquarters_title}</h4>
                  )}
                  {contactPage?.headquarters_description && (
                    <p className="text-gray-500 leading-relaxed text-xs md:text-sm mb-6">{contactPage.headquarters_description}</p>
                  )}
                  <div className="space-y-3.5 text-xs md:text-sm">
                    {contactPage?.headquarters_address && (
                      <div className="flex gap-3">
                        <div className="text-purple-600 bg-purple-50 p-2 rounded-lg h-fit">
                          <MapPin size={18} />
                        </div>
                        <p className="text-gray-700 font-semibold leading-snug">
                          {contactPage.headquarters_address}
                        </p>
                      </div>
                    )}
                    {contactPage?.website && (
                      <div className="flex gap-3">
                        <div className="text-purple-600 bg-purple-50 p-2 rounded-lg h-fit">
                          <Globe size={18} />
                        </div>
                        <p className="text-gray-700 font-semibold leading-none self-center">{contactPage.website}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="h-64 md:h-auto bg-gray-50 relative overflow-hidden flex items-center justify-center min-h-[300px]">
                  {config?.map_iframe ? (
                    <div 
                      dangerouslySetInnerHTML={{ __html: config.map_iframe }} 
                      className="w-full h-full [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-purple-50 w-full h-full">
                      <div className="text-center p-8">
                         <MapPin size={36} className="text-purple-300 mx-auto mb-3" />
                         <p className="text-purple-400 font-bold uppercase tracking-widest text-[10px] md:text-xs">Location Map</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}