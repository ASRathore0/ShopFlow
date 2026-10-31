import api from './api';

export const superAdminService = {
  getDashboard: async () => {
    const res = await api.get('/super-admin/dashboard');
    return res.data;
  },
  getShops: async () => {
    const res = await api.get('/super-admin/shops');
    return res.data;
  },
  getShop: async (id) => {
    const res = await api.get(`/super-admin/shops/${id}`);
    return res.data;
  },
  createShop: async (data) => {
    const res = await api.post('/super-admin/shops', data);
    return res.data;
  },
  updateShop: async (id, data) => {
    const res = await api.put(`/super-admin/shops/${id}`, data);
    return res.data;
  },
  updatePlan: async (id, planId, status = 'active') => {
    const res = await api.put(`/super-admin/shops/${id}/plan`, { plan_id: planId, status });
    return res.data;
  },
  toggleShopStatus: async (id) => {
    const res = await api.put(`/super-admin/shops/${id}/toggle-status`);
    return res.data;
  },
  toggleShopBilling: async (id) => {
    const res = await api.put(`/super-admin/shops/${id}/toggle-billing`);
    return res.data;
  },
  toggleShopSoundbox: async (id) => {
    const res = await api.put(`/super-admin/shops/${id}/toggle-soundbox`);
    return res.data;
  },
  getWhatsAppConfig: async (shopId) => {
    const res = await api.get(`/super-admin/shops/${shopId}/whatsapp-config`);
    return res.data;
  },
  updateWhatsAppConfig: async (shopId, data) => {
    const res = await api.put(`/super-admin/shops/${shopId}/whatsapp-config`, data);
    return res.data;
  },
  testWhatsAppConfig: async (shopId, data) => {
    const res = await api.post(`/super-admin/shops/${shopId}/whatsapp-test`, data);
    return res.data;
  },
  deleteShop: async (id) => {
    const res = await api.delete(`/super-admin/shops/${id}`);
    return res.data;
  },
  resetOwnerPassword: async (id, newPassword) => {
    const res = await api.post(`/super-admin/shops/${id}/reset-owner-password`, { password: newPassword });
    return res.data;
  },
  getPlans: async () => {
    const res = await api.get('/super-admin/plans');
    return res.data;
  },
  getUsers: async () => {
    const res = await api.get('/super-admin/users');
    return res.data;
  },
};
