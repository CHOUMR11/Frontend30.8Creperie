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

// Custom hook for managing bills
const useBills = (storageKey, showNotification) => {
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wsError, setWsError] = useState(null);

  // Validate bill structure
  const validateBill = (bill) => {
    return bill && bill.id && Array.isArray(bill.orders) && bill.tableNumber;
  };

  // Fetch bills from backend or localStorage
  const fetchBills = useCallback(async () => {
    try {
      setIsLoading(true);
      let data;
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/orders`);
        if (response.ok) {
          const orders = await response.json();
          // Transformer orders en bills
          data = orders.map(order => ({
            id: order._id.toString(),
            tableNumber: order.tableNumber,
            orders: [{
              id: order._id.toString(),
              date: order.createdAt,
              items: order.items.map(item => ({
                name: item.menuItem.name,
                price: item.menuItem.price,
                quantity: item.quantity
              })),
              totalPrice: order.items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0)
            }],
            totalBillAmount: order.items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0)
          }));
          console.log('Orders fetched from backend and transformed to bills:', data);
          localStorage.setItem(storageKey, JSON.stringify(data)); // Sync localStorage
        } else {
          console.warn(`Backend fetch failed: ${response.status} ${response.statusText}`);
          throw new Error('Backend fetch failed');
        }
      } catch (backendError) {
        console.warn('Failed to fetch orders from backend, using localStorage:', backendError.message);
        const rawData = localStorage.getItem(storageKey);
        data = rawData ? JSON.parse(rawData) : [];
      }
      // Validate and normalize bills
      data = data
        .filter(validateBill)
        .map(bill => ({
          ...bill,
          orders: bill.orders || [],
          totalBillAmount: bill.totalBillAmount || bill.orders.reduce((sum, order) => sum + (order.totalPrice || calculateCommandTotal(order.items)), 0)
        }));
      console.log('Parsed and validated bills:', data);
      setBills(data);
      setError(null);
      return data;
    } catch (err) {
      console.error('Error loading bills:', err.message, err.stack);
      setError('Erreur lors du chargement des factures. Les données peuvent être corrompues.');
      localStorage.removeItem(storageKey);
      setBills([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [storageKey]);

  // Sync bills periodically
  const syncBills = useCallback(async () => {
    const data = await fetchBills();
    console.log('Bills synced:', data);
    return data;
  }, [fetchBills]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    let ws;
    const connectWebSocket = () => {
      ws = new WebSocket(process.env.REACT_APP_WS_URL);
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'orders' && Array.isArray(message.data)) {
            // Les données sont déjà au format bills
            const updatedBills = message.data.filter(validateBill);
            console.log('WebSocket bills received:', updatedBills);
            setBills(updatedBills);
            localStorage.setItem(storageKey, JSON.stringify(updatedBills));
            showNotification('Factures mises à jour en temps réel', 'success');
          } else if (message.type === 'error') {
            console.error('WebSocket error message:', message.message);
            setWsError(message.message);
            showNotification(message.message, 'error');
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
          setWsError('Erreur lors de la réception des données WebSocket');
          showNotification('Erreur lors de la réception des données WebSocket', 'error');
        }
      };

      ws.onclose = () => {
        console.log('Connexion WebSocket fermée, tentative de reconnexion...');
        setTimeout(connectWebSocket, 5000); // Reconnect after 5 seconds
      };

      ws.onerror = (error) => {
        console.error('Erreur WebSocket:', error);
        setWsError('Erreur de connexion WebSocket');
        showNotification('Erreur de connexion WebSocket', 'error');
      };
    };

    connectWebSocket();

    return () => ws && ws.close();
  }, [storageKey, showNotification]);

  return { bills, isLoading, error, wsError, fetchBills, syncBills };
};

// Filters component
const Filters = ({ dateFilter, setDateFilter, tableFilter, setTableFilter, sortBy, setSortBy }) => (
  <div className={styles.filters}>
    <div className={styles.filterGroup}>
      <label htmlFor="dateFilter"><FaCalendarAlt /> Date</label>
      <input
        id="dateFilter"
        type="date"
        value={dateFilter}
        onChange={(e) => setDateFilter(e.target.value)}
        className={styles.filterInput}
      />
    </div>
    <div className={styles.filterGroup}>
      <label htmlFor="tableFilter"><FaSearch /> Table</label>
      <input
        id="tableFilter"
        type="text"
        placeholder="N° Table..."
        value={tableFilter}
        onChange={(e) => setTableFilter(e.target.value)}
        className={styles.filterInput}
      />
    </div>
    <div className={styles.filterGroup}>
      <label htmlFor="sortBy"><FaSort /> Trier par</label>
      <select
        id="sortBy"
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className={styles.filterSelect}
      >
        <option value="date-desc">Date (récent)</option>
        <option value="date-asc">Date (ancien)</option>
        <option value="total-desc">Total (↓)</option>
        <option value="total-asc">Total (↑)</option>
      </select>
    </div>
  </div>
);

// Actions component
const Actions = ({ calculateDailyTotal, groupByTable, exportDailyTotal, exportDailyTotalPDF, printDailyTotal, activeView, syncBills, showNotification }) => (
  <div className={styles.actions}>
    <button onClick={calculateDailyTotal} className={`${styles.actionButton} ${styles.calculateButton}`}>
      <FaFilter /> Total Journalier
    </button>
    <button onClick={groupByTable} className={`${styles.actionButton} ${styles.compareButton}`}>
      <FaTable /> Par Table
    </button>
    <button onClick={exportDailyTotal} className={`${styles.actionButton} ${styles.exportButton}`} disabled={activeView !== 'dailyTotal'}>
      <FaFileExport /> Exporter JSON
    </button>
    <button onClick={exportDailyTotalPDF} className={`${styles.actionButton} ${styles.exportButton}`} disabled={activeView !== 'dailyTotal'}>
      <FaFileExport /> Exporter PDF
    </button>
    <button onClick={printDailyTotal} className={`${styles.actionButton} ${styles.printButton}`} disabled={activeView !== 'dailyTotal'}>
      <FaPrint /> Imprimer Total
    </button>
    <button 
      onClick={async () => {
        const data = await syncBills();
        showNotification(`Factures actualisées : ${data.length} facture(s) chargée(s)`, 'success');
        if (activeView === 'dailyTotal') {
          calculateDailyTotal();
        }
      }} 
      className={`${styles.actionButton} ${styles.refreshButton}`}
    >
      <FaSync /> Actualiser
    </button>
  </div>
);

// Stats component
const Stats = ({ stats, currency, onShowGrandTotal }) => (
  <div className={styles.statsContainer}>
    <div className={styles.statCard}>
      <div className={styles.statValue}>{stats.totalBills}</div>
      <div className={styles.statLabel}>Factures</div>
    </div>
    <div className={styles.statCard}>
      <div className={styles.statValue}>{stats.tablesServed}</div>
      <div className={styles.statLabel}>Tables</div>
    </div>
    <div className={`${styles.statCard} ${styles.statCardTotal}`} onClick={onShowGrandTotal}>
      <div className={styles.statValue}>{formatCurrency(stats.totalRevenue)}</div>
      <div className={styles.statLabel}>Revenu Total <FaCalculator /></div>
    </div>
  </div>
);

// Grand Total Section component
const GrandTotalSection = ({ stats, currency, onClose }) => (
  <div className={styles.grandTotalSection}>
    <div className={styles.grandTotalHeader}>
      <h2>Total Général</h2>
      <button className={styles.closeButton} onClick={onClose}>×</button>
    </div>
    <div className={styles.grandTotalContent}>
      <div className={styles.grandTotalBox}>
        <div className={styles.grandTotalLabel}>Montant Total:</div>
        <div className={styles.grandTotalAmount}>{formatCurrency(stats.totalRevenue)}</div>
      </div>
      <div className={styles.grandTotalDetails}>
        <div className={styles.detailItem}>
          <span>Nombre de factures:</span>
          <span>{stats.totalBills}</span>
        </div>
        <div className={styles.detailItem}>
          <span>Tables servies:</span>
          <span>{stats.tablesServed}</span>
        </div>
        <div className={styles.detailItem}>
          <span>Moyenne par facture:</span>
          <span>{formatCurrency(stats.totalRevenue / stats.totalBills || 0)}</span>
        </div>
        <div className={styles.detailItem}>
          <span>Moyenne par table:</span>
          <span>{formatCurrency(stats.totalRevenue / stats.tablesServed || 0)}</span>
        </div>
      </div>
    </div>
  </div>
);

// BillCard component
const BillCard = ({ bill, currency, onEdit }) => {
  const printInvoice = useCallback(() => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Facture #${bill.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .invoice-container { max-width: 800px; margin: auto; padding: 20px; border: 1px solid #ccc; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .restaurant-info { text-align: left; }
          .restaurant-name { font-size: 24px; font-weight: bold; }
          .restaurant-details { font-size: 12px; }
          .invoice-title { font-size: 28px; font-weight: bold; }
          .invoice-info { display: flex; justify-content: space-between; margin: 20px 0; }
          .info-row { margin: 5px 0; }
          .info-label { font-weight: bold; margin-right: 5px; }
          .info-value-highlight { font-weight: bold; color: #d9534f; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          .order-header { background-color: #e9ecef; font-weight: bold; }
          .summary { text-align: right; margin-top: 20px; }
          .summary-row { margin: 5px 0; }
          .total-row { font-weight: bold; font-size: 18px; border-top: 2px solid #000; padding-top: 10px; }
          .footer { text-align: center; margin-top: 20px; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div class="restaurant-info">
              <div class="restaurant-name">Crêperie 30.8</div>
              <div class="restaurant-details">123 Avenue des Gastronomes, 75001 Paris<br>Tél: 00216 23 587 726 • creperie30.8@gamail.com</div>
            </div>
            <div class="invoice-title">FACTURE</div>
          </div>
          <div class="invoice-info">
            <div>
              <div class="info-row"><span class="info-label">N° Facture:</span><span class="info-value">${bill.id}</span></div>
              <div class="info-row"><span class="info-label">Date:</span><span class="info-value">${new Date(bill.orders[0]?.date || Date.now()).toLocaleString()}</span></div>
            </div>
            <div>
              <div class="info-row"><span class="info-label">Table:</span><span class="info-value-highlight">${bill.tableNumber}</span></div>
            </div>
          </div>
          <table>
            <thead><tr><th>Commande</th><th>Article</th><th>Qté</th><th>Prix unitaire</th><th>Total</th></tr></thead>
            <tbody>${bill.orders.map(order => `
              <tr class="order-header"><td colspan="5">Commande #${order.id.slice(0, 8)} (${new Date(order.date).toLocaleString()})</td></tr>
              ${order.items.map(item => `
                <tr><td></td><td>${item.name}</td><td>${item.quantity}</td><td>${formatCurrency(item.price)}</td><td>${formatCurrency(item.price * item.quantity)}</td></tr>
              `).join('')}
            `).join('')}</tbody>
          </table>
          <div class="summary">
            <div class="summary-row"><span>Sous-total:</span>${formatCurrency(bill.totalBillAmount)}</div>
            <div class="summary-row"><span>TVA (10%):</span>${formatCurrency(bill.totalBillAmount * 0.1)}</div>
            <div class="summary-row total-row"><span>TOTAL:</span>${formatCurrency(bill.totalBillAmount * 1.1)}</div>
          </div>
          <div class="footer"><p>Merci pour votre visite ! À bientôt</p></div>
        </div>
        <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 1000); };</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }, [bill, currency]);

  return (
    <div className={styles.commandeCard}>
      <div className={styles.invoiceHeader}>
        <div className={styles.invoiceLogo}><FaStore /> Crêperie 30.8</div>
        <div className={styles.invoiceTitle}><FaReceipt /> FACTURE #{bill.id.slice(0, 8)}</div>
      </div>
      <div className={styles.invoiceInfo}>
        <div><span>Table:</span> <span className={styles.infoValueHighlight}>{bill.tableNumber}</span></div>
        <div><span>Date:</span> {new Date(bill.orders[0]?.date || Date.now()).toLocaleDateString()}</div>
      </div>
      <div className={styles.itemsHeader}>
        <div>Commande</div><div>Article</div><div>Qté</div><div>Prix</div><div>Total</div>
      </div>
      <div className={styles.itemsContainer}>
        {bill.orders.map(order => (
          <div key={order.id} className={styles.orderSection}>
            <div className={styles.orderHeader}>
              Commande #{order.id.slice(0, 8)} ({new Date(order.date).toLocaleString()})
              {onEdit && (
                <button 
                  onClick={() => onEdit(order)} 
                  className={styles.cardButton} 
                  aria-label={`Modifier commande #${order.id}`}
                >
                  <FaEdit /> Modifier
                </button>
              )}
            </div>
            {order.items.map((item, index) => (
              <div key={index} className={styles.itemRow}>
                <div></div>
                <div>{item.name}</div>
                <div>{item.quantity}</div>
                <div>{formatCurrency(item.price)}</div>
                <div>{formatCurrency(item.price * item.quantity)}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className={styles.totalSection}>
        <div className={styles.totalRow}>
          <span>Sous-total:</span>
          <span>{formatCurrency(bill.totalBillAmount)}</span>
        </div>
        <div className={styles.totalRow}>
          <span>TVA (10%):</span>
          <span>{formatCurrency(bill.totalBillAmount * 0.1)}</span>
        </div>
        <div className={`${styles.totalRow} ${styles.grandTotal}`}> 
          <span>TOTAL:</span>
          <span>{formatCurrency(bill.totalBillAmount * 1.1)}</span>
        </div>
      </div>
      <div className={styles.cardActions}>
        <button onClick={printInvoice} className={styles.printButton}>
          <FaPrint /> Imprimer
        </button>
        {onEdit && (
          <button 
            onClick={() => onEdit(bill)} 
            className={styles.cardButton} 
            aria-label={`Modifier facture #${bill.id}`}
          >
            <FaEdit /> Modifier Facture
          </button>
        )}
      </div>
    </div>
  );
};

BillCard.propTypes = {
  bill: PropTypes.object.isRequired,
  currency: PropTypes.string.isRequired,
  onEdit: PropTypes.func,
};

// Main component
const ListeCommandes = () => {
  const [notification, setNotification] = useState(null);
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
  }, []);

  const { bills, isLoading, error, wsError, fetchBills, syncBills } = useBills('creperieBills', showNotification);
  const [dateFilter, setDateFilter] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [activeView, setActiveView] = useState('allBills'); // 'allBills', 'dailyTotal', 'tableSummary'
  const [dailyTotal, setDailyTotal] = useState(0);
  const [tableSummary, setTableSummary] = useState({});
  const [showGrandTotal, setShowGrandTotal] = useState(false);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const filteredBills = useMemo(() => {
    let filtered = bills;

    if (dateFilter) {
      filtered = filtered.filter(bill => {
        const billDate = new Date(bill.orders[0]?.date || bill.createdAt).toISOString().split('T')[0];
        return billDate === dateFilter;
      });
    }

    if (tableFilter) {
      filtered = filtered.filter(bill =>
        String(bill.tableNumber).includes(tableFilter)
      );
    }

    // Sort bills
    filtered.sort((a, b) => {
      const dateA = new Date(a.orders[0]?.date || a.createdAt);
      const dateB = new Date(b.orders[0]?.date || b.createdAt);
      const totalA = a.totalBillAmount;
      const totalB = b.totalBillAmount;

      switch (sortBy) {
        case 'date-desc':
          return dateB - dateA;
        case 'date-asc':
          return dateA - dateB;
        case 'total-desc':
          return totalB - totalA;
        case 'total-asc':
          return totalA - totalB;
        default:
          return 0;
      }
    });

    return filtered;
  }, [bills, dateFilter, tableFilter, sortBy]);

  const calculateDailyTotal = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const total = bills.reduce((sum, bill) => {
      const billDate = new Date(bill.orders[0]?.date || bill.createdAt).toISOString().split('T')[0];
      return billDate === today ? sum + bill.totalBillAmount : sum;
    }, 0);
    setDailyTotal(total);
    setActiveView('dailyTotal');
    showNotification(`Total journalier calculé : ${formatCurrency(total)}`, 'info');
  }, [bills, showNotification]);

  const groupByTable = useCallback(() => {
    const summary = bills.reduce((acc, bill) => {
      acc[bill.tableNumber] = (acc[bill.tableNumber] || 0) + bill.totalBillAmount;
      return acc;
    }, {});
    setTableSummary(summary);
    setActiveView('tableSummary');
    showNotification('Résumé par table généré', 'info');
  }, [bills, showNotification]);

  const exportData = useCallback((data, filename, type) => {
    const blob = new Blob([data], { type: `application/${type}` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification(`Données exportées vers ${filename}`, 'success');
  }, [showNotification]);

  const exportDailyTotal = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const dailyBills = bills.filter(bill => new Date(bill.orders[0]?.date || bill.createdAt).toISOString().split('T')[0] === today);
    exportData(JSON.stringify(dailyBills, null, 2), `daily_total_${today}.json`, 'json');
  }, [bills, exportData]);

  const exportDailyTotalPDF = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const dailyBills = bills.filter(bill => new Date(bill.orders[0]?.date || bill.createdAt).toISOString().split('T')[0] === today);

    const doc = new jsPDF();
    doc.text(`Rapport Journalier - ${today}`, 14, 20);
    
    const tableColumn = ["Facture ID", "Table", "Montant Total"];
    const tableRows = [];

    dailyBills.forEach(bill => {
      tableRows.push([
        bill.id.slice(0, 8),
        bill.tableNumber,
        formatCurrency(bill.totalBillAmount)
      ]);
    });

    doc.autoTable(tableColumn, tableRows, { startY: 30 });
    doc.text(`Total des ventes du jour: ${formatCurrency(dailyTotal)}`, 14, doc.autoTable.previous.finalY + 10);
    doc.save(`daily_report_${today}.pdf`);
    showNotification(`Rapport PDF exporté : daily_report_${today}.pdf`, 'success');
  }, [bills, dailyTotal, showNotification, exportData]);

  const printDailyTotal = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const printContent = `
      <h1>Rapport Journalier - ${today}</h1>
      <p>Total des ventes du jour: ${formatCurrency(dailyTotal)}</p>
      <h2>Détail des factures:</h2>
      ${bills.filter(bill => new Date(bill.orders[0]?.date || bill.createdAt).toISOString().split('T')[0] === today).map(bill => `
        <div>
          <h3>Facture #${bill.id.slice(0, 8)} - Table ${bill.tableNumber}</h3>
          <p>Montant: ${formatCurrency(bill.totalBillAmount)}</p>
        </div>
      `).join('')}
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
    showNotification('Impression du rapport journalier', 'info');
  }, [bills, dailyTotal, showNotification]);

  const totalRevenue = useMemo(() => {
    return bills.reduce((sum, bill) => sum + bill.totalBillAmount, 0);
  }, [bills]);

  const totalTablesServed = useMemo(() => {
    const uniqueTables = new Set(bills.map(bill => bill.tableNumber));
    return uniqueTables.size;
  }, [bills]);

  const stats = useMemo(() => ({
    totalBills: bills.length,
    totalRevenue: totalRevenue,
    tablesServed: totalTablesServed,
  }), [bills.length, totalRevenue, totalTablesServed]);

  return (
    <div className={styles.listeCommandesContainer}>
      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}
      <h1>Historique des Factures</h1>
      {isLoading && <p>Chargement des factures...</p>}
      {error && <p className={styles.error}>{error}</p>}
      {wsError && <p className={styles.error}>{wsError}</p>}

      <Stats stats={stats} currency="DT" onShowGrandTotal={() => setShowGrandTotal(true)} />

      {showGrandTotal && (
        <GrandTotalSection 
          stats={stats} 
          currency="DT" 
          onClose={() => setShowGrandTotal(false)} 
        />
      )}

      <Filters 
        dateFilter={dateFilter} 
        setDateFilter={setDateFilter} 
        tableFilter={tableFilter} 
        setTableFilter={setTableFilter} 
        sortBy={sortBy} 
        setSortBy={setSortBy} 
      />

      <Actions 
        calculateDailyTotal={calculateDailyTotal} 
        groupByTable={groupByTable} 
        exportDailyTotal={exportDailyTotal} 
        exportDailyTotalPDF={exportDailyTotalPDF}
        printDailyTotal={printDailyTotal}
        activeView={activeView}
        syncBills={syncBills}
        showNotification={showNotification}
      />

      <div className={styles.billList}>
        <h2>
          {activeView === 'allBills' && `Toutes les Factures (${filteredBills.length})`}
          {activeView === 'dailyTotal' && `Total Journalier du ${new Date().toLocaleDateString()} : ${formatCurrency(dailyTotal)}`}
          {activeView === 'tableSummary' && 'Résumé par Table'}
        </h2>

        {activeView === 'allBills' && filteredBills.length === 0 && <p>Aucune facture trouvée</p>}
        {activeView === 'dailyTotal' && filteredBills.length === 0 && <p>Aucune facture pour aujourd'hui</p>}
        {activeView === 'tableSummary' && Object.keys(tableSummary).length === 0 && <p>Aucun résumé par table</p>}

        {activeView === 'allBills' && filteredBills.map(bill => (
          <BillCard key={bill.id} bill={bill} currency="DT" />
        ))}

        {activeView === 'tableSummary' && Object.entries(tableSummary).map(([table, total]) => (
          <div key={table} className={styles.tableSummaryCard}>
            <h3>Table {table}</h3>
            <p>Total: {formatCurrency(total)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListeCommandes;


