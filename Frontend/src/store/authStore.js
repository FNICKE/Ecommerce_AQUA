// src/store/authStore.js
import { create } from 'zustand';
import api from '../lib/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  authLoading: true, // new: useful for showing loader on app init

  // Initialize auth state on app load (call this in main.jsx or App.jsx)
  initializeAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ authLoading: false });
      return;
    }

    try {
      api.defaults.headers.Authorization = `Bearer ${token}`;
      const res = await api.get('/auth/me');

      set({
        user: res.data.user || res.data,
        token,
        isAuthenticated: true,
        authLoading: false,
      });
    } catch (err) {
      console.warn('Auth initialization failed:', err.message);
      localStorage.removeItem('token');
      api.defaults.headers.Authorization = undefined;
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        authLoading: false,
      });
    }
  },

  // Login
  login: (userData, token) => {
    localStorage.setItem('token', token);
    api.defaults.headers.Authorization = `Bearer ${token}`;

    set({
      user: userData,
      token,
      isAuthenticated: true,
      authLoading: false,
    });
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    api.defaults.headers.Authorization = undefined;

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      authLoading: false,
    });
  },

  // Update full user object (used after profile update)
  setUser: (updatedUser) => set((state) => ({
    user: { ...state.user, ...updatedUser },
  })),

  // Partial update (more convenient in some cases)
  updateUser: (updates) => set((state) => ({
    user: state.user ? { ...state.user, ...updates } : null,
  })),
}));
