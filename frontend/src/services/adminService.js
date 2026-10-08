import api from './api';

export const adminService = {
  // Dashboard metrics, charts & smart inventory insights
  getDashboard: async () => {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },

  // Products CRUD
  getProducts: async (params = {}) => {
    const res = await api.get('/admin/products', { params });
    return res.data;
  },
  getProduct: async (id) => {
    const res = await api.get(`/admin/products/${id}`);
    return res.data;
  },
  createProduct: async (data) => {
    const res = await api.post('/admin/products', data);
    return res.data;
  },
  uploadProductImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await api.post('/admin/products/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  updateProduct: async (id, data) => {
    const res = await api.put(`/admin/products/${id}`, data);
    return res.data;
  },
  deleteProduct: async (id) => {
    const res = await api.delete(`/admin/products/${id}`);
    return res.data;
  },

  // Categories CRUD
  getCategories: async () => {
    const res = await api.get('/admin/categories');
    return res.data;
  },
  createCategory: async (data) => {
    const res = await api.post('/admin/categories', data);
    return res.data;
  },
  updateCategory: async (id, data) => {
    const res = await api.put(`/admin/categories/${id}`, data);
    return res.data;
  },
  deleteCategory: async (id) => {
    const res = await api.delete(`/admin/categories/${id}`);
    return res.data;
  },

  // Inventory & Stock Adjustment
  getInventory: async (params = {}) => {
    const res = await api.get('/admin/inventory', { params });
    return res.data;
  },
  adjustStock: async (data) => {
    const res = await api.post('/admin/inventory/adjust', data);
    return res.data;
  },

  // Store Locations & Layout Hierarchy
  getLocations: async () => {
    const res = await api.get('/admin/locations');
    return res.data;
  },
  getLocationHierarchy: async () => {
    const res = await api.get('/admin/locations/hierarchy');
    return res.data;
  },
  createLocation: async (data) => {
    const res = await api.post('/admin/locations', data);
    return res.data;
  },
  updateLocation: async (id, data) => {
    const res = await api.put(`/admin/locations/${id}`, data);
    return res.data;
  },
  deleteLocation: async (id) => {
    const res = await api.delete(`/admin/locations/${id}`);
    return res.data;
  },

  // Queue & Customer Requests Management
  getRequests: async (params = {}) => {
    const res = await api.get('/admin/requests', { params });
    return res.data;
  },
  assignStaff: async (requestId, employeeId) => {
    const res = await api.post(`/admin/requests/${requestId}/assign`, { employee_id: employeeId });
    return res.data;
  },
  updatePriority: async (requestId, priority) => {
    const res = await api.post(`/admin/requests/${requestId}/priority`, { priority });
    return res.data;
  },
  updateRequestStatus: async (requestId, status, notes = '') => {
    const res = await api.post(`/admin/requests/${requestId}/status`, { status, notes });
    return res.data;
  },

  // Employees Management
  getEmployees: async () => {
    const res = await api.get('/admin/employees');
    return res.data;
  },
  createEmployee: async (data) => {
    const res = await api.post('/admin/employees', data);
    return res.data;
  },
  updateEmployee: async (id, data) => {
    const res = await api.put(`/admin/employees/${id}`, data);
    return res.data;
  },
  deleteEmployee: async (id) => {
    const res = await api.delete(`/admin/employees/${id}`);
    return res.data;
  },

  // Orders / Reservations
  getOrders: async (params = {}) => {
    const res = await api.get('/admin/orders', { params });
    return res.data;
  },
  updateOrderStatus: async (id, status) => {
    const res = await api.put(`/admin/orders/${id}/status`, { status });
    return res.data;
  },

  // Reports & Analytics
  getReports: async () => {
    const res = await api.get('/admin/reports');
    return res.data;
  },

  // Shop Profile & QR Settings
  getShopSettings: async () => {
    const res = await api.get('/admin/shop');
    return res.data;
  },
  updateShopSettings: async (data) => {
    const res = await api.put('/admin/shop', data);
    return res.data;
  },
};
