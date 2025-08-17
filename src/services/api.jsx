// src/services/api.jsx
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://backendmenu-3.onrender.com' 
  // fallback in case VITE_API_URL is not set
});

// ---------- MENU ----------
export const getMenu = () => api.get('/api/menu');
export const addMenuItem = (item) => api.post('/api/menu', item);
export const updateMenuItem = (id, item) => api.put(`/api/menu/${id}`, item);
export const deleteMenuItem = (id) => api.delete(`/api/menu/${id}`);

// ---------- ORDERS ----------
export const postOrder = (order) => api.post('/api/orders', order);
export const getOrders = () => api.get('/api/orders');

export const updateOrderStatus = (orderId, status) =>
  api.put(`/api/orders/${orderId}/status`, { status });

export const deleteOrder = (orderId) => api.delete(`/api/orders/${orderId}`);

export default api;
