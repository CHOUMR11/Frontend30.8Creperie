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

// Custom hook for managing bills
const useBills = (storageKey) => {
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
        const response = await fetch('https://backendmenu-3.onrender.com/api/bills');
        if (response.ok) {
          data = await response.json();
          console.log('Bills fetched from backend:', data);
          localStorage.setItem(storageKey, JSON.stringify(data)); // Sync localStorage
        } else {
          console.warn(`Backend fetch failed: ${response.status} ${response.statusText}`);
          throw new Error('Backend fetch failed');
        }
      } catch (backendError) {
        console.warn('Failed to fetch bills from backend, using localStorage:', backendError.message);
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

  return { bills, isLoading, error, fetchBills, syncBills };
};

// Notification component
const Notification = ({ message, type }) => (
  <div className={`${styles.notification} ${type === 'error' ? styles.notificationError : styles.notificationSuccess}`}>
    {message}
  </div>
);

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
        showNotification(`Factures actualisées : ${data.length} facture(s) chargée(s)`);
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
      <div className={styles.invoiceSummary}>
        <div><span>Sous-total:</span> {formatCurrency(bill.totalBillAmount)}</div>
        <div><span>TVA (10%):</span> {formatCurrency(bill.totalBillAmount * 0.1)}</div>
        <div className={styles.summaryRowTotal}><span>TOTAL:</span> {formatCurrency(bill.totalBillAmount * 1.1)}</div>
      </div>
      <div className={styles.invoiceFooter}>
        <div>Merci pour votre visite ! À bientôt</div>
        <div className={styles.cardActions}>
          <button onClick={printInvoice} className={styles.cardButton} aria-label={`Imprimer facture #${bill.id}`}>
            <FaPrint /> Imprimer
          </button>
        </div>
      </div>
    </div>
  );
};

// Main ListeCommandes component
const ListeCommandes = ({ storageKey = 'allBills', currency = 'DT', onEdit }) => {
  const { bills, isLoading, error, fetchBills, syncBills } = useBills(storageKey);
  const [dailyTotal, setDailyTotal] = useState(0);
  const [dailyDetails, setDailyDetails] = useState([]);
  const [sortBy, setSortBy] = useState('date-desc');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [tableFilter, setTableFilter] = useState('');
  const [notification, setNotification] = useState(null);
  const [activeView, setActiveView] = useState('bills');
  const [showGrandTotal, setShowGrandTotal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Show notification
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Calculate daily total with VAT
  const calculateDailyTotal = useCallback(() => {
    const selectedDate = new Date(dateFilter).toISOString().split('T')[0];
    const filteredBills = bills.filter(bill => 
      bill.orders.some(order => new Date(order.date).toISOString().split('T')[0] === selectedDate)
    );
    const total = filteredBills.reduce((sum, bill) => sum + (bill.totalBillAmount * 1.1), 0);
    setDailyTotal(total);
    setDailyDetails(filteredBills);
    setActiveView('dailyTotal');
    showNotification(`Total journalier: ${formatCurrency(total)}`);
  }, [bills, dateFilter, showNotification]);

  // Group by table
  const groupByTable = useCallback(() => setActiveView('tables'), []);

  // Export daily total as JSON
  const exportDailyTotal = useCallback(() => {
    const data = { 
      date: dateFilter, 
      total: dailyTotal, 
      bills: dailyDetails.map(bill => ({
        id: bill.id,
        tableNumber: bill.tableNumber,
        totalBillAmount: bill.totalBillAmount,
        orders: bill.orders
      }))
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily_total_${dateFilter}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Exportation JSON réussie');
  }, [dateFilter, dailyTotal, dailyDetails, showNotification]);

  // Export daily total as PDF
  const exportDailyTotalPDF = useCallback(() => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Crêperie 30.8 - Rapport Journalier', 20, 20);
    doc.setFontSize(12);
    doc.text('123 Avenue des Gastronomes, 75001 Paris', 20, 30);
    doc.text('Tél: 00216 23 587 726 • creperie30.8@gamail.com', 20, 35);
    doc.text(`Date: ${dateFilter}`, 20, 45);
    doc.text(`Total Journalier: ${formatCurrency(dailyTotal)}`, 20, 50);

    doc.autoTable({
      startY: 60,
      head: [['N° Facture', 'Table', 'Commandes', 'Sous-total', 'TVA (10%)', 'Total']],
      body: dailyDetails.map(bill => [
        bill.id.slice(0, 8),
        bill.tableNumber,
        bill.orders.map(order => `Commande #${order.id.slice(0, 8)}: ${order.items.map(item => `${item.name} (x${item.quantity})`).join(', ')}`).join('; '),
        formatCurrency(bill.totalBillAmount),
        formatCurrency(bill.totalBillAmount * 0.1),
        formatCurrency(bill.totalBillAmount * 1.1)
      ]),
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0] },
      margin: { top: 60 }
    });

    doc.text('Merci pour votre visite ! À bientôt', 20, doc.lastAutoTable.finalY + 20);
    doc.save(`daily_total_${dateFilter}.pdf`);
    showNotification('Exportation PDF réussie');
  }, [dateFilter, dailyTotal, dailyDetails, showNotification]);

  // Print daily total
  const printDailyTotal = useCallback(() => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rapport Journalier - ${dateFilter}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .report-container { max-width: 800px; margin: auto; padding: 20px; border: 1px solid #ccc; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .restaurant-info { text-align: left; }
          .restaurant-name { font-size: 24px; font-weight: bold; }
          .restaurant-details { font-size: 12px; }
          .report-title { font-size: 28px; font-weight: bold; }
          .report-info { margin: 20px 0; }
          .info-row { margin: 5px 0; }
          .info-label { font-weight: bold; margin-right: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          .summary { text-align: right; margin-top: 20px; }
          .summary-row { margin: 5px 0; }
          .total-row { font-weight: bold; font-size: 18px; border-top: 2px solid #000; padding-top: 10px; }
          .footer { text-align: center; margin-top: 20px; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="header">
            <div class="restaurant-info">
              <div class="restaurant-name">Crêperie 30.8</div>
              <div class="restaurant-details">123 Avenue des Gastronomes, 75001 Paris<br>Tél: 00216 23 587 726 • creperie30.8@gamail.com</div>
            </div>
            <div class="report-title">RAPPORT JOURNALIER</div>
          </div>
          <div class="report-info">
            <div class="info-row"><span class="info-label">Date:</span>${dateFilter}</div>
            <div class="info-row"><span class="info-label">Total Journalier:</span>${formatCurrency(dailyTotal)}</div>
            <div class="info-row"><span class="info-label">Nombre de factures:</span>${dailyDetails.length}</div>
          </div>
          <table>
            <thead><tr><th>N° Facture</th><th>Table</th><th>Commandes</th><th>Sous-total</th><th>TVA (10%)</th><th>Total</th></tr></thead>
            <tbody>${dailyDetails.map(bill => `
              <tr>
                <td>${bill.id.slice(0, 8)}</td>
                <td>${bill.tableNumber}</td>
                <td>${bill.orders.map(order => `Commande #${order.id.slice(0, 8)}: ${order.items.map(item => `${item.name} (x${item.quantity})`).join(', ')}`).join('; ')}</td>
                <td>${formatCurrency(bill.totalBillAmount)}</td>
                <td>${formatCurrency(bill.totalBillAmount * 0.1)}</td>
                <td>${formatCurrency(bill.totalBillAmount * 1.1)}</td>
              </tr>
            `).join('')}</tbody>
          </table>
          <div class="summary">
            <div class="summary-row total-row"><span>TOTAL JOURNALIER:</span>${formatCurrency(dailyTotal)}</div>
          </div>
          <div class="footer"><p>Merci pour votre visite ! À bientôt</p></div>
        </div>
        <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 1000); };</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }, [dateFilter, dailyTotal, dailyDetails]);

  // Reset localStorage
  const resetLocalStorage = useCallback(() => {
    if (window.confirm('Voulez-vous réinitialiser les données de session ? Les factures seront conservées.')) {
      localStorage.removeItem('sessionBills');
      localStorage.removeItem('currentBillId');
      // Preserve allBills to ensure permanent storage
      fetchBills().then(() => {
        showNotification('Données de session réinitialisées, factures conservées');
        setActiveView('bills');
        setRefreshKey(prev => prev + 1);
      });
    }
  }, [fetchBills, showNotification]);

  // Filter and sort bills
  const filteredAndSortedBills = useMemo(() => {
    let result = [...bills];
    if (tableFilter) result = result.filter(bill => bill.tableNumber.toString().includes(tableFilter));
    return result.sort((a, b) => {
      const aDate = a.orders[0]?.date ? new Date(a.orders[0].date) : new Date();
      const bDate = b.orders[0]?.date ? new Date(b.orders[0].date) : new Date();
      if (sortBy === 'date-desc') return bDate - aDate;
      if (sortBy === 'date-asc') return aDate - bDate;
      if (sortBy === 'total-desc') return (b.totalBillAmount * 1.1) - (a.totalBillAmount * 1.1);
      if (sortBy === 'total-asc') return (a.totalBillAmount * 1.1) - (b.totalBillAmount * 1.1);
      return 0;
    });
  }, [bills, sortBy, tableFilter, refreshKey]);

  // Group bills by table
  const groupedByTable = useMemo(() => {
    return bills.reduce((acc, bill) => {
      acc[bill.tableNumber] = acc[bill.tableNumber] || [];
      acc[bill.tableNumber].push(bill);
      return acc;
    }, {});
  }, [bills, refreshKey]);

  // Calculate table totals with VAT
  const tableTotals = useMemo(() => {
    return Object.keys(groupedByTable).reduce((acc, table) => {
      acc[table] = groupedByTable[table].reduce((sum, bill) => sum + (bill.totalBillAmount * 1.1), 0);
      return acc;
    }, {});
  }, [groupedByTable, refreshKey]);

  // Calculate stats with VAT
  const billStats = useMemo(() => ({
    totalBills: bills.length,
    totalRevenue: bills.reduce((sum, bill) => sum + (bill.totalBillAmount * 1.1), 0),
    tablesServed: [...new Set(bills.map(bill => bill.tableNumber))].length
  }), [bills, refreshKey]);

  // Periodic sync
  useEffect(() => {
    fetchBills().then(data => {
      console.log('Initial load bills:', data);
    });
    const interval = setInterval(() => {
      syncBills();
    }, 60000); // Sync every 60 seconds
    return () => clearInterval(interval);
  }, [fetchBills, syncBills]);

  if (isLoading) return <div className={styles.loadingContainer}>Chargement...</div>;
  if (error) return <div className={styles.errorContainer}>{error}</div>;

  return (
    <div className={styles.container}>
      {notification && <Notification message={notification.message} type={notification.type} />}
      <div className={styles.header}>
        <h1 className={styles.title}><FaTable /> Historique des Factures</h1>
        <Stats stats={billStats} currency={currency} onShowGrandTotal={() => setShowGrandTotal(true)} />
      </div>
      {showGrandTotal && <GrandTotalSection stats={billStats} currency={currency} onClose={() => setShowGrandTotal(false)} />}
      <div className={styles.controlsSection}>
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
          resetLocalStorage={resetLocalStorage} 
          activeView={activeView} 
          syncBills={syncBills}
          showNotification={showNotification}
        />
      </div>
      {activeView === 'bills' && (
        <div className={styles.billsSection}>
          <h2>Toutes les Factures ({filteredAndSortedBills.length})</h2>
          {filteredAndSortedBills.length === 0 ? (
            <div className={styles.emptyMessage}>Aucune facture trouvée</div>
          ) : (
            <div className={styles.billsGrid}>
              {filteredAndSortedBills.map(bill => (
                <BillCard 
                  key={bill.id} 
                  bill={bill} 
                  currency={currency} 
                  onEdit={onEdit} 
                />
              ))}
            </div>
          )}
        </div>
      )}
      {activeView === 'dailyTotal' && (
        <div className={styles.dailyTotalSection}>
          <h2>Factures du Jour ({dateFilter}) - {formatCurrency(dailyTotal)}</h2>
          {dailyDetails.length === 0 ? (
            <div className={styles.emptyMessage}>Aucune facture pour cette date</div>
          ) : (
            <div className={styles.billsGrid}>
              {dailyDetails.map(bill => (
                <BillCard 
                  key={bill.id} 
                  bill={bill} 
                  currency={currency} 
                  onEdit={onEdit} 
                />
              ))}
            </div>
          )}
        </div>
      )}
      {activeView === 'tables' && (
        <div className={styles.tablesSection}>
          <h2>Factures par Table</h2>
          <div className={styles.tablesContainer}>
            {Object.entries(groupedByTable).sort().map(([table, bills]) => (
              <div key={table} className={styles.tableGroup}>
                <div className={styles.tableHeader}>Table {table} - {formatCurrency(tableTotals[table])}</div>
                <div className={styles.billsGrid}>
                  {bills.map(bill => (
                    <BillCard 
                      key={bill.id} 
                      bill={bill} 
                      currency={currency} 
                      onEdit={onEdit} 
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

ListeCommandes.propTypes = {
  storageKey: PropTypes.string,
  currency: PropTypes.string,
  onEdit: PropTypes.func,
};

export default ListeCommandes;