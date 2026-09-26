import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import api from '../lib/api';
import { getImageUrl } from '../lib/imageUrl';
import SEO from '../components/SEO';

export default function About() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const load = async () => {
      try {
        const res = await api.get('/config/public');
        if (res.data?.about_page) {
          setData(res.data.about_page);
        }
      } catch (err) {
        console.error('Failed to load about us dynamic config:', err);
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
        <p className="text-gray-500 font-semibold">Loading About Us...</p>
      </div>
    );
  }

  if (!data || !data.heritage_title) {
    return (
      <div className="bg-[#f8f9fc] min-h-screen py-16 px-4">
        <div className="max-w-3xl mx-auto text-center bg-white p-10 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-2">About Us</h2>
          <p className="text-gray-500 text-sm">Information is currently being updated. Please check back soon.</p>
          <Link to="/" className="inline-block mt-6 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition no-underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fc] min-h-screen pb-16">
      <SEO 
        title="About Us"
        description={`Learn more about ${window.siteName || 'our store'} and our story.`}
        keywords={['about us', window.siteName || 'store']}
      />
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <nav className="flex items-center text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-gray-900 transition">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">About Us</span>
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10 flex flex-col gap-16">
          
          {/* --- Our Heritage Section --- */}
          <div className={`grid grid-cols-1 ${data.heritage_image1 || data.heritage_image2 ? 'lg:grid-cols-2 gap-8 md:gap-16' : 'max-w-4xl mx-auto'} items-center`}>
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center text-xs font-bold text-purple-600 uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full mb-4">
                Our Legacy
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                {data.heritage_title.includes(' & ') ? (
                  <>
                    {data.heritage_title.split(' & ')[0]} <br />
                    <span className="text-purple-700">& {data.heritage_title.split(' & ')[1]}</span>
                  </>
                ) : (
                  data.heritage_title
                )}
              </h2>
              <div className="space-y-6 text-gray-600 text-sm md:text-base leading-relaxed">
                {data.heritage_p1 && <div dangerouslySetInnerHTML={{ __html: data.heritage_p1 }} />}
                {data.heritage_p2 && <div dangerouslySetInnerHTML={{ __html: data.heritage_p2 }} />}
                {(data.heritage_label1_val || data.heritage_label2_val) && (
                  <div className="flex gap-8 pt-4">
                    {data.heritage_label1_val && (
                      <div>
                        <h4 className="text-3xl font-bold text-green-600">{data.heritage_label1_val}</h4>
                        <p className="text-xs uppercase tracking-wider font-semibold text-gray-400 mt-1">{data.heritage_label1_txt}</p>
                      </div>
                    )}
                    {data.heritage_label1_val && data.heritage_label2_val && (
                      <div className="w-px h-12 bg-gray-200" />
                    )}
                    {data.heritage_label2_val && (
                      <div>
                        <h4 className="text-3xl font-bold text-purple-700">{data.heritage_label2_val}</h4>
                        <p className="text-xs uppercase tracking-wider font-semibold text-gray-400 mt-1">{data.heritage_label2_txt}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {(data.heritage_image1 || data.heritage_image2) && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className={`grid ${data.heritage_image1 && data.heritage_image2 ? 'grid-cols-2 gap-4' : 'grid-cols-1'}`}
              >
                {data.heritage_image1 && (
                  <img 
                    src={getImageUrl(data.heritage_image1)} 
                    className="rounded-2xl h-56 md:h-64 w-full object-cover shadow-sm hover:scale-[1.02] transition-transform duration-300" 
                    alt="About Us Image 1"
                  />
                )}
                {data.heritage_image2 && (
                  <img 
                    src={getImageUrl(data.heritage_image2)} 
                    className={`rounded-2xl ${data.heritage_image1 ? 'h-72 md:h-80 -mt-8' : 'h-64 md:h-72'} w-full object-cover shadow-sm hover:scale-[1.02] transition-transform duration-300`} 
                    alt="About Us Image 2"
                  />
                )}
              </motion.div>
            )}
          </div>

          {/* --- Core Values (Promise) --- */}
          <div className="border-t border-gray-100 pt-16">
            <div className="text-center mb-12">
              <span className="text-xs font-bold text-purple-600 uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full">
                Why Choose Us
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-2">{data.promise_title}</h2>
              <div className="w-16 h-1 bg-purple-600 mx-auto mt-3 rounded-full" />
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {[
                {
                  title: data.promise1_title,
                  desc: data.promise1_desc,
                },
                {
                  title: data.promise2_title,
                  desc: data.promise2_desc,
                },
                {
                  title: data.promise3_title,
                  desc: data.promise3_desc,
                }
              ].map((value, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08, duration: 0.5 }}
                  className="p-6 md:p-8 rounded-2xl border border-gray-100 bg-[#f8f9fc] hover:shadow-md hover:bg-white hover:border-purple-100 transition-all duration-300"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{value.title}</h3>
                  <div className="text-gray-500 leading-relaxed text-xs md:text-sm" dangerouslySetInnerHTML={{ __html: value.desc }} />
                </motion.div>
              ))}
            </div>
          </div>

          {/* --- Logistics / Why Us Banner --- */}
          <div className="relative overflow-hidden bg-gradient-to-r from-purple-900 to-indigo-950 rounded-2xl p-8 sm:p-12 text-white shadow-sm">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full -ml-32 -mb-32 blur-2xl" />
            
            <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 text-center">
              {[
                { title: data.why_title1, desc: data.why_desc1 },
                { title: data.why_title2, desc: data.why_desc2 },
                { title: data.why_title3, desc: data.why_desc3 },
                { title: data.why_title4, desc: data.why_desc4 },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center">
                  <h4 className="font-bold text-sm md:text-base mb-1">{item.title}</h4>
                  <div className="text-purple-200 text-[11px] md:text-xs leading-relaxed max-w-[150px] mx-auto" dangerouslySetInnerHTML={{ __html: item.desc }} />
                </div>
              ))}
            </div>
          </div>


        </div>
      </main>
    </div>
  );
}
