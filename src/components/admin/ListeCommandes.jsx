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

// Custom hook for managing commands
const useCommandes = (storageKey) => {
  const [commandes, setCommandes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch and process commands from localStorage
  const fetchCommandes = useCallback(async () => {
    try {
      setIsLoading(true);
      const rawData = localStorage.getItem(storageKey);
      console.log('Raw data from localStorage:', rawData); // Debug
      let data = rawData ? JSON.parse(rawData) : [];

      // Handle both nested bills and flat orders
      if (data.length > 0 && 'orders' in data[0]) {
        data = data.flatMap(bill => (bill.orders || []).map(order => ({
          id: order.id,
          billId: bill.id,
          tableNumber: bill.tableNumber,
          items: order.items,
          total: order.totalPrice || calculateCommandTotal(order.items),
          date: order.date
        })));
      }

      console.log('Parsed commands:', data); // Debug
      setCommandes(data);
      setError(null);
      return data;
    } catch (err) {
      console.error('Error loading commandes:', err);
      setError('Erreur lors du chargement des commandes. Les données peuvent être corrompues.');
      localStorage.removeItem(storageKey);
      setCommandes([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [storageKey]);

  // Delete a command and update localStorage
  const deleteCommande = useCallback((id) => {
    const updatedCommandes = commandes.filter(cmd => cmd.id !== id);
    localStorage.setItem(storageKey, JSON.stringify(updatedCommandes));
    setCommandes(updatedCommandes);
    return updatedCommandes;
  }, [commandes, storageKey]);

  return { commandes, isLoading, error, fetchCommandes, deleteCommande };
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

// Actions component with Print and PDF Export buttons
const Actions = ({ calculateDailyTotal, groupByTable, exportDailyTotal, exportDailyTotalPDF, printDailyTotal, resetLocalStorage, activeView, fetchCommandes, showNotification }) => (
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
    <button onClick={resetLocalStorage} className={`${styles.actionButton} ${styles.resetButton}`}>
      <FaSync /> Réinitialiser
    </button>
    <button 
      onClick={async () => {
        const data = await fetchCommandes();
        showNotification(`Commandes actualisées : ${data.length} commande(s) chargée(s)`);
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
      <div className={styles.statValue}>{stats.totalCommandes}</div>
      <div className={styles.statLabel}>Commandes</div>
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
          <span>Nombre de commandes:</span>
          <span>{stats.totalCommandes}</span>
        </div>
        <div className={styles.detailItem}>
          <span>Tables servies:</span>
          <span>{stats.tablesServed}</span>
        </div>
        <div className={styles.detailItem}>
          <span>Moyenne par commande:</span>
          <span>{formatCurrency(stats.totalRevenue / stats.totalCommandes || 0)}</span>
        </div>
        <div className={styles.detailItem}>
          <span>Moyenne par table:</span>
          <span>{formatCurrency(stats.totalRevenue / stats.tablesServed || 0)}</span>
        </div>
      </div>
    </div>
  </div>
);

// CommandeCard component
const CommandeCard = ({ cmd, currency, onEdit, onDelete }) => {
  const printInvoice = useCallback(() => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Facture #${cmd.id}</title>
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
              <div class="info-row"><span class="info-label">N° Commande:</span><span class="info-value">${cmd.id}</span></div>
              <div class="info-row"><span class="info-label">Date:</span><span class="info-value">${new Date(cmd.date).toLocaleString()}</span></div>
            </div>
            <div>
              <div class="info-row"><span class="info-label">Table:</span><span class="info-value-highlight">${cmd.tableNumber}</span></div>
              <div class="info-row"><span class="info-label">Addition:</span><span class="info-value">${cmd.billId}</span></div>
            </div>
          </div>
          <table>
            <thead><tr><th>Article</th><th>Qté</th><th>Prix unitaire</th><th>Total</th></tr></thead>
            <tbody>${cmd.items.map(item => `
              <tr><td>${item.name}</td><td>${item.quantity}</td><td>${formatCurrency(item.price)}</td><td>${formatCurrency(item.price * item.quantity)}</td></tr>
            `).join('')}</tbody>
          </table>
          <div class="summary">
            <div class="summary-row"><span>Sous-total:</span>${formatCurrency(cmd.total)}</div>
            <div class="summary-row"><span>TVA (10%):</span>${formatCurrency(cmd.total * 0.1)}</div>
            <div class="summary-row total-row"><span>TOTAL:</span>${formatCurrency(cmd.total * 1.1)}</div>
          </div>
          <div class="footer"><p>Merci pour votre visite ! À bientôt</p></div>
        </div>
        <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 1000); };</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }, [cmd, currency]);

  return (
    <div className={styles.commandeCard}>
      <div className={styles.invoiceHeader}>
        <div className={styles.invoiceLogo}><FaStore /> Crêperie 30.8</div>
        <div className={styles.invoiceTitle}><FaReceipt /> FACTURE</div>
      </div>
      <div className={styles.invoiceInfo}>
        <div><span>N° Commande:</span> #{cmd.id.slice(0, 8)}</div>
        <div><span>Date:</span> {new Date(cmd.date).toLocaleDateString()} {new Date(cmd.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        <div><span>Table:</span> <span className={styles.infoValueHighlight}>{cmd.tableNumber}</span></div>
        <div><span>Addition:</span> #{cmd.billId.slice(0, 8)}</div>
      </div>
      <div className={styles.itemsHeader}>
        <div>Article</div><div>Qté</div><div>Prix</div><div>Total</div>
      </div>
      <div className={styles.itemsContainer}>
        {cmd.items.map((item, index) => (
          <div key={index} className={styles.itemRow}>
            <div>{item.name}</div>
            <div>{item.quantity}</div>
            <div>{formatCurrency(item.price)}</div>
            <div>{formatCurrency(item.price * item.quantity)}</div>
          </div>
        ))}
      </div>
      <div className={styles.invoiceSummary}>
        <div><span>Sous-total:</span> {formatCurrency(cmd.total)}</div>
        <div><span>TVA (10%):</span> {formatCurrency(cmd.total * 0.1)}</div>
        <div className={styles.summaryRowTotal}><span>TOTAL:</span> {formatCurrency(cmd.total * 1.1)}</div>
      </div>
      <div className={styles.invoiceFooter}>
        <div>Merci pour votre visite ! À bientôt</div>
        <div className={styles.cardActions}>
          <button onClick={printInvoice} className={styles.cardButton} aria-label={`Imprimer facture #${cmd.id}`}><FaPrint /> Imprimer</button>
          {onEdit && <button onClick={() => onEdit(cmd)} className={styles.cardButton} aria-label={`Modifier commande #${cmd.id}`}><FaEdit /> Modifier</button>}
          <button onClick={() => onDelete(cmd.id)} className={styles.cardButton} aria-label={`Supprimer commande #${cmd.id}`}><FaTrash /> Supprimer</button>
        </div>
      </div>
    </div>
  );
};

// Main ListeCommandes component
const ListeCommandes = ({ storageKey = 'bills', currency = 'DT', onEdit }) => {
  const { commandes, isLoading, error, fetchCommandes, deleteCommande } = useCommandes(storageKey);
  const [dailyTotal, setDailyTotal] = useState(0);
  const [dailyDetails, setDailyDetails] = useState([]);
  const [sortBy, setSortBy] = useState('date-desc');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [tableFilter, setTableFilter] = useState('');
  const [notification, setNotification] = useState(null);
  const [activeView, setActiveView] = useState('commandes');
  const [showGrandTotal, setShowGrandTotal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Show notification
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Handle delete with confirmation
  const handleDelete = useCallback((id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
      deleteCommande(id);
      showNotification('Commande supprimée avec succès');
      if (activeView === 'dailyTotal') {
        calculateDailyTotal();
      }
      setRefreshKey(prev => prev + 1);
    }
  }, [deleteCommande, showNotification, activeView]);

  // Calculate daily total with VAT
  const calculateDailyTotal = useCallback(() => {
    const selectedDate = new Date(dateFilter).toISOString().split('T')[0];
    const filtered = commandes.filter(cmd => {
      const cmdDate = new Date(cmd.date).toISOString().split('T')[0];
      return cmdDate === selectedDate;
    });
    const total = filtered.reduce((sum, cmd) => sum + (cmd.total * 1.1), 0);
    setDailyTotal(total);
    setDailyDetails(filtered);
    setActiveView('dailyTotal');
    showNotification(`Total journalier: ${formatCurrency(total)}`);
  }, [commandes, dateFilter, showNotification]);

  // Group by table
  const groupByTable = useCallback(() => setActiveView('tables'), []);

  // Export daily total as JSON
  const exportDailyTotal = useCallback(() => {
    const data = { date: dateFilter, total: dailyTotal, commandes: dailyDetails };
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
      head: [['N° Commande', 'Table', 'Articles', 'Sous-total', 'TVA (10%)', 'Total']],
      body: dailyDetails.map(cmd => [
        cmd.id.slice(0, 8),
        cmd.tableNumber,
        cmd.items.map(item => `${item.name} (x${item.quantity})`).join(', '),
        formatCurrency(cmd.total),
        formatCurrency(cmd.total * 0.1),
        formatCurrency(cmd.total * 1.1)
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
            <div class="info-row"><span class="info-label">Nombre de commandes:</span>${dailyDetails.length}</div>
          </div>
          <table>
            <thead><tr><th>N° Commande</th><th>Table</th><th>Articles</th><th>Sous-total</th><th>TVA (10%)</th><th>Total</th></tr></thead>
            <tbody>${dailyDetails.map(cmd => `
              <tr>
                <td>${cmd.id.slice(0, 8)}</td>
                <td>${cmd.tableNumber}</td>
                <td>${cmd.items.map(item => `${item.name} (x${item.quantity})`).join(', ')}</td>
                <td>${formatCurrency(cmd.total)}</td>
                <td>${formatCurrency(cmd.total * 0.1)}</td>
                <td>${formatCurrency(cmd.total * 1.1)}</td>
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
    if (window.confirm('Voulez-vous réinitialiser toutes les commandes ?')) {
      localStorage.removeItem(storageKey);
      fetchCommandes().then(() => {
        showNotification('Données réinitialisées');
        setActiveView('commandes');
        setRefreshKey(prev => prev + 1);
      });
    }
  }, [fetchCommandes, storageKey, showNotification]);

  // Filter and sort commands
  const filteredAndSortedCommandes = useMemo(() => {
    let result = [...commandes];
    if (tableFilter) result = result.filter(cmd => cmd.tableNumber.toString().includes(tableFilter));
    return result.sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
      if (sortBy === 'total-desc') return (b.total * 1.1) - (a.total * 1.1);
      if (sortBy === 'total-asc') return (a.total * 1.1) - (b.total * 1.1);
      return 0;
    });
  }, [commandes, sortBy, tableFilter, refreshKey]);

  // Group commands by table
  const groupedByTable = useMemo(() => {
    return commandes.reduce((acc, cmd) => {
      acc[cmd.tableNumber] = acc[cmd.tableNumber] || [];
      acc[cmd.tableNumber].push(cmd);
      return acc;
    }, {});
  }, [commandes, refreshKey]);

  // Calculate table totals with VAT
  const tableTotals = useMemo(() => {
    return Object.keys(groupedByTable).reduce((acc, table) => {
      acc[table] = groupedByTable[table].reduce((sum, cmd) => sum + (cmd.total * 1.1), 0);
      return acc;
    }, {});
  }, [groupedByTable, refreshKey]);

  // Calculate stats with VAT
  const commandStats = useMemo(() => ({
    totalCommandes: commandes.length,
    totalRevenue: commandes.reduce((sum, cmd) => sum + (cmd.total * 1.1), 0),
    tablesServed: [...new Set(commandes.map(cmd => cmd.tableNumber))].length
  }), [commandes, refreshKey]);

  useEffect(() => {
    fetchCommandes().then(data => {
      console.log('Initial load commands:', data);
    });
  }, [fetchCommandes]);

  if (isLoading) return <div className={styles.loadingContainer}>Chargement...</div>;
  if (error) return <div className={styles.errorContainer}>{error}</div>;

  return (
    <div className={styles.container}>
      {notification && <Notification message={notification.message} type={notification.type} />}
      <div className={styles.header}>
        <h1 className={styles.title}><FaTable /> Historique des Commandes</h1>
        <Stats stats={commandStats} currency={currency} onShowGrandTotal={() => setShowGrandTotal(true)} />
      </div>
      {showGrandTotal && <GrandTotalSection stats={commandStats} currency={currency} onClose={() => setShowGrandTotal(false)} />}
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
          fetchCommandes={fetchCommandes}
          showNotification={showNotification}
        />
      </div>
      {activeView === 'commandes' && (
        <div className={styles.commandesSection}>
          <h2>Toutes les Commandes ({filteredAndSortedCommandes.length})</h2>
          {filteredAndSortedCommandes.length === 0 ? (
            <div className={styles.emptyMessage}>Aucune commande trouvée</div>
          ) : (
            <div className={styles.commandesGrid}>
              {filteredAndSortedCommandes.map(cmd => (
                <CommandeCard key={cmd.id} cmd={cmd} currency={currency} onEdit={onEdit} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      )}
      {activeView === 'dailyTotal' && (
        <div className={styles.dailyTotalSection}>
          <h2>Facture du Jour ({dateFilter}) - {formatCurrency(dailyTotal)}</h2>
          {dailyDetails.length === 0 ? (
            <div className={styles.emptyMessage}>Aucune commande pour cette date</div>
          ) : (
            <div className={styles.commandesGrid}>
              {dailyDetails.map(cmd => (
                <CommandeCard key={cmd.id} cmd={cmd} currency={currency} onEdit={onEdit} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      )}
      {activeView === 'tables' && (
        <div className={styles.tablesSection}>
          <h2>Commandes par Table</h2>
          <div className={styles.tablesContainer}>
            {Object.entries(groupedByTable).sort().map(([table, commands]) => (
              <div key={table} className={styles.tableGroup}>
                <div className={styles.tableHeader}>Table {table} - {formatCurrency(tableTotals[table])}</div>
                <div className={styles.commandesGrid}>
                  {commands.map(cmd => (
                    <CommandeCard key={cmd.id} cmd={cmd} currency={currency} onEdit={onEdit} onDelete={handleDelete} />
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