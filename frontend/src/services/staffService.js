import api from './api';

export const staffService = {
  // Staff dashboard metrics & current active requests
  getDashboard: async () => {
    const res = await api.get('/staff/dashboard');
    return res.data;
  },

  // Live request queue with filters (all, waiting, active, my_assigned, completed)
  getRequests: async (params = {}) => {
    const res = await api.get('/staff/requests', { params });
    return res.data;
  },

  // Accept customer request
  acceptRequest: async (requestId) => {
    const res = await api.post(`/staff/requests/${requestId}/accept`);
    return res.data;
  },

  // Mark product found on physical shelf
  markFound: async (requestId, notes = '') => {
    const res = await api.post(`/staff/requests/${requestId}/found`, { notes });
    return res.data;
  },

  // Complete customer assistance
  completeRequest: async (requestId, notes = '') => {
    const res = await api.post(`/staff/requests/${requestId}/complete`, { notes });
    return res.data;
  },

  // Get physical location breadcrumb & visual map coordinates
  getProductLocation: async (productId) => {
    const res = await api.get(`/staff/products/${productId}/location`);
    return res.data;
  },

  // Barcode / SKU scan
  scanBarcode: async (code) => {
    const res = await api.get('/staff/scan', { params: { code } });
    return res.data;
  },

  // Update staff status (online, busy, on_break, offline)
  updateStatus: async (status) => {
    const res = await api.post('/staff/status', { status });
    return res.data;
  },
};
