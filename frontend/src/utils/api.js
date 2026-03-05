import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('wms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('wms_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// API functions
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const inventoryAPI = {
  getAll: (params) => api.get('/inventory', { params }),
  stockIn: (data) => api.post('/inventory/stock-in', data),
  stockOut: (data) => api.post('/inventory/stock-out', data),
  getMovements: (params) => api.get('/inventory/movements', { params }),
  getAlerts: () => api.get('/inventory/alerts'),
  resolveAlert: (id) => api.put(`/inventory/alerts/${id}/resolve`),
};

export const suppliersAPI = {
  getAll: () => api.get('/suppliers'),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
};

export const categoriesAPI = {
  getAll: () => api.get('/categories'),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export const reportsAPI = {
  inventory: () => api.get('/reports/inventory'),
  movements: (params) => api.get('/reports/movements', { params }),
  supplierPerformance: () => api.get('/reports/supplier-performance'),
};

export const usersAPI = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
};
