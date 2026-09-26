import { useEffect, useState } from 'react';
import api from '../lib/api';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function PrivacyPolicy() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const load = async () => {
      try {
        const res = await api.get('/config/public');
        setContent(res.data?.privacy_policy || '');
      } catch (err) {
        console.error('Failed to load privacy policy:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fc]">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
        <p className="text-gray-500 font-semibold">Loading Privacy Policy...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fc] min-h-screen py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Top Banner */}
        <div className="bg-[#5b21b6] text-white py-8 px-6 sm:px-8 rounded-2xl mb-8 flex items-center gap-4 shadow-md select-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-6 -mt-6" />
          <div className="p-3 bg-white/10 rounded-xl">
            <ShieldCheck size={28} className="text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="text-purple-200 text-xs sm:text-sm mt-1 font-semibold">How we protect your data and privacy</p>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10">
          {content ? (
            <div 
              dangerouslySetInnerHTML={{ __html: content }} 
              className="prose max-w-none text-gray-700 leading-relaxed font-medium text-sm space-y-4"
            />
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">Privacy Policy is currently being updated.</p>
          )}
        </div>

      </div>
    </div>
  );
}
