import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import styles from './ListeCommandes.module.css';
import {
  FaSort, FaFilter, FaFileExport, FaTrash, FaEdit, FaSync,
  FaTable, FaCalendarAlt, FaSearch, FaInfoCircle, FaReceipt,
  FaChevronDown, FaChevronUp, FaStore, FaUser, FaMoneyBillWave,
  FaPrint, FaCalculator
} from 'react-icons/fa';

// Utility function to calculate total from items
const calculateCommandTotal = (items) => {
  return items.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 0;
    return sum + price * quantity;
  }, 0);
};

// Utility function to format currency as XX.XXX DT
const formatCurrency = (amount) => {
  return `${Number(amount).toFixed(3)} DT`;
};

// Notification component
const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${styles.notification} ${type === 'error' ? styles.notificationError : styles.notificationSuccess}`}>
      {message}
    </div>
  );
};
Notification.propTypes = {
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['success', 'error']).isRequired,
    onClose: PropTypes.func.isRequired,
};


// Custom hook for managing bills from the backend
const useBills = (showNotification) => {
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wsError, setWsError] = useState(null);

  // Validate bill structure
  const validateBill = (bill) => {
    return bill && bill.id && Array.isArray(bill.orders) && bill.tableNumber;
  };

  // Fetch bills from backend
  const fetchBills = useCallback(async () => {
    try {
      setIsLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) {
          throw new Error("VITE_API_URL is not defined");
      }
      const response = await fetch(`${apiUrl}/api/orders`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const orders = await response.json();
      const transformedData = orders.map(order => ({
        id: order._id.toString(),
        tableNumber: order.tableNumber,
        orders: [{
          id: order._id.toString(),
          date: order.createdAt,
          items: order.items.map(item => ({
            name: item.menuItem ? item.menuItem.name : 'Article supprimé',
            price: item.menuItem ? item.menuItem.price : 0,
            quantity: item.quantity
          })),
          totalPrice: calculateCommandTotal(order.items.map(item => ({...item, price: item.menuItem ? item.menuItem.price : 0})))
        }],
        totalBillAmount: calculateCommandTotal(order.items.map(item => ({...item, price: item.menuItem ? item.menuItem.price : 0})))
      }));
      
      const validBills = transformedData.filter(validateBill);
      setBills(validBills);
      setError(null);
      return validBills;
    } catch (err) {
      console.error('Erreur lors du chargement des factures:', err);
      setError('Erreur lors du chargement des factures depuis le backend.');
      showNotification('Impossible de charger les factures. Vérifiez la console pour les erreurs.', 'error');
      setBills([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL;
    if (!wsUrl) {
        console.error("VITE_WS_URL is not defined");
        setWsError("L'URL WebSocket n'est pas configurée.");
        showNotification("L'URL WebSocket n'est pas configurée.", 'error');
        return;
    }

    let ws;
    const connectWebSocket = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Connexion WebSocket établie.');
        setWsError(null);
        showNotification('Connecté au serveur en temps réel.', 'success');
        fetchBills(); // Fetch initial data on connect
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'orders' && Array.isArray(message.data)) {
            const updatedBills = message.data.filter(validateBill);
            setBills(updatedBills);
            showNotification('Liste des commandes mise à jour.', 'success');
          } else if (message.type === 'error') {
            console.error('Erreur WebSocket reçue:', message.message);
            setWsError(message.message);
            showNotification(message.message, 'error');
          }
        } catch (error) {
          console.error('Erreur de traitement du message WebSocket:', error);
          setWsError('Erreur de données WebSocket.');
        }
      };

      ws.onclose = () => {
        console.log('Connexion WebSocket fermée. Tentative de reconnexion...');
        showNotification('Connexion temps réel perdue. Tentative de reconnexion...', 'error');
        setTimeout(connectWebSocket, 5000);
      };

      ws.onerror = (error) => {
        console.error('Erreur de connexion WebSocket:', error);
        setWsError('Erreur de connexion WebSocket.');
        showNotification('Erreur de connexion WebSocket.', 'error');
      };
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [fetchBills, showNotification]);

  return { bills, isLoading, error, wsError, fetchBills };
};

// Main Component
export default function ListeCommandes() {
  const [notification, setNotification] = useState(null);
  const showNotification = useCallback((message, type) => {
    setNotification({ message, type });
  }, []);

  const { bills, isLoading, error, wsError, fetchBills } = useBills(showNotification);

  // Le reste du composant (Filters, Actions, Stats, etc.) reste identique
  // ...

  return (
    <div className={styles.container}>
        {notification && (
            <Notification 
                message={notification.message} 
                type={notification.type} 
                onClose={() => setNotification(null)} 
            />
        )}
        <h1>Liste des Commandes</h1>
        {isLoading && <p>Chargement des commandes...</p>}
        {error && <p className={styles.error}>{error}</p>}
        {wsError && <p className={styles.error}>Erreur WebSocket: {wsError}</p>}
        
        <button onClick={fetchBills} disabled={isLoading}>
            <FaSync /> Actualiser
        </button>

        <div className={styles.billsGrid}>
            {bills.length > 0 ? (
                bills.map(bill => (
                    <div key={bill.id} className={styles.billCard}>
                        <h3>Table {bill.tableNumber}</h3>
                        <p>Total: {formatCurrency(bill.totalBillAmount)}</p>
                        <div>
                            {bill.orders.map(order => (
                                <div key={order.id}>
                                    <h4>Commande du {new Date(order.date).toLocaleTimeString()}</h4>
                                    <ul>
                                        {order.items.map((item, index) => (
                                            <li key={index}>{item.quantity}x {item.name} - {formatCurrency(item.price)}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                !isLoading && <p>Aucune commande à afficher.</p>
            )}
        </div>
    </div>
  );
}
