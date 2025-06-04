import React, { useState, useEffect, useCallback } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from '../common/Header';
import Footer from '../common/Footer';
import styles from './Panier.module.css';

// Utility for generating UUIDs
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Enhanced storage utility with session-based bill management
const storage = {
  get: (key) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return null;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing ${key} to localStorage:`, error);
      toast.error('Erreur lors de la sauvegarde des données.');
    }
  },
  
  getSessionBill: (tableNumber) => {
    const sessionBills = storage.get('sessionBills') || {};
    return sessionBills[tableNumber] || null;
  },
  
  setSessionBill: (tableNumber, billId) => {
    const sessionBills = storage.get('sessionBills') || {};
    sessionBills[tableNumber] = billId;
    storage.set('sessionBills', sessionBills);
    localStorage.setItem('currentBillId', billId);
  },
  
  updateCart: (newCart, tableNumber) => {
    storage.set(`cart_${tableNumber}`, newCart);
  },
  
  getCart: (tableNumber) => {
    return storage.get(`cart_${tableNumber}`) || [];
  },
  
  updateBills: (newBills) => {
    storage.set('bills', newBills);
  },
  
  clearCart: (tableNumber) => {
    storage.set(`cart_${tableNumber}`, []);
  }
};

export default function Panier() {
  const [tableNumber, setTableNumber] = useState(() => localStorage.getItem('tableNumber') || '0');
  const [cart, setCart] = useState(() => storage.getCart(tableNumber));
  const [commandePassee, setCommandePassee] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Session-based bill management
  const [bill, setBill] = useState(() => {
    if (!tableNumber || tableNumber === '0') return null;
    
    const sessionBillId = storage.getSessionBill(tableNumber);
    if (sessionBillId) {
      const bills = storage.get('bills') || [];
      const existingBill = bills.find(bill => bill.id === sessionBillId);
      if (existingBill) return existingBill;
    }
    
    const newBillId = generateUUID();
    const newBill = { 
      id: newBillId, 
      tableNumber, 
      orders: [], 
      totalBillAmount: 0 
    };
    
    const updatedBills = [...(storage.get('bills') || []), newBill];
    storage.updateBills(updatedBills);
    storage.setSessionBill(tableNumber, newBillId);
    
    return newBill;
  });

  // Synchronize table number and reset cart/bill on mount
  useEffect(() => {
    const storedTableNumber = localStorage.getItem('tableNumber') || '0';
    setTableNumber(storedTableNumber);
    setCart(storage.getCart(storedTableNumber));
    setCommandePassee(false);
    
    if (storedTableNumber !== '0') {
      const sessionBillId = storage.getSessionBill(storedTableNumber);
      if (sessionBillId) {
        const bills = storage.get('bills') || [];
        const currentBill = bills.find(bill => bill.id === sessionBillId);
        if (currentBill) {
          setBill(currentBill);
        } else {
          const newBillId = generateUUID();
          const newBill = { 
            id: newBillId, 
            tableNumber: storedTableNumber, 
            orders: [], 
            totalBillAmount: 0 
          };
          const updatedBills = [...(storage.get('bills') || []), newBill];
          storage.updateBills(updatedBills);
          storage.setSessionBill(storedTableNumber, newBillId);
          setBill(newBill);
        }
      } else {
        const newBillId = generateUUID();
        const newBill = { 
          id: newBillId, 
          tableNumber: storedTableNumber, 
          orders: [], 
          totalBillAmount: 0 
        };
        const updatedBills = [...(storage.get('bills') || []), newBill];
        storage.updateBills(updatedBills);
        storage.setSessionBill(storedTableNumber, newBillId);
        setBill(newBill);
      }
    } else {
      setBill(null);
      setCart([]);
      storage.clearCart(tableNumber);
    }
  }, []); // Run only once on mount

  // Save cart to localStorage on change
  useEffect(() => {
    if (tableNumber !== '0') {
      storage.updateCart(cart, tableNumber);
    }
  }, [cart, tableNumber]);

  const removeFromCart = useCallback(
    (id) => {
      const newCart = cart.filter((item) => item._id !== id);
      setCart(newCart);
      toast.info('Article supprimé du panier', { autoClose: 2000 });
      setCommandePassee(false);
    },
    [cart]
  );

  const updateQuantity = useCallback(
    (id, quantity) => {
      if (quantity < 1 || isNaN(quantity)) return;
      
      const newCart = cart.map((item) => 
        item._id === id ? { ...item, quantity } : item
      );
      
      setCart(newCart);
      setCommandePassee(false);
    },
    [cart]
  );

  const confirmModification = useCallback(
    (item) => {
      toast.success(`Quantité pour ${item.name} modifiée à ${item.quantity}`, {
        autoClose: 2000,
      });
      setCommandePassee(false);
    },
    []
  );

  const totalPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const passerCommande = async () => {
    if (cart.length === 0) {
      toast.error('Votre panier est vide, impossible de passer la commande.', {
        autoClose: 2000,
      });
      return;
    }
    if (!tableNumber || tableNumber === '0' || !bill) {
      toast.error('Numéro de table ou addition non défini.', { autoClose: 2000 });
      return;
    }

    setIsLoading(true);
    try {
      const bills = storage.get('bills') || [];
      const currentBill = bills.find(b => b.id === bill.id);

      const newOrder = {
        id: generateUUID(),
        billId: bill.id,
        tableNumber,
        items: cart.map(({ _id, name, price, quantity }) => ({
          _id,
          name,
          price,
          quantity,
        })),
        totalPrice,
        date: new Date().toISOString(),
      };

      // Update bill with new order
      const updatedBill = {
        ...currentBill,
        orders: [...(currentBill?.orders || []), newOrder],
        totalBillAmount: (currentBill?.totalBillAmount || 0) + totalPrice,
      };

      // Update bills in localStorage
      const updatedBills = [
        ...bills.filter(b => b.id !== bill.id),
        updatedBill,
      ];
      
      storage.updateBills(updatedBills);
      storage.setSessionBill(tableNumber, bill.id);
      setBill(updatedBill);

      // Clear the cart after successful order
      setCart([]);
      storage.updateCart([], tableNumber);

      toast.success('Commande passée avec succès !', { autoClose: 2000 });
      setCommandePassee(true);
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Erreur lors de la validation de la commande.', { autoClose: 2000 });
    } finally {
      setIsLoading(false);
    }
  };

  const nouvelleAddition = () => {
    const newBillId = generateUUID();
    const newBill = { 
      id: newBillId, 
      tableNumber, 
      orders: [], 
      totalBillAmount: 0 
    };
    
    const updatedBills = [...(storage.get('bills') || []), newBill];
    storage.updateBills(updatedBills);
    storage.setSessionBill(tableNumber, newBillId);
    setBill(newBill);
    
    setCart([]);
    storage.updateCart([], tableNumber);
    setCommandePassee(false);
    
    toast.info(`Nouvelle addition démarrée pour la table n°${tableNumber}`, {
      autoClose: 2000,
    });
  };

  if (tableNumber === '0') {
    return (
      <div className={styles.container}>
        <Header tableNumber="" cartCount={0} />
        <main className={styles.mainContent}>
          <h2>Numéro de table non défini</h2>
          <p>Veuillez revenir à la page d'accueil pour sélectionner votre numéro de table.</p>
        </main>
        <Footer />
        <ToastContainer position="bottom-right" autoClose={2000} />
      </div>
    );
  }

  if (cart.length === 0 && !bill?.orders?.length) {
    return (
      <div className={styles.container}>
        <Header tableNumber={tableNumber} cartCount={0} />
        <main className={styles.mainContent}>
          <h2>Votre panier est vide</h2>
          <button
            onClick={nouvelleAddition}
            className={styles.orderButton}
            aria-label="Démarrer une nouvelle addition"
          >
            Nouvelle addition
          </button>
        </main>
        <Footer />
        <ToastContainer position="bottom-right" autoClose={2000} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header tableNumber={tableNumber} cartCount={cart.reduce((a, c) => a + c.quantity, 0)} />
      <main className={styles.mainContent}>
        <h2>Panier - Table n°{tableNumber} (Addition: {bill?.id?.slice(0, 8)})</h2>
        
        <div className={styles.cartContainer}>
          <table className={styles.cartTable} role="grid">
            <thead>
              <tr>
                <th scope="col">Article</th>
                <th scope="col">Prix unitaire</th>
                <th scope="col">Quantité</th>
                <th scope="col">Total</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item._id}>
                  <td>{item.name}</td>
                  <td>{item.price.toFixed(2)} DT</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item._id, parseInt(e.target.value, 10) || 1)
                      }
                      className={styles.qtyInput}
                      aria-label={`Quantité pour ${item.name}`}
                      disabled={commandePassee || isLoading}
                    />
                  </td>
                  <td>{(item.price * item.quantity).toFixed(2)} DT</td>
                  <td className={styles.actionsCell}>
                    <button
                      onClick={() => confirmModification(item)}
                      className={styles.modifyButton}
                      aria-label={`Modifier la quantité de ${item.name}`}
                      disabled={commandePassee || isLoading}
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => removeFromCart(item._id)}
                      className={styles.removeButton}
                      aria-label={`Supprimer ${item.name} du panier`}
                      disabled={commandePassee || isLoading}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3" className={styles.totalLabel}>
                  Total panier actuel :
                </td>
                <td colSpan="2" className={styles.totalPrice}>
                  {totalPrice.toFixed(2)} DT
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {bill?.orders?.length > 0 && (
          <div className={styles.billSummary}>
            <h3>Récapitulatif de l'addition</h3>
            <div className={styles.billStats}>
              <div>
                <span className={styles.statLabel}>Total addition:</span>
                <span className={styles.statValue}>{bill.totalBillAmount.toFixed(2)} DT</span>
              </div>
              <div>
                <span className={styles.statLabel}>Commandes:</span>
                <span className={styles.statValue}>{bill.orders.length}</span>
              </div>
            </div>
            
            <details className={styles.orderDetails}>
              <summary>Historique des commandes</summary>
              <div className={styles.ordersContainer}>
                {bill.orders.map((order) => (
                  <div key={order.id} className={styles.orderCard}>
                    <div className={styles.orderHeader}>
                      <span>Commande #{order.id.slice(0, 8)}</span>
                      <span>{new Date(order.date).toLocaleString()}</span>
                    </div>
                    <ul className={styles.orderItems}>
                      {order.items.map((item) => (
                        <li key={item._id} className={styles.orderItem}>
                          <span>{item.name}</span>
                          <span>x {item.quantity}</span>
                          <span>{(item.price * item.quantity).toFixed(2)} DT</span>
                        </li>
                      ))}
                    </ul>
                    <div className={styles.orderTotal}>
                      Total: {order.totalPrice.toFixed(2)} DT
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        <div className={styles.commandeContainer}>
          {!commandePassee ? (
            <button
              onClick={passerCommande}
              className={styles.orderButton}
              disabled={isLoading}
              aria-label="Passer la commande"
            >
              {isLoading ? 'Validation...' : 'Passer la commande'}
            </button>
          ) : (
            <div className={styles.postOrderActions}>
              <p className={styles.successMessage}>
                Commande passée avec succès ! Vous pouvez continuer à ajouter des articles.
              </p>
              <button
                onClick={nouvelleAddition}
                className={`${styles.orderButton} ${styles.newBillButton}`}
                aria-label="Démarrer une nouvelle addition"
                disabled={isLoading}
              >
                Nouvelle addition
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <ToastContainer position="bottom-right" autoClose={2000} />
    </div>
  );
}