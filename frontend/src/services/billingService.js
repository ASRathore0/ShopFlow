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

  searchCustomers: async (query = '', role = 'admin') => {
    const prefix = role === 'staff' ? '/staff' : '/admin';
    const res = await api.get(`${prefix}/billing/customers/search`, { params: { query } });
    return res.data;
  },

  createBill: async (billData, role = 'admin') => {
    const prefix = role === 'staff' ? '/staff' : '/admin';
    const res = await api.post(`${prefix}/billing/create`, billData);
    return res.data;
  },

  updateBill: async (id, billData, role = 'admin') => {
    const prefix = role === 'staff' ? '/staff' : '/admin';
    const res = await api.put(`${prefix}/billing/invoices/${id}`, billData);
    return res.data;
  },

  deleteBill: async (id, role = 'admin') => {
    const prefix = role === 'staff' ? '/staff' : '/admin';
    const res = await api.delete(`${prefix}/billing/invoices/${id}`);
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

  updateQuickTags: async (tags, role = 'admin') => {
    const prefix = role === 'staff' ? '/staff' : '/admin';
    const res = await api.post(`${prefix}/billing/quick-tags`, { tags });
    return res.data;
  },

  updatePricePresets: async (presets, role = 'admin') => {
    const prefix = role === 'staff' ? '/staff' : '/admin';
    const res = await api.post(`${prefix}/billing/price-presets`, { presets });
    return res.data;
  },

  // Due Bills & Payment Settlement
  getDueBills: async (params = {}, role = 'admin') => {
    const prefix = role === 'staff' ? '/staff' : '/admin';
    const res = await api.get(`${prefix}/billing/due-bills`, { params });
    return res.data;
  },

  settleDuePayment: async (id, data, role = 'admin') => {
    const prefix = role === 'staff' ? '/staff' : '/admin';
    const res = await api.post(`${prefix}/billing/invoices/${id}/settle`, data);
    return res.data;
  },

  sendDueReminder: async (id, role = 'admin') => {
    const prefix = role === 'staff' ? '/staff' : '/admin';
    const res = await api.post(`${prefix}/billing/invoices/${id}/send-reminder`);
    return res.data;
  },
};
