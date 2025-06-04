import axios from 'axios';

const api = axios.create({
  // No trailing slash here
  baseURL: 'https://back-end-digi-food-fn5i.vercel.app'
});

export const getMenu = () => api.get('/api/menu');
export const postOrder = (order) => api.post('/api/orders', order);
export const getOrders = () => api.get('/api/orders');
export const updateOrderStatus = (orderId, status) =>
  api.put(`/api/orders/${orderId}`, { status });

export const addMenuItem = (item) => api.post('/api/menu', item);
export const updateMenuItem = (id, item) => api.put(`/api/menu/${id}`, item);
export const deleteMenuItem = (id) => api.delete(`/api/menu/${id}`);

export default api;
