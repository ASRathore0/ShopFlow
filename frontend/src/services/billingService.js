import api from './api';

export const billingService = {
  getStatus: async (role = 'admin') => {
    const prefix = role === 'staff' ? '/staff' : '/admin';
    const res = await api.get(`${prefix}/billing/status`);
    return res.data;
  },

  getProducts: async (search = '', role = 'admin') => {
    const prefix = role === 'staff' ? '/staff' : '/admin';
    const res = await api.get(`${prefix}/billing/products`, { params: { search } });
    return res.data;
  },

  createBill: async (billData, role = 'admin') => {
    const prefix = role === 'staff' ? '/staff' : '/admin';
    const res = await api.post(`${prefix}/billing/create`, billData);
    return res.data;
  },

  getInvoices: async (params = {}, role = 'admin') => {
    const prefix = role === 'staff' ? '/staff' : '/admin';
    const res = await api.get(`${prefix}/billing/invoices`, { params });
    return res.data;
  },

  getInvoice: async (id, role = 'admin') => {
    const prefix = role === 'staff' ? '/staff' : '/admin';
    const res = await api.get(`${prefix}/billing/invoices/${id}`);
    return res.data;
  },

  sendWhatsApp: async (invoiceId, phone = null, role = 'admin') => {
    const prefix = role === 'staff' ? '/staff' : '/admin';
    const res = await api.post(`${prefix}/billing/invoices/${invoiceId}/send-whatsapp`, { phone });
    return res.data;
  },

  resetBillingData: async (role = 'admin') => {
    const prefix = role === 'staff' ? '/staff' : '/admin';
    const res = await api.post(`${prefix}/billing/reset`);
    return res.data;
  },

  // Public Digital Bill Receipt retrieval for customers
  getPublicBill: async (identifier, shopSlug = '') => {
    const res = await api.get(`/public/billing/bill/${identifier}`, {
      params: shopSlug ? { shop: shopSlug } : {},
    });
    return res.data;
  },

  // Direct Soundbox Sync APIs
  getSoundboxDevices: async (role = 'admin') => {
    const prefix = role === 'staff' ? '/staff' : '/admin';
    const res = await api.get(`${prefix}/billing/soundbox/devices`);
    return res.data;
  },

  createSoundboxDevice: async (data, role = 'admin') => {
    const prefix = role === 'staff' ? '/staff' : '/admin';
    const res = await api.post(`${prefix}/billing/soundbox/devices`, data);
    return res.data;
  },

  updateSoundboxDevice: async (id, data, role = 'admin') => {
    const prefix = role === 'staff' ? '/staff' : '/admin';
    const res = await api.put(`${prefix}/billing/soundbox/devices/${id}`, data);
    return res.data;
  },

  deleteSoundboxDevice: async (id, role = 'admin') => {
    const prefix = role === 'staff' ? '/staff' : '/admin';
    const res = await api.delete(`${prefix}/billing/soundbox/devices/${id}`);
    return res.data;
  },

  simulatePayment: async (data, role = 'admin') => {
    const prefix = role === 'staff' ? '/staff' : '/admin';
    const res = await api.post(`${prefix}/billing/soundbox/simulate`, data);
    return res.data;
  },

  simulateSoundboxPayment: async (data, role = 'admin') => {
    const prefix = role === 'staff' ? '/staff' : '/admin';
    const res = await api.post(`${prefix}/billing/soundbox/simulate`, data);
    return res.data;
  },

  pollSoundboxStatus: async (params = {}, role = 'admin') => {
    const prefix = role === 'staff' ? '/staff' : '/admin';
    const res = await api.get(`${prefix}/billing/soundbox/poll-status`, { params });
    return res.data;
  },

  getSoundboxTransactions: async (params = {}, role = 'admin') => {
    const prefix = role === 'staff' ? '/staff' : '/admin';
    const res = await api.get(`${prefix}/billing/soundbox/transactions`, { params });
    return res.data;
  },

  getSoundboxReconciliation: async (params = {}, role = 'admin') => {
    const prefix = role === 'staff' ? '/staff' : '/admin';
    const res = await api.get(`${prefix}/billing/soundbox/reconciliation`, { params });
    return res.data;
  },
};
