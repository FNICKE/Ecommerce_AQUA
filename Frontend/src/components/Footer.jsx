import { useEffect, useState } from 'react';
import api from '../lib/api';
import { 
  Mail, Phone, MapPin, Facebook, 
  Instagram, MessageCircle, ArrowRight, ShoppingBag,
  Youtube 
} from 'lucide-react';

export function Footer() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const response = await api.get('/config/public');
        setConfig(response.data || {});
        setLoading(false);
      } catch (err) {
        console.error("Footer config fetch failed:", err);
        setError("Unable to load footer");
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  const year = new Date().getFullYear();

  if (loading || error) return <div className="bg-[#0f172a] py-10 text-center text-gray-500">...</div>;

  // Dynamic links from DB, with graceful fallbacks
  const quickLinks = Array.isArray(config.footer_quick_links) && config.footer_quick_links.length > 0
    ? config.footer_quick_links
    : [
        { text: 'Aquarium Collections', url: '/category' },
        { text: 'Products Catalog', url: '/products' },
        { text: 'About Our Brand', url: '/about' },
        { text: 'Contact Us', url: '/contact' }
      ];

  const baseSupportLinks = Array.isArray(config.footer_support_links) && config.footer_support_links.length > 0
    ? config.footer_support_links
    : [
        { text: 'Track Order', url: '/my-orders' },
        { text: 'Privacy Policy', url: '/privacy' },
        { text: 'Terms of Service', url: '/terms' },
        { text: 'Return & Refund Policy', url: '/return-policy' },
        { text: 'Shipping Policy', url: '/shipping-policy' }
      ];

  const hasReturn = baseSupportLinks.some(l => l.url === '/return-policy' || l.text?.toLowerCase().includes('return'));
  const hasShipping = baseSupportLinks.some(l => l.url === '/shipping-policy' || l.text?.toLowerCase().includes('shipping'));

  const supportLinks = [...baseSupportLinks];
  if (!hasReturn) {
    supportLinks.push({ text: 'Return & Refund Policy', url: '/return-policy' });
  }
  if (!hasShipping) {
    supportLinks.push({ text: 'Shipping Policy', url: '/shipping-policy' });
  }

  // WhatsApp link construction
  const whatsappNumber = (config.social_whatsapp || config.contact_info?.phone || '8454064310').replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;

  const getImageUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') 
      ? url 
      : `${api.defaults.baseURL?.replace('/api', '') || ''}${url}`;
  };

  return (
    <footer className="relative bg-[#0f172a] text-white pt-20 pb-10 mt-auto overflow-hidden">
      {/* Decorative Background Element */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 mb-16">
          
          {/* Brand Identity */}
          <div className="col-span-2 lg:col-span-1 space-y-6">
            <div className="flex items-center gap-3">
              {config.logo_url ? (
                <img 
                  src={getImageUrl(config.logo_url)} 
                  alt="Logo" 
                  className="h-12 w-auto object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="bg-purple-600 p-2 rounded-lg">
                  <ShoppingBag size={24} />
                </div>
              )}
              {config.site_title_image ? (
                <img 
                  src={getImageUrl(config.site_title_image)} 
                  alt={config.site_name || 'Store'} 
                  className="h-7 w-auto object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <h3 className="text-2xl font-bold tracking-tight">
                  {config.site_name || 'Store'}
                </h3>
              )}
            </div>
            {config.footer_description && (
              <p className="text-gray-400 leading-relaxed max-w-xs">
                {config.footer_description}
              </p>
            )}
            <div className="flex gap-4">
              {config.social_facebook && (
                <SocialIcon Icon={Facebook} href={config.social_facebook} label="Facebook" />
              )}
              {config.social_instagram && (
                <SocialIcon Icon={Instagram} href={config.social_instagram} label="Instagram" />
              )}
              {config.social_youtube && (
                <SocialIcon Icon={Youtube} href={config.social_youtube} label="Youtube" />
              )}
              {(config.social_whatsapp || config.contact_info?.phone) && (
                <SocialIcon Icon={MessageCircle} href={whatsappUrl} label="WhatsApp" />
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1 lg:col-span-1">
            <FooterGroup title="Shop & Explore" links={quickLinks} />
          </div>

          {/* Support Links */}
          <div className="col-span-1 lg:col-span-1">
            <FooterGroup title="Customer Care" links={supportLinks} />
          </div>

          {/* Contact Details */}
          {(config.contact_info?.address || config.contact_info?.email || config.contact_info?.phone) && (
            <div className="col-span-2 lg:col-span-1 space-y-6">
              <h4 className="text-lg font-semibold text-white">Contact Us</h4>
              <ul className="space-y-4">
                {config.contact_info?.address && (
                  <ContactItem Icon={MapPin} text={config.contact_info.address} />
                )}
                {config.contact_info?.email && (
                  <ContactItem Icon={Mail} text={config.contact_info.email} href={`mailto:${config.contact_info.email}`} />
                )}
                {config.contact_info?.phone && (
                  <ContactItem Icon={Phone} text={config.contact_info.phone} href={`tel:${config.contact_info.phone.replace(/[^0-9+]/g, '')}`} />
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex justify-center items-center">
          <div className="text-gray-500 text-sm text-center">
            {config.footer_text ? (
              <span dangerouslySetInnerHTML={{ __html: config.footer_text }} />
            ) : (
              <>
                Copyright © {year}, All Right Reserved {config.site_name || 'AQUA MACHINE'}. Developed by <span className="text-purple-400 font-semibold">Kalki Digital</span>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

// Sub-components for cleaner code
function FooterGroup({ title, links }) {
  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-white">{title}</h4>
      <ul className="space-y-3">
        {links.map((link, i) => (
          <li key={i}>
            <a href={link.url} className="text-gray-400 hover:text-purple-400 flex items-center group transition-all duration-300">
              <ArrowRight size={14} className="mr-0 opacity-0 group-hover:mr-2 group-hover:opacity-100 transition-all" />
              {link.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContactItem({ Icon, text, href }) {
  const content = (
    <>
      <Icon size={18} className="text-purple-500 shrink-0 mt-1" />
      <span className="text-sm leading-relaxed">{text}</span>
    </>
  );

  if (href) {
    return (
      <li>
        <a href={href} className="flex items-start gap-3 text-gray-400 hover:text-white transition-colors">
          {content}
        </a>
      </li>
    );
  }

  return (
    <li className="flex items-start gap-3 text-gray-400 hover:text-white transition-colors cursor-default">
      {content}
    </li>
  );
}

function SocialIcon({ Icon, href, label }) {
  return (
    <a 
      href={href || '#'} 
      target="_blank" 
      rel="noopener noreferrer"
      aria-label={label}
      className="w-10 h-10 rounded-full bg-gray-800/50 flex items-center justify-center hover:bg-purple-600 hover:-translate-y-1 transition-all duration-300 border border-gray-700"
    >
      <Icon size={18} />
    </a>
  );
}
