import api from './api';

export const shopService = {
  // Get all active shops (for directory / demo selector)
  getShops: async () => {
    const res = await api.get('/shops');
    return res.data;
  },

  // Get shop details & landing data
  getShop: async (slug) => {
    const res = await api.get(`/shops/${slug}`);
    return res.data;
  },

  // Get categories for shop
  getCategories: async (slug) => {
    const res = await api.get(`/shops/${slug}/categories`);
    return res.data;
  },

  // Browse products with search & filters
  getProducts: async (slug, params = {}) => {
    const res = await api.get(`/shops/${slug}/products`, { params });
    return res.data;
  },

  // Product detail
  getProduct: async (slug, id) => {
    const res = await api.get(`/shops/${slug}/products/${id}`);
    return res.data;
  },

  // Live quick search
  search: async (slug, query) => {
    const res = await api.get(`/shops/${slug}/search`, { params: { q: query } });
    return res.data;
  },

  // Create "Show Me This Product" customer request
  createRequest: async (slug, data) => {
    const res = await api.post(`/shops/${slug}/requests`, data);
    return res.data;
  },

  // Track customer request by REQ-XXXX number
  trackRequest: async (requestNumber) => {
    const res = await api.get(`/requests/track/${requestNumber}`);
    return res.data;
  },

  // Get customer session & active requests
  getSession: async (slug, sessionToken) => {
    const res = await api.get(`/shops/${slug}/session`, { params: { session_token: sessionToken } });
    return res.data;
  },

  // Create store reservation
  createReservation: async (slug, data) => {
    const res = await api.post(`/shops/${slug}/reservations`, data);
    return res.data;
  },
};
