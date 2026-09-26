import axios from 'axios';

export const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5001'
  : 'https://back.theaquamachine.com';

function normalizeApiBaseUrl(raw) {
  const base = (raw || '').trim().replace(/\/+$/, '');
  if (!base) return `${BACKEND_URL}/api`;
  return base.endsWith('/api') ? base : `${base}/api`;
}

const api = axios.create({
  baseURL: normalizeApiBaseUrl(BACKEND_URL),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

// Attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Better error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API request failed:', error);
    return Promise.reject(error);
  }
);

// ====================== FEATURED SECTION API ======================
api.featured = {
  // GET all featured sections (for table)
  getAll: () => api.get('/admin/featured-sections'),

  // POST create new featured section
  create: (data) => api.post('/admin/featured-sections', data),

  // PUT update featured section
  update: (id, data) => api.put(`/admin/featured-sections/${id}`, data),

  // DELETE a featured section
  delete: (id) => api.delete(`/admin/featured-sections/${id}`),

  // POST reorder sections
  reorder: (orderArray) => api.post('/admin/featured-sections/reorder', { order: orderArray }),
};

export default api;