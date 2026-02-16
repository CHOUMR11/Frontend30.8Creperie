import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getOrders } from '../../services/api';
import styles from './ListeCommandes.module.css';

// Utility function to format currency as XX.XXX DT
const formatCurrency = (amount) => {
  return `${Number(amount).toFixed(3)} DT`;
};

// Calculate total for an order's items
const calculateOrderTotal = (items) => {
  return items.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 1;
    return sum + price * quantity;
  }, 0);
};

// Group orders by table number
const groupOrdersByTable = (orders) => {
  const grouped = {};
  orders.forEach((order) => {
    const table = order.tableNumber || 'Inconnue';
    if (!grouped[table]) {
      grouped[table] = [];
    }
    grouped[table].push(order);
  });
  return grouped;
};

export default function ListeCommandes() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  // Fetch orders from backend via the centralized api service
  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getOrders();
      const data = response.data;

      // Handle different response formats
      let rawOrders = [];
      if (Array.isArray(data)) {
        rawOrders = data;
      } else if (data && Array.isArray(data.data)) {
        rawOrders = data.data;
      } else if (data && Array.isArray(data.orders)) {
        rawOrders = data.orders;
      }

      // Normalize orders
      const normalized = rawOrders.map((order) => ({
        id: order._id || order.id,
        tableNumber: order.tableNumber,
        createdAt: order.createdAt || order.date || new Date().toISOString(),
        status: order.status || 'pending',
        items: (order.items || []).map((item) => ({
          name: item.menuItem?.name || item.name || 'Article',
          price: item.menuItem?.price || item.price || 0,
          quantity: item.quantity || 1,
        })),
      }));

      // Sort by date, newest first
      normalized.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setOrders(normalized);
    } catch (err) {
      console.error('Erreur chargement commandes:', err);
      setError('Impossible de charger les commandes. Verifiez la connexion au serveur.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const wsUrl =
      import.meta.env.VITE_WS_URL || 'wss://backendmenu-3.onrender.com/ws';

    const connectWebSocket = () => {
      // Clean up any existing connection
      if (wsRef.current) {
        wsRef.current.close();
      }

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[v0] WebSocket connecte');
          setWsConnected(true);
          // Fetch fresh data when WS connects
          fetchOrders();
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('[v0] WS message recu:', message.type);

            if (message.type === 'orders' && Array.isArray(message.data)) {
              // The server pushes updated orders
              const normalized = message.data.map((order) => ({
                id: order._id || order.id,
                tableNumber: order.tableNumber,
                createdAt: order.createdAt || order.date || new Date().toISOString(),
                status: order.status || 'pending',
                items: (order.items || []).map((item) => ({
                  name: item.menuItem?.name || item.name || 'Article',
                  price: item.menuItem?.price || item.price || 0,
                  quantity: item.quantity || 1,
                })),
              }));
              normalized.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
              setOrders(normalized);
            } else if (message.type === 'new_order' || message.type === 'order') {
              // A single new order was received, refetch all
              fetchOrders();
            }
          } catch (parseErr) {
            console.error('[v0] Erreur parsing WS message:', parseErr);
          }
        };

        ws.onclose = () => {
          console.log('[v0] WebSocket ferme, reconnexion dans 5s...');
          setWsConnected(false);
          reconnectTimerRef.current = setTimeout(connectWebSocket, 5000);
        };

        ws.onerror = (err) => {
          console.error('[v0] WebSocket erreur:', err);
          setWsConnected(false);
        };
      } catch (err) {
        console.error('[v0] Erreur creation WebSocket:', err);
        setWsConnected(false);
        reconnectTimerRef.current = setTimeout(connectWebSocket, 5000);
      }
    };

    // Initial fetch + WS connection
    fetchOrders();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [fetchOrders]);

  // Group orders by table
  const groupedOrders = groupOrdersByTable(orders);
  const tableNumbers = Object.keys(groupedOrders).sort(
    (a, b) => Number(a) - Number(b)
  );

  // Calculate grand total
  const grandTotal = orders.reduce((total, order) => {
    return total + calculateOrderTotal(order.items);
  }, 0);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Commandes</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: wsConnected ? '#4caf50' : '#f44336',
            }}
            title={wsConnected ? 'Connecte en temps reel' : 'Deconnecte'}
          />
          <button
            onClick={fetchOrders}
            disabled={isLoading}
            className={styles.actionButton}
            style={{
              backgroundColor: '#0275d8',
              color: 'white',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? 'Chargement...' : 'Actualiser'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && <p className={styles.error}>{error}</p>}

      {/* Stats bar */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{orders.length}</div>
          <div className={styles.statLabel}>Commandes</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{tableNumbers.length}</div>
          <div className={styles.statLabel}>Tables</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{formatCurrency(grandTotal)}</div>
          <div className={styles.statLabel}>Total General</div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && orders.length === 0 && (
        <div className={styles.loadingContainer}>
          <p>Chargement des commandes...</p>
        </div>
      )}

      {/* No orders */}
      {!isLoading && orders.length === 0 && !error && (
        <div className={styles.emptyMessage}>
          <p>Aucune commande pour le moment.</p>
        </div>
      )}

      {/* Orders grouped by table */}
      {tableNumbers.length > 0 && (
        <div className={styles.tablesContainer}>
          {tableNumbers.map((tableNum) => {
            const tableOrders = groupedOrders[tableNum];
            const tableTotal = tableOrders.reduce(
              (sum, order) => sum + calculateOrderTotal(order.items),
              0
            );

            return (
              <div key={tableNum} className={styles.tableGroup}>
                <div className={styles.tableHeader}>
                  Table {tableNum} &mdash; {tableOrders.length} commande
                  {tableOrders.length > 1 ? 's' : ''} &mdash; Total:{' '}
                  {formatCurrency(tableTotal)}
                </div>

                <div className={styles.commandesGrid}>
                  {tableOrders.map((order) => {
                    const orderTotal = calculateOrderTotal(order.items);
                    return (
                      <div key={order.id} className={styles.commandeCard}>
                        <div className={styles.invoiceHeader}>
                          <span className={styles.invoiceTitle}>
                            Commande
                          </span>
                          <span style={{ fontSize: '0.85rem', color: '#777' }}>
                            {new Date(order.createdAt).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div className={styles.itemsHeader}>
                          <span>Article</span>
                          <span>Qte</span>
                          <span>Prix</span>
                          <span>Sous-total</span>
                        </div>

                        <div className={styles.itemsContainer}>
                          {order.items.map((item, idx) => (
                            <div key={idx} className={styles.itemRow}>
                              <span>{item.name}</span>
                              <span>{item.quantity}</span>
                              <span>{formatCurrency(item.price)}</span>
                              <span>
                                {formatCurrency(item.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className={styles.invoiceSummary}>
                          <div className={styles.summaryRowTotal}>
                            Total: {formatCurrency(orderTotal)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
