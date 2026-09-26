// lib/imageUrl.js
// Central utility to resolve image URLs from DB paths
// Use origin without /api — static files (uploads) are served at /uploads, not /api/uploads
import { BACKEND_URL } from './api';
const raw = BACKEND_URL;
const BASE = raw.replace(/\/api\/?$/, '') || raw;

/**
 * Convert a relative DB image path to a full URL.
 * Handles paths like:
 *   - "uploads/products/file.jpg"   → http://localhost:5000/uploads/products/file.jpg
 *   - "/uploads/products/file.jpg"  → http://localhost:5000/uploads/products/file.jpg
 *   - "http://..."                  → passed through unchanged
 *   - null / undefined / ''        → returns `fallback`
 */
export const NO_IMAGE_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Crect fill='%23f8fafc' width='160' height='160' rx='8'/%3E%3Cg fill='%2394a3b8' opacity='0.7'%3E%3Cpath d='M45 110h70a5 5 0 0 0 5-5V55a5 5 0 0 0-5-5H45a5 5 0 0 0-5 5v50a5 5 0 0 0 5 5zm5-52h60v36.5l-16-16-12 12-18-18-14 14V58z'/%3E%3Ccircle cx='62' cy='68' r='5'/%3E%3C/g%3E%3Ctext x='50%25' y='82%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui, -apple-system, sans-serif' font-size='10' font-weight='600' fill='%2394a3b8'%3ENo Image%3C/text%3E%3C/svg%3E";

export function getImageUrl(path, fallback = NO_IMAGE_SVG) {
    if (!path) return fallback;
    if (typeof path !== 'string') return fallback;
    
    // Strip protocol and host from local backend upload paths (e.g. http://localhost:5000/uploads/...)
    // so Vite dev server proxy routes them as same-origin requests to bypass Helmet CORP/CORS blocks
    let cleanPath = path;
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
        if (cleanPath.includes('/uploads/')) {
            cleanPath = cleanPath.replace(/^https?:\/\/[^/]+/, '');
        } else {
            return cleanPath;
        }
    }
    
// 1. Normalize slashes and remove common noise
    // Strip leading /public/ or public/ as files are served from /uploads root
    cleanPath = cleanPath.replace(/\\/g, '/')
                        .replace(/^\/?public\//, '/') // Remove leading /public/ or public/
                        .replace(/\/+/g, '/');       // Collapse multiple slashes
    
    // 2. Ensure it starts with a leading slash
    cleanPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    
    // 3. Detect if the path is already URI encoded
    const isEncoded = /%[0-9A-Fa-f]{2}/.test(cleanPath);
    
    // 4. Construct the encoded part of the URL
    let finalEncodedPath;
    if (isEncoded) {
        finalEncodedPath = cleanPath;
    } else {
        finalEncodedPath = cleanPath.split('/')
            .map(seg => seg ? encodeURIComponent(seg) : '')
            .join('/');
    }
    
    // If the path starts with /media/, it is a frontend local static asset.
    // Return it directly so it is served by the frontend web server.
    if (finalEncodedPath.startsWith('/media/')) {
        return finalEncodedPath;
    }

    // If it starts with /uploads, return as relative path in development to let Vite Proxy handle it.
    if (import.meta.env.DEV && finalEncodedPath.startsWith('/uploads/')) {
        return finalEncodedPath;
    }

    // Prepend BASE (stripping trailing slash)
    const baseUrl = BASE.replace(/\/+$/, '');
    return `${baseUrl}${finalEncodedPath}`;
}
