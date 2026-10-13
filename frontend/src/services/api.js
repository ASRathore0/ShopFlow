import axios from 'axios';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    // Development mode (Vite dev server usually runs on port 5173)
    if (window.location.port === '5173' || window.location.port === '3000') {
      const host = window.location.hostname || 'localhost';
      return `${window.location.protocol}//${host}:8000/api`;
    }
    // Production / Deployed environment on Hostinger or custom domain
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:8000/api';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('shopflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if invalid
      if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/staff')) {
        localStorage.removeItem('shopflow_token');
        localStorage.removeItem('shopflow_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
