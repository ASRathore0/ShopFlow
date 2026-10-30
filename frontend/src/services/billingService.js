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
};

