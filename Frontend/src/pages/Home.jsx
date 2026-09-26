
// src/pages/Home.jsx - Navruchi Design with Purple Theme
import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import api from '../lib/api';
import { 
  ChevronRight,
  ChevronLeft,
  Loader2,
  ShoppingBag,
  Heart,
  Star,
  ArrowRight,
  Mail,
  MapPin,
  Phone,
  User,
  Truck,
  ArrowLeftRight,
  Headphones,
  ShieldCheck
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useWishlistStore } from '../store/wishlistStore';
import { useAuthStore } from '../store/authStore';
import { getImageUrl } from '../lib/imageUrl';
import SEO from '../components/SEO';

export default function Home() {
  const scrollRef = useRef(null);
  
  const scrollTestimonials = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const cardWidth = scrollRef.current.firstChild?.offsetWidth || (clientWidth / 3);
      const scrollTo = direction === 'left' 
        ? scrollLeft - cardWidth - 24 
        : scrollLeft + cardWidth + 24;
      
      scrollRef.current.scrollTo({
        left: scrollTo,
        behavior: 'smooth'
      });
    }
  };

  const [heroSlides, setHeroSlides] = useState([]);
  const [siteContent, setSiteContent] = useState({});
  const [featuredSections, setFeaturedSections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [offers, setOffers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [publicConfig, setPublicConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { fetchWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const whatsappPhone = (publicConfig?.social_whatsapp || '8454064310').replace(/\D/g, '');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('payment_success') === '1') {
      navigate('/my-orders', { replace: true });
    }
  }, [location.search, navigate]);

  useEffect(() => {
    if (isAuthenticated && fetchWishlist) {
      fetchWishlist().catch(err => console.error("Home wishlist fetch error:", err));
    }
  }, [isAuthenticated, fetchWishlist]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);

        // Fetch sliders
        const slidesRes = await api.get('/config/sliders');
        const backendSlides = slidesRes.data?.slides || [];
        setHeroSlides(backendSlides);

        // Fetch dynamic site content (newsletter/CTA)
        const contentRes = await api.get('/config/site-content');
        setSiteContent(contentRes.data?.data || {});

        // Fetch featured sections (Home products)
        const sectionsRes = await api.get('/home/home-products');
        setFeaturedSections(sectionsRes.data?.categories || []);

        // Fetch public config
        try {
          const publicRes = await api.get('/config/public');
          setPublicConfig(publicRes.data || null);
        } catch (pubErr) {
          console.error('Home public config fetch error:', pubErr);
        }

        // Fetch all categories
        const categoriesRes = await api.get('/categories');
        setCategories(categoriesRes.data?.categories || []);

        // Fetch products
        const productsRes = await api.get('/products');
        setNewProducts(productsRes.data?.products || []);

        // Fetch active offers
        try {
          const offersRes = await api.get('/offers');
          const activeOffers = offersRes.data?.offers || [];
          if (activeOffers.length > 0) {
            setOffers(activeOffers.slice(0, 3));
          } else {
            setOffers([]);
          }
        } catch (offerErr) {
          console.error('Home offers fetch error:', offerErr);
          setOffers([]);
        }

        // Fetch active reviews
        try {
          const reviewsRes = await api.get('/home/reviews');
          const activeReviews = reviewsRes.data?.reviews || [];
          if (activeReviews.length > 0) {
            setReviews(activeReviews);
          } else {
            setReviews([]);
          }
        } catch (revErr) {
          console.error('Home reviews fetch error:', revErr);
          setReviews([]);
        }

      } catch (err) {
        console.error('Home fetch error:', err);
        setHeroSlides([]);
        setOffers([]);
        setReviews([]);
        setCategories([]);
        setNewProducts([]);
        setFeaturedSections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-900">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
          <Loader2 className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="The Aqua Machine | Custom Aquariums & Aquascaping Studio" 
        description="Aqua Machine is a premium aquarium and aquascaping studio specializing in custom freshwater and marine aquariums, bespoke designs, installations, and maintenance." 
        image="/media/about_reef_aquarium.png"
      />
      {/* 1. HERO SECTION - Full Width Carousel */}
      {heroSlides.length > 0 && (
        <section className="relative overflow-hidden w-full">
          <Carousel
          autoPlay
          infiniteLoop
          showThumbs={false}
          showStatus={false}
          showArrows={false}
          interval={5000}
          transitionTime={800}
        >
          {heroSlides.map((slide) => (
            <div
              key={slide.id}
              className="relative overflow-hidden w-full h-[35vh] sm:h-[48vh] md:h-[65vh] lg:h-[75vh] max-h-[750px] min-h-[300px] bg-slate-900 flex items-center justify-center"
            >
              {/* Background Image - fitted without cropping, 100% visible */}
              <img
                src={getImageUrl(slide.image_url)}
                alt={slide.title || 'Hero Banner'}
                className="w-full h-full object-contain mx-auto block"
              />

              {/* Subtle dark overlay to improve text readability */}
              <div className="absolute inset-0 bg-black/40 z-10"></div>

              {/* Content Overlay */}
              <div className="absolute inset-0 z-20 flex flex-col items-start justify-center px-8 md:px-16 lg:px-24">
                {slide.title && (
                  <div className="">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                    >
                      <span className="inline-block px-3 py-1 bg-purple-600/90 text-white text-xs font-semibold rounded-full mb-3 tracking-widest uppercase shadow-sm">
                        {slide.badge || 'Premium Collection'}
                      </span>
                    </motion.div>
                    <motion.h1
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, delay: 0.1 }}
                      className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight mb-3 drop-shadow-md"
                    >
                      {slide.title}
                    </motion.h1>
                    {slide.subtitle && (
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="text-xs sm:text-sm md:text-base text-gray-200 mb-6 leading-relaxed drop-shadow-sm"
                      >
                        {slide.subtitle}
                      </motion.p>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, delay: 0.3 }}
                      className="flex gap-3 flex-wrap"
                    >
                      <a
                        href={slide.cta_link || '/products'}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-md hover:shadow-purple-500/20 transition-all duration-300 hover:scale-105 text-xs md:text-sm"
                      >
                        {slide.cta_text || 'Shop Now'}
                        <ArrowRight size={14} />
                      </a>
                      <a
                        href="/products"
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300 text-xs md:text-sm"
                      >
                        Explore All
                      </a>
                    </motion.div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </Carousel>
      </section>
      )}

      {/* 1.5. EXCLUSIVE OFFERS SECTION */}
      {offers.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <span className="text-xs font-bold text-purple-600 uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full">
                Special Deals
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-2">
                Exclusive Offers For You
              </h2>
              <div className="w-12 h-1 bg-purple-600 mx-auto mt-3 rounded-full"></div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {offers.slice(0, 3).map((offer, idx) => {
                // Determine target link
                let targetLink = '/products';
                if (offer.type === 'categories' && offer.type_id) {
                  targetLink = `/category/${offer.type_id}`;
                } else if (offer.type === 'products') {
                  targetLink = `/products`;
                } else if (offer.link && offer.link !== '0') {
                  targetLink = offer.link;
                }

                // Format discount text
                let discountText = '';
                if (offer.min_discount > 0 && offer.max_discount > 0) {
                  discountText = `${offer.min_discount}% - ${offer.max_discount}% OFF`;
                } else if (offer.max_discount > 0) {
                  discountText = `UP TO ${offer.max_discount}% OFF`;
                } else if (offer.min_discount > 0) {
                  discountText = `MIN ${offer.min_discount}% OFF`;
                }

                return (
                  <motion.a
                    key={offer.id || idx}
                    href={targetLink}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    whileHover={{ y: -6, scale: 1.02 }}
                    className="group relative block h-64 md:h-72 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-slate-900 border border-gray-100"
                  >
                    {/* Background Image */}
                    <img
                      src={getImageUrl(offer.image)}
                      alt={offer.title || 'Offer'}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[6000ms] ease-out opacity-85 group-hover:opacity-100"
                    />

                    {/* Gradient Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent z-10" />
                    <div className="absolute inset-0 bg-purple-950/20 group-hover:bg-purple-950/0 transition-colors duration-300 z-10" />

                    {/* Content overlay */}
                    <div className="absolute inset-0 z-20 flex flex-col justify-end p-6">
                      <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        {/* Discount Badge */}
                        {discountText && (
                          <span className="inline-block px-3 py-1 bg-amber-500 text-slate-900 font-extrabold text-[10px] uppercase tracking-wider rounded-md mb-2.5 shadow-sm">
                            {discountText}
                          </span>
                        )}

                        {/* Title */}
                        <h3 className="text-xl font-bold text-white leading-tight mb-1 drop-shadow-md">
                          {offer.title || 'Special Collection'}
                        </h3>

                        {/* Subtitle / Category Label */}
                        <p className="text-xs text-gray-300 font-medium tracking-wide mb-4">
                          {offer.type === 'categories' && offer.category_name 
                            ? `Category: ${offer.category_name}` 
                            : 'Limited Time Deal'}
                        </p>

                        {/* Action Link */}
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:text-white transition-colors duration-300">
                          <span>Explore Deal</span>
                          <ChevronRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </motion.a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 2. POPULAR CATEGORIES SECTION */}
      {categories.length > 0 && (
        <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Popular Categories
              </h2>
              <motion.a
                whileHover={{ x: 5 }}
                href="/products"
                className="px-6 py-2 bg-purple-200 hover:bg-purple-300 text-purple-800 font-semibold rounded-lg transition"
              >
                View More
              </motion.a>
            </div>

            <div className="flex overflow-x-auto md:grid md:grid-cols-4 lg:grid-cols-7 gap-4 pb-4 md:pb-0 snap-x snap-mandatory scroll-smooth hide-scrollbar">
              {categories.slice(0, 7).map((category, idx) => (
                <motion.a
                  key={category.id}
                  href={`/category/${category.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -5 }}
                  className="group text-center flex-shrink-0 w-32 md:w-auto snap-start"
                >
                  <div className="relative overflow-hidden rounded-lg mb-3 h-28 md:h-32 bg-gray-100">
                    {(category.imageUrl || category.image_url || category.image) ? (
                      <img 
                        src={getImageUrl(category.imageUrl || category.image_url || category.image)} 
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <span className="text-2xl">📦</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm md:text-base text-gray-900 group-hover:text-purple-700 transition-colors line-clamp-2">
                    {category.name}
                  </h3>
                </motion.a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. NEWLY ADDED PRODUCTS SECTION */}
      {newProducts.length > 0 && (
        <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Newly Added Products
              </h2>
              <motion.a
                whileHover={{ x: 5 }}
                href="/products"
                className="px-6 py-2 bg-purple-200 hover:bg-purple-300 text-purple-800 font-semibold rounded-lg transition"
              >
                View More
              </motion.a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {newProducts.slice(0, 4).map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. FEATURED SECTION WITH LARGE IMAGE */}
      {featuredSections.length > 0 && (
        <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-white space-y-16">
          <div className="max-w-7xl mx-auto space-y-16">
            {featuredSections.map((section, idx) => (
              <div key={section.category.id}>
                <div className="flex items-center justify-between mb-10">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {section.category.name}
                  </h2>
                  <motion.a
                    whileHover={{ x: 5 }}
                    href={`/category/${section.category.id}`}
                    className="px-6 py-2 bg-purple-200 hover:bg-purple-300 text-purple-800 font-semibold rounded-lg transition text-sm"
                  >
                    View More
                  </motion.a>
                </div>

                <div className="grid md:grid-cols-5 gap-6 items-stretch">
                  {/* Left: Product Cards (2 columns, up to 4 products) */}
                  <div className="md:col-span-3">
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      {section.products?.slice(0, 4).map((product, prodIdx) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ delay: prodIdx * 0.05 }}
                        >
                          <ProductCard product={product} />
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Large Featured Category Image Banner */}
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    className="md:col-span-2 h-full flex flex-col justify-stretch"
                  >
                    <Link
                      to={`/category/${section.category.id}`}
                      className="relative block rounded-2xl overflow-hidden h-full min-h-[380px] md:min-h-full bg-gray-100 hover:shadow-xl transition-shadow duration-300 group border border-gray-100"
                    >
                      <img 
                        src={getImageUrl(section.category.imageUrl || section.category.image_url || section.category.image || section.products?.[0]?.image)} 
                        alt={section.category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[6000ms] ease-out"
                      />
                      
                      {/* Gradient Overlay & Premium Interactive Label */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent z-10" />
                      <div className="absolute inset-0 bg-purple-950/15 group-hover:bg-purple-950/0 transition-colors duration-300 z-10" />
                      
                      <div className="absolute inset-0 z-20 flex flex-col justify-end p-8">
                        <span className="inline-block px-3 py-1 bg-purple-600/90 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-md mb-2.5 shadow-sm w-fit">
                          Featured Category
                        </span>
                        <h3 className="text-2xl font-black text-white leading-tight mb-2 drop-shadow-md">
                          {section.category.name}
                        </h3>
                        <p className="text-xs text-gray-300 font-medium tracking-wide flex items-center gap-1 group-hover:text-purple-300 transition-colors duration-300">
                          Explore Collection <ArrowRight size={12} className="transform group-hover:translate-x-1 transition-transform" />
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Dynamic Features/Benefits Section */}
      {publicConfig?.features && (
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 border-t border-b border-gray-100">
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {publicConfig.features.shipping?.enabled && (
              <div className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                  <Truck size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{publicConfig.features.shipping.title || 'Free Shipping'}</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{publicConfig.features.shipping.description || 'Free delivery at your doorstep.'}</p>
                </div>
              </div>
            )}
            {publicConfig.features.returns?.enabled && (
              <div className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                  <ArrowLeftRight size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{publicConfig.features.returns.title || 'Free Returns'}</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{publicConfig.features.returns.description || 'Easy return if products are damaged.'}</p>
                </div>
              </div>
            )}
            {publicConfig.features.support?.enabled && (
              <div className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                  <Headphones size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{publicConfig.features.support.title || 'Support 24/7'}</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{publicConfig.features.support.description || '24/7 and 365 days support is available.'}</p>
                </div>
              </div>
            )}
            {publicConfig.features.safety?.enabled && (
              <div className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{publicConfig.features.safety.title || '100% Safe & Secure'}</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{publicConfig.features.safety.description || '100% safe & secure.'}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Dynamic App Download Section */}
      {publicConfig?.app_download?.enabled && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-900 to-indigo-950 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-xl space-y-5">
              {publicConfig.app_download.promo_header && (
                <span className="inline-block px-3 py-1 bg-amber-500 text-slate-900 font-extrabold text-[10px] uppercase tracking-wider rounded-md shadow-sm">
                  {publicConfig.app_download.promo_header}
                </span>
              )}
              <h2 className="text-2xl md:text-4xl font-black leading-tight">
                {publicConfig.app_download.title || 'Download Our App Now'}
              </h2>
              {publicConfig.app_download.tagline && (
                <p className="text-sm font-bold text-purple-300 uppercase tracking-wider">
                  {publicConfig.app_download.tagline}
                </p>
              )}
              <p className="text-sm text-gray-300 leading-relaxed">
                {publicConfig.app_download.description || 'Get exclusive app-only deals and order management tools.'}
              </p>
              <div className="flex gap-4 pt-2 flex-wrap">
                {publicConfig.app_download.playstore_url && (
                  <a
                    href={publicConfig.app_download.playstore_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-3 bg-black hover:bg-slate-900 border border-gray-800 px-5 py-2.5 rounded-xl transition shadow-md"
                  >
                    <span className="text-xl">🤖</span>
                    <div className="text-left">
                      <p className="text-[9px] text-gray-400 uppercase font-semibold leading-none">Get it on</p>
                      <p className="text-xs font-bold text-white mt-0.5">Google Play</p>
                    </div>
                  </a>
                )}
                {publicConfig.app_download.applestore_url && (
                  <a
                    href={publicConfig.app_download.applestore_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-3 bg-black hover:bg-slate-900 border border-gray-800 px-5 py-2.5 rounded-xl transition shadow-md"
                  >
                    <span className="text-xl">🍎</span>
                    <div className="text-left">
                      <p className="text-[9px] text-gray-400 uppercase font-semibold leading-none">Download on the</p>
                      <p className="text-xs font-bold text-white mt-0.5">App Store</p>
                    </div>
                  </a>
                )}
              </div>
            </div>
            {/* Visual Phone Mockup element */}
            <div className="relative w-64 h-96 bg-slate-800 border-8 border-slate-700 rounded-[32px] overflow-hidden shadow-2xl flex-shrink-0 hidden md:block">
              <div className="absolute top-0 inset-x-0 h-4 bg-slate-700 flex justify-center items-center">
                <div className="w-16 h-2 bg-slate-900 rounded-full" />
              </div>
              <div className="w-full h-full p-4 flex flex-col justify-between bg-gradient-to-b from-purple-950 to-indigo-950 pt-8">
                <div className="text-center space-y-1">
                  <div className="w-10 h-10 bg-purple-600 rounded-xl mx-auto flex items-center justify-center font-bold text-white text-lg shadow-md">A</div>
                  <h4 className="text-xs font-bold text-white">{publicConfig?.site_name || 'AQUA MACHINE'}</h4>
                  <p className="text-[8px] text-purple-300">Aquarium Supplies App</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-[8px] text-gray-300 space-y-2">
                  <div className="h-2 bg-white/20 rounded w-2/3" />
                  <div className="h-2 bg-white/10 rounded w-full" />
                  <div className="h-6 bg-purple-600 rounded w-full flex items-center justify-center font-bold text-[8px] text-white">Order Now</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. CUSTOMER TESTIMONIALS SECTION */}
      {reviews.length > 0 && (
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50/50 dark:bg-slate-900/40 border-t border-gray-100 dark:border-slate-800 overflow-hidden">
          <style>{`
            .hide-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .hide-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>

          <div className="max-w-7xl mx-auto relative">
            {/* Section Header with Controls */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6">
              <div className="text-center md:text-left">
                <span className="inline-block text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest bg-purple-50 dark:bg-purple-950/20 px-3 py-1 rounded-full w-fit">
                  Testimonials
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mt-3 tracking-tight">
                  What Our Customers Say
                </h2>
                <div className="w-12 h-1 bg-purple-600 dark:bg-purple-400 mt-4 rounded-full mx-auto md:mx-0"></div>
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => scrollTestimonials('left')}
                  className="p-3 rounded-full bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-100 dark:border-slate-700 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                  title="Previous"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollTestimonials('right')}
                  className="p-3 rounded-full bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-100 dark:border-slate-700 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                  title="Next"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Testimonials Slider Track */}
            <div 
              ref={scrollRef}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-6 hide-scrollbar cursor-grab active:cursor-grabbing"
            >
              {reviews.map((rev, idx) => (
                <motion.div
                  key={rev.id || idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                  className="snap-start shrink-0 w-[85vw] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[250px] relative group"
                >
                  {/* Quote Icon overlay */}
                  <div className="absolute top-6 right-6 text-purple-100 dark:text-slate-700/40 text-6xl font-serif leading-none select-none pointer-events-none group-hover:text-purple-200 dark:group-hover:text-slate-600 transition-colors">
                    “
                  </div>

                  {/* Review Text */}
                  <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed italic z-10 mb-6">
                    "{rev.review}"
                  </p>

                  <div className="flex items-center gap-4 border-t border-gray-50 dark:border-slate-700/50 pt-5 z-10">
                    {/* Image Avatar */}
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-purple-100 shrink-0 border border-purple-200 dark:border-purple-950/50 flex items-center justify-center">
                      {rev.image ? (
                        <img 
                          src={getImageUrl(rev.image)} 
                          alt={rev.name} 
                          className="w-full h-full object-cover"
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <User size={20} className="text-purple-600 shrink-0" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{rev.name}</h4>
                      {rev.designation && (
                        <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 truncate mt-0.5">{rev.designation}</p>
                      )}
                      
                      {/* Rating Stars */}
                      <div className="flex gap-0.5 mt-1.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            size={10} 
                            className={i < rev.stars ? "fill-amber-400 text-amber-400 text-xs shrink-0" : "text-gray-300 shrink-0"} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Floating WhatsApp Button */}
      <a
        href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
          `Hi! I am visiting your website ${window.location.origin} and would like to chat.`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-8 z-40 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:bg-[#20ba59] hover:scale-110 transition duration-300 flex items-center justify-center cursor-pointer"
        title="Chat on WhatsApp"
      >
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.473 1.452 5.38 1.453 5.485 0 9.948-4.463 9.952-9.953.002-2.661-1.03-5.163-2.906-7.039C17.2 1.74 14.7.708 12.036.708c-5.461 0-9.92 4.45-9.927 9.947-.001 1.916.504 3.79 1.464 5.394l-.963 3.517 3.606-.946zm11.52-7.112c-.27-.135-1.597-.788-1.848-.879-.25-.09-.433-.135-.615.135-.18.27-.7.879-.857 1.057-.158.18-.316.2-.586.065-.27-.135-1.14-.42-2.17-1.337-.8-.713-1.34-1.594-1.497-1.864-.158-.27-.017-.417.118-.552.121-.12.27-.315.405-.473.135-.158.18-.27.27-.45.09-.18.045-.338-.022-.473-.068-.135-.615-1.482-.843-2.029-.222-.534-.444-.46-.615-.468-.158-.007-.338-.007-.518-.007-.18 0-.473.068-.72.338-.248.27-.946.924-.946 2.251s.965 2.613 1.1 2.793c.135.18 1.899 2.9 4.6 4.067.643.277 1.143.444 1.533.567.646.205 1.234.176 1.7.106.52-.078 1.597-.652 1.822-1.282.225-.63.225-1.17.158-1.282-.068-.112-.25-.202-.52-.337z"/>
        </svg>
      </a>

      {/* Scroll to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 p-4 rounded-full bg-purple-700 hover:bg-purple-800 text-white shadow-2xl hover:shadow-lg transition-all z-40"
      >
        <ChevronRight className="-rotate-90" size={24} />
      </button>
    </div>
  );
}
