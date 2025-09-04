import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://backendmenu-3.onrender.com'
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

// ---------- WEBSOCKET ----------
let ws = null;
let updateAdminOrders = () => {
  console.warn('updateAdminOrders doit être défini dans le composant ListeCommandes');
};

export const connectWebSocket = () => {
  ws = new WebSocket(import.meta.env.VITE_WS_URL || 'wss://backendmenu-3.onrender.com/ws');

  ws.onopen = () => {
    console.log('Connecté au WebSocket');
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'orders') {
      console.log('Commandes reçues:', message.data);
      updateAdminOrders(message.data);
    } else if (message.type === 'error') {
      console.error('Erreur du serveur:', message.message);
    }
  };

  ws.onerror = (error) => {
    console.error('Erreur WebSocket:', error);
  };

  ws.onclose = () => {
    console.log('Connexion WebSocket fermée, tentative de reconnexion...');
    setTimeout(connectWebSocket, 3000); // Reconnexion après 3 secondes
  };
};

export const setUpdateAdminOrders = (callback) => {
  updateAdminOrders = callback;
};

export const sendOrder = (tableNumber, items) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'order',
      data: {
        tableNumber,
        items
      }
    }));
  } else {
    console.error('WebSocket non connecté');
  }
};

export default api;
