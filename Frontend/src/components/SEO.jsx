import { useEffect, useState } from 'react';

export default function SEO({ title, description, keywords, image, type = 'website', schema }) {
  const [siteTitle, setSiteTitle] = useState(window.siteTitle || '');
  const [siteName, setSiteName] = useState(window.siteName || '');
  const [metaKeywords, setMetaKeywords] = useState(window.metaKeywords || '');
  const [metaDescription, setMetaDescription] = useState(window.metaDescription || '');

  useEffect(() => {
    const handleTitleLoaded = () => {
      if (window.siteTitle) {
        setSiteTitle(window.siteTitle);
      }
      if (window.siteName) {
        setSiteName(window.siteName);
      }
      if (window.metaKeywords) {
        setMetaKeywords(window.metaKeywords);
      }
      if (window.metaDescription) {
        setMetaDescription(window.metaDescription);
      }
    };

    window.addEventListener('siteTitleLoaded', handleTitleLoaded);
    if (window.siteTitle && window.siteTitle !== siteTitle) {
      setSiteTitle(window.siteTitle);
    }
    if (window.siteName && window.siteName !== siteName) {
      setSiteName(window.siteName);
    }
    if (window.metaKeywords && window.metaKeywords !== metaKeywords) {
      setMetaKeywords(window.metaKeywords);
    }
    if (window.metaDescription && window.metaDescription !== metaDescription) {
      setMetaDescription(window.metaDescription);
    }

    return () => {
      window.removeEventListener('siteTitleLoaded', handleTitleLoaded);
    };
  }, [siteTitle, siteName, metaKeywords, metaDescription]);

  useEffect(() => {
    // 1. Dynamic Page Title
    const siteDisplayName = siteName || siteTitle || 'The Aqua Machine';
    if (title) {
      document.title = title !== siteDisplayName ? `${title} | ${siteDisplayName}` : title;
    } else {
      document.title = siteTitle || siteName || 'The Aqua Machine | Custom Aquariums & Aquascaping Studio';
    }

    // Helper utility to create or update HTML meta tags in head
    const updateOrCreateMeta = (nameAttr, value, isProperty = false) => {
      const attrName = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attrName}="${nameAttr}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attrName, nameAttr);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', value || '');
    };

    const defaultDesc = metaDescription || 'Aqua Machine is a premium aquarium and aquascaping studio specializing in custom freshwater and marine aquariums, bespoke designs, installations, and maintenance.';
    
    // 2. Meta Description
    updateOrCreateMeta('description', description || defaultDesc);

    // 3. Keywords
    const defaultKeywords = metaKeywords || 'aquarium, custom aquarium, aquascaping, marine aquarium, reef tank, fish tank, aquarium design, panvel, mumbai';
    if (keywords || defaultKeywords) {
      updateOrCreateMeta('keywords', keywords ? (Array.isArray(keywords) ? keywords.join(', ') : keywords) : defaultKeywords);
    }

    // 4. Open Graph Facebook / Social Previews
    const ogTitle = title 
      ? (siteDisplayName && title !== siteDisplayName ? `${title} | ${siteDisplayName}` : title) 
      : (siteTitle || siteName || 'The Aqua Machine');

    updateOrCreateMeta('og:title', ogTitle, true);
    updateOrCreateMeta('og:description', description || defaultDesc, true);
    updateOrCreateMeta('og:type', type, true);
    
    const previewImage = image || '/media/about_reef_aquarium.png';
    const absoluteImage = previewImage.startsWith('http') ? previewImage : `${window.location.origin}${previewImage}`;
    updateOrCreateMeta('og:image', absoluteImage, true);
    updateOrCreateMeta('og:url', window.location.href, true);

    // 5. Twitter Card Previews
    updateOrCreateMeta('twitter:card', 'summary_large_image');
    updateOrCreateMeta('twitter:title', ogTitle);
    updateOrCreateMeta('twitter:description', description || defaultDesc);
    updateOrCreateMeta('twitter:image', absoluteImage);

    // 6. Google Structured Data (JSON-LD Schema)
    let schemaScript = document.querySelector('#jsonld-schema');
    if (schema) {
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.id = 'jsonld-schema';
        schemaScript.type = 'application/ld+json';
        document.head.appendChild(schemaScript);
      }
      schemaScript.innerHTML = JSON.stringify(schema);
    } else {
      if (schemaScript) {
        schemaScript.remove();
      }
    }
  }, [title, description, keywords, image, type, schema, siteTitle, siteName]);

  return null;
}
