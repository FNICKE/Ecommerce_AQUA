// src/store/wishlistStore.js
import { create } from 'zustand';
import api from '../lib/api';

export const useWishlistStore = create((set, get) => ({
  wishlistItems: [],
  loading: false,
  error: null,

  fetchWishlist: async () => {
    if (!localStorage.getItem('token')) return;
    set({ loading: true, error: null });
    try {
      const res = await api.get('/wishlist');
      set({ wishlistItems: res.data.wishlist || [], loading: false });
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
      set({ loading: false, error: err.response?.data?.message || 'Failed to load wishlist' });
    }
  },

  toggleWishlist: async (product) => {
    if (!localStorage.getItem('token')) {
       // Optional: Redirect to login or show alert
       return false;
    }
    
    try {
      const res = await api.post('/wishlist/toggle', { product_id: product.id });
      await get().fetchWishlist();
      return res.data.action; // 'added' or 'removed'
    } catch (err) {
      console.error('Toggle wishlist failed:', err);
      throw err;
    }
  },

  isInWishlist: (productId) => {
    return get().wishlistItems.some((item) => item.id === productId);
  },

  clearWishlist: () => {
    set({ wishlistItems: [], error: null });
  },
}));