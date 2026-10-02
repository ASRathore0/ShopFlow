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
  createShop: async (data) => {
    const res = await api.post('/super-admin/shops', data);
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
