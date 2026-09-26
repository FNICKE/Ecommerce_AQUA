// src/store/cartStore.js
import { create } from 'zustand';
import api from '../lib/api';

export const useCartStore = create((set, get) => ({
  cartItems: [],          // array of cart items (API or guest local storage)
  loading: false,
  error: null,

  // Fetch and normalize cart items
  fetchCart: async (silent = false) => {
    const isAuthed = !!localStorage.getItem('token');
    
    if (isAuthed) {
      // 1. Sync guest cart items to backend if they exist
      const guestItems = JSON.parse(localStorage.getItem('guest_cart_items') || '[]');
      if (guestItems.length > 0) {
        try {
          for (const item of guestItems) {
            await api.post('/cart', {
              product_id: item.product_id,
              variant_id: item.variant_id,
              qty: item.qty || 1,
            });
          }
          localStorage.removeItem('guest_cart_items');
        } catch (err) {
          console.warn('Failed to sync guest cart items on fetchCart:', err.message);
        }
      }

      // 2. Fetch authenticated cart from backend
      if (!silent) set({ loading: true, error: null });
      try {
        const res = await api.get('/cart');
        const rawItems = res.data.cartItems || [];

        const normalizedItems = rawItems.map(item => {
          const effectivePrice =
            item.special_price > 0 && item.special_price < item.price
              ? Number(item.special_price)
              : Number(item.price);

          return {
            ...item,
            id: item.cart_id,                    // map cart_id → id
            productId: item.product_id,          // clearer name
            product_variant_id: item.variant_id, // expose variant id
            effectivePrice,                      // discounted price
          };
        });

        set({ cartItems: normalizedItems, loading: false });
      } catch (err) {
        console.error('Failed to fetch cart:', err);
        set({
          loading: false,
          error: err.response?.data?.message || 'Failed to load cart',
        });
      }
    } else {
      // Guest: Fetch cart from localStorage
      const guestItems = JSON.parse(localStorage.getItem('guest_cart_items') || '[]');
      set({ cartItems: guestItems, loading: false, error: null });
    }
  },

  // Add item to cart
  addToCart: async (item) => {
    const isAuthed = !!localStorage.getItem('token');
    const productId = item.product_id || item.id;
    const variantId = item.variant_id || item.variantId || item.product_variant_id;
    const qty = item.qty || 1;

    if (isAuthed) {
      try {
        await api.post('/cart', {
          product_id: productId,
          variant_id: variantId,
          qty: qty,
        });
        await get().fetchCart(true); // fetch silently to prevent layout flashing
        return true;
      } catch (err) {
        console.error('Add to cart failed:', err);
        const message = err.response?.data?.message || 'Failed to add item';
        set({ error: message });
        throw err;
      }
    } else {
      // Guest: Fetch product details to construct local cart item
      try {
        const [prodRes, varRes] = await Promise.all([
          api.get(`/products/${productId}`),
          api.get(`/variants/product/${productId}`),
        ]);

        const product = prodRes.data.product;
        const variants = varRes.data.variants || [];
        const variant = variants.find(v => v.id === variantId) || variants[0];

        const price = variant?.price || product.price || 0;
        const specialPrice = variant?.special_price || 0;
        const effectivePrice =
          specialPrice > 0 && specialPrice < price
            ? Number(specialPrice)
            : Number(price);

        const guestItem = {
          id: `guest-${productId}-${variantId}`,
          cart_id: `guest-${productId}-${variantId}`,
          product_id: productId,
          variant_id: variantId,
          qty: qty,
          name: product.name,
          image: variant?.image || product.image,
          weight: variant?.weight || '',
          price: price,
          special_price: specialPrice,
          effectivePrice: effectivePrice,
          productId: productId,
          product_variant_id: variantId,
          stock: variant?.stock || product.stock || 0,
        };

        const existingItems = JSON.parse(localStorage.getItem('guest_cart_items') || '[]');
        const existingIndex = existingItems.findIndex(
          i => i.product_id === productId && i.variant_id === variantId
        );

        if (existingIndex > -1) {
          existingItems[existingIndex].qty += qty;
        } else {
          existingItems.push(guestItem);
        }

        localStorage.setItem('guest_cart_items', JSON.stringify(existingItems));
        set({ cartItems: existingItems });
        return true;
      } catch (err) {
        console.error('Guest add to cart failed:', err);
        set({ error: 'Failed to add to guest cart' });
        throw err;
      }
    }
  },

  // Update quantity of existing cart item
  updateCartItem: async (itemId, qty) => {
    const isAuthed = !!localStorage.getItem('token');
    const quantity = Number(qty);
    if (isNaN(quantity) || quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }

    if (isAuthed) {
      try {
        await api.put(`/cart/${itemId}`, { qty: quantity });
        await get().fetchCart(true); // fetch silently to prevent layout flashing
        return true;
      } catch (err) {
        console.error('Update cart item failed:', err);
        const message = err.response?.data?.message || 'Failed to update quantity';
        set({ error: message });
        throw err;
      }
    } else {
      // Guest: Update localStorage
      const guestItems = JSON.parse(localStorage.getItem('guest_cart_items') || '[]');
      const idx = guestItems.findIndex(i => i.id === itemId);
      if (idx > -1) {
        guestItems[idx].qty = quantity;
        localStorage.setItem('guest_cart_items', JSON.stringify(guestItems));
        set({ cartItems: guestItems });
      }
      return true;
    }
  },

  // Remove item from cart
  removeFromCart: async (itemId) => {
    const isAuthed = !!localStorage.getItem('token');
    if (isAuthed) {
      try {
        await api.delete(`/cart/${itemId}`);
        await get().fetchCart(true); // fetch silently to prevent layout flashing
        return true;
      } catch (err) {
        console.error('Remove from cart failed:', err);
        const message = err.response?.data?.message || 'Failed to remove item';
        set({ error: message });
        throw err;
      }
    } else {
      // Guest: Remove from localStorage
      const guestItems = JSON.parse(localStorage.getItem('guest_cart_items') || '[]');
      const filtered = guestItems.filter(i => i.id !== itemId);
      localStorage.setItem('guest_cart_items', JSON.stringify(filtered));
      set({ cartItems: filtered });
      return true;
    }
  },

  // Clear local state
  clearCart: () => {
    set({ cartItems: [], error: null });
    localStorage.removeItem('guest_cart_items');
  },

  getTotalQuantity: () => {
    return get().cartItems.reduce((sum, item) => sum + (item.qty || 0), 0);
  },
}));