import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaArrowLeft } from 'react-icons/fa';
import Decimal from 'decimal.js';
import Header from '../common/Header';
import Footer from '../common/Footer';
import styles from './Panier.module.css';

// Utility for generating UUIDs
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Utility function to format currency as XX.XXX DT
const formatCurrency = (amount) => {
  return `${Number(amount).toFixed(3)} DT`;
};

// Backend API placeholder (replace with actual endpoint)
const sendOrderToBackend = async (order, bill) => {
  try {
    // Example: POST to https://backendmenu-3.onrender.com/api/orders
    // const response = await fetch('https://backendmenu-3.onrender.com/api/orders', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ order, bill })
    // });
    // if (!response.ok) throw new Error('Failed to send order to backend');
    // return await response.json();
    console.log('Order sent to backend:', { order, bill });
    return { success: true }; // Simulate success
  } catch (error) {
    console.error('Error sending order to backend:', error);
    throw error;
  }
};

// Advanced storage utility with validation and error handling
const storage = {
  get: key => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      toast.error('Erreur lors de la lecture des données.', { autoClose: 2000 });
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      console.log(`Saved ${key} to localStorage:`, value);
    } catch (error) {
      console.error(`Error writing ${key} to localStorage:`, error);
      toast.error('Erreur lors de la sauvegarde des données.', { autoClose: 2000 });
    }
  },
  remove: key => {
    try {
      localStorage.removeItem(key);
      console.log(`Removed ${key} from localStorage`);
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
      toast.error('Erreur lors de la suppression des données.', { autoClose: 2000 });
    }
  },
  getCart: tableNumber => {
    const cart = storage.get(`cart_${tableNumber}`) || [];
    console.log(`Panier chargé depuis localStorage pour table ${tableNumber}:`, cart);
    return cart;
  },
  updateCart: (newCart, tableNumber) => {
    storage.set(`cart_${tableNumber}`, newCart);
    console.log(`Panier mis à jour dans localStorage pour table ${tableNumber}:`, newCart);
  },
  getBill: tableNumber => {
    const bill = storage.get(`bill_${tableNumber}`) || null;
    console.log(`Bill chargé depuis localStorage pour table ${tableNumber}:`, bill);
    return bill;
  },
  setBill: (tableNumber, bill) => {
    storage.set(`bill_${tableNumber}`, bill);
    console.log(`Bill sauvegardé dans localStorage pour table ${tableNumber}:`, bill);
  },
  getAllBills: () => {
    const bills = storage.get('allBills') || [];
    console.log('All bills loaded from localStorage:', bills);
    return bills;
  },
  saveBillToAll: (bill) => {
    const allBills = storage.get('allBills') || [];
    const updatedBills = allBills.filter(b => b.id !== bill.id); // Keep all bills, update by ID
    updatedBills.push(bill);
    storage.set('allBills', updatedBills);
    console.log('Bill saved to allBills:', bill);
  },
  clearCart: tableNumber => {
    storage.set(`cart_${tableNumber}`, []);
    console.log(`Panier vidé pour table ${tableNumber}`);
  },
  clearBillData: tableNumber => {
    storage.remove(`cart_${tableNumber}`);
    storage.remove(`bill_${tableNumber}`);
    storage.remove('tableNumber');
    console.log(`Bill data and table number cleared for table ${tableNumber}`);
  },
};

export default function Panier() {
  const navigate = useNavigate();
  const [tableNumber, setTableNumber] = useState(() => {
    const num = storage.get('tableNumber') || '0';
    console.log('Initial tableNumber:', num);
    return num;
  });
  const [cart, setCart] = useState(() => {
    const initialCart = storage.getCart(tableNumber);
    console.log('Initial cart:', initialCart);
    return initialCart;
  });
  const [commandePassee, setCommandePassee] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bill, setBill] = useState(null);
  const quantityTimeoutRef = useRef(null);

  // Initialize bill
  const initializeBill = useCallback(() => {
    if (!tableNumber || tableNumber === '0') return null;
    const existingBill = storage.getBill(tableNumber);
    if (existingBill) {
      console.log('Bill existant chargé:', existingBill);
      return existingBill;
    }
    const newBillId = generateUUID();
    const newBill = {
      id: newBillId,
      tableNumber,
      orders: [],
      totalBillAmount: 0,
      createdAt: new Date().toISOString(),
    };
    storage.setBill(tableNumber, newBill);
    console.log('Nouveau bill créé:', newBill);
    return newBill;
  }, [tableNumber]);

  // Recalculate totalBillAmount with Decimal.js
  const recalculateTotalBillAmount = useCallback((orders) => {
    if (!orders || !Array.isArray(orders)) return 0;
    const total = orders.reduce((sum, order) => {
      const orderTotal = order.totalPrice && typeof order.totalPrice === 'number'
        ? new Decimal(order.totalPrice)
        : new Decimal(0);
      console.log(`Order ${order.id} totalPrice: ${orderTotal}`);
      return sum.plus(orderTotal);
    }, new Decimal(0));
    console.log('Recalculated totalBillAmount:', total.toNumber());
    return total.toNumber();
  }, []);

  // Synchronize table number, cart, and bill
  useEffect(() => {
    const storedTableNumber = storage.get('tableNumber') || '0';
    console.log('Syncing tableNumber:', storedTableNumber);
    if (storedTableNumber !== tableNumber) {
      if (tableNumber !== '0') {
        storage.clearCart(tableNumber);
        storage.clearBillData(tableNumber);
      }
      setTableNumber(storedTableNumber);
      setCart([]);
      setCommandePassee(false);
      if (storedTableNumber !== '0') {
        const newBill = initializeBill();
        setBill(newBill);
      } else {
        setBill(null);
      }
    } else {
      const loadedCart = storage.getCart(storedTableNumber);
      setCart(loadedCart);
      setCommandePassee(false);
      if (storedTableNumber !== '0') {
        const newBill = initializeBill();
        setBill(newBill);
      } else {
        setBill(null);
        setCart([]);
        storage.clearCart(tableNumber);
      }
    }
  }, [tableNumber, initializeBill]);

  // Persist cart to localStorage
  useEffect(() => {
    if (tableNumber !== '0') {
      storage.updateCart(cart, tableNumber);
    }
  }, [cart, tableNumber]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (quantityTimeoutRef.current) {
        clearTimeout(quantityTimeoutRef.current);
      }
    };
  }, []);

  // Debounced quantity update
  const updateQuantity = useCallback((cartItemId, quantity) => {
    if (quantity < 1 || isNaN(quantity) || !Number.isInteger(quantity)) {
      toast.error('Quantité invalide.', { autoClose: 2000 });
      return;
    }
    if (quantityTimeoutRef.current) {
      clearTimeout(quantityTimeoutRef.current);
    }
    quantityTimeoutRef.current = setTimeout(() => {
      setCart(prevCart => {
        const newCart = prevCart.map(item =>
          item.cartItemId === cartItemId ? { ...item, quantity } : item
        );
        toast.info('Quantité mise à jour', { autoClose: 2000 });
        setCommandePassee(false);
        return newCart;
      });
    }, 300);
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((cartItemId) => {
    setCart(prevCart => {
      const newCart = prevCart.filter(item => item.cartItemId !== cartItemId);
      toast.info('Article supprimé du panier', { autoClose: 2000 });
      setCommandePassee(false);
      return newCart;
    });
  }, []);

  // Confirm modification
  const confirmModification = useCallback((item) => {
    toast.success(`Quantité pour ${item.name} modifiée à ${item.quantity}`, {
      autoClose: 2000,
    });
    setCommandePassee(false);
  }, []);

  // Calculate cart total with Decimal.js
  const totalPrice = useMemo(() => {
    const total = cart.reduce((sum, item) => {
      const itemTotal = new Decimal(item.price || 0).times(item.quantity || 1);
      console.log(`Item ${item.name} total: ${itemTotal}`);
      return sum.plus(itemTotal);
    }, new Decimal(0));
    console.log('Total cart price:', total.toNumber());
    return total.toNumber();
  }, [cart]);

  // Place order
  const passerCommande = useCallback(async () => {
    if (cart.length === 0) {
      toast.error('Votre panier est vide.', { autoClose: 2000 });
      return;
    }
    if (!tableNumber || tableNumber === '0' || !bill) {
      toast.error('Numéro de table ou addition non défini.', { autoClose: 2000 });
      navigate('/client/menu');
      return;
    }
    setIsLoading(true);
    try {
      const newOrder = {
        id: generateUUID(),
        tableNumber,
        items: cart.map(({ _id, name, price, quantity, cartItemId }) => ({
          _id,
          name,
          price,
          quantity,
          cartItemId,
        })),
        totalPrice,
        date: new Date().toISOString(),
      };
      console.log('New order:', newOrder);
      const updatedBill = {
        ...bill,
        orders: [...(bill.orders || []), newOrder],
        totalBillAmount: recalculateTotalBillAmount([...(bill.orders || []), newOrder]),
      };
      console.log('Updated bill:', updatedBill);
      storage.setBill(tableNumber, updatedBill);
      storage.saveBillToAll(updatedBill); // Permanently save to allBills
      // Send to backend (uncomment and configure with actual endpoint)
      // await sendOrderToBackend(newOrder, updatedBill);
      setBill(updatedBill);
      setCart([]);
      storage.clearCart(tableNumber);
      toast.success('Commande passée avec succès ! Vous pouvez ajouter d’autres articles.', { autoClose: 2000 });
      setCommandePassee(true);
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Erreur lors de la validation de la commande.', { autoClose: 2000 });
    } finally {
      setIsLoading(false);
    }
  }, [cart, tableNumber, bill, totalPrice, recalculateTotalBillAmount, navigate]);

  // Add another order
  const ajouterAutreCommande = useCallback(() => {
    if (tableNumber === '0') {
      toast.error('Numéro de table non défini. Veuillez sélectionner une table.', { autoClose: 2000 });
      navigate('/client/menu');
      return;
    }
    setCommandePassee(false);
    navigate('/client/menu?view=categories');
  }, [navigate, tableNumber]);

  // Return to categories
  const retourCategories = useCallback(() => {
    if (tableNumber === '0') {
      toast.error('Veuillez d’abord sélectionner un numéro de table.', { autoClose: 2000 });
      navigate('/client/menu');
      return;
    }
    if (cart.length > 0 && !commandePassee) {
      if (!window.confirm('Vous avez des articles non commandés. Voulez-vous retourner aux catégories ?')) {
        return;
      }
    }
    navigate('/client/menu?view=categories');
  }, [navigate, tableNumber, cart, commandePassee]);

  // Handle invalid table
  if (tableNumber === '0') {
    return (
      <div className={styles.container}>
        <Header tableNumber="" cartCount={0} />
        <main className={styles.mainContent}>
          <h2>Numéro de table non défini</h2>
          <p>Veuillez sélectionner une table pour continuer.</p>
          <button
            onClick={() => navigate('/client/menu')}
            className={styles.orderButton}
            aria-label="Sélectionner une table"
          >
            Sélectionner une table
          </button>
        </main>
        <Footer />
        <ToastContainer position="bottom-right" autoClose={2000} />
      </div>
    );
  }

  // Handle empty cart and no orders
  if (cart.length === 0 && (!bill || bill.orders.length === 0)) {
    return (
      <div className={styles.container}>
        <Header tableNumber={tableNumber} cartCount={0} />
        <main className={styles.mainContent}>
          <h2>Votre panier est vide</h2>
          <div className={styles.commandeContainer}>
            <button
              onClick={retourCategories}
              className={`${styles.orderButton} ${styles.categoriesButton}`}
              aria-label="Retourner aux catégories"
            >
              <FaArrowLeft style={{ marginRight: '5px' }} /> Retour aux catégories
            </button>
            <button
              onClick={ajouterAutreCommande}
              className={styles.orderButton}
              aria-label="Ajouter une autre commande"
            >
              Ajouter une autre commande
            </button>
          </div>
        </main>
        <Footer />
        <ToastContainer position="bottom-right" autoClose={2000} />
      </div>
    );
  }

  // Main cart view
  return (
    <div className={styles.container}>
      <Header
        tableNumber={tableNumber}
        cartCount={cart.reduce((a, c) => a + c.quantity, 0)}
      />
      <main className={styles.mainContent}>
        <h2>
          Panier - Table n°{tableNumber} (Addition: {bill?.id?.slice(0, 8) || 'N/A'})
        </h2>
        <div className={`${styles.cartContainer} ${isLoading ? styles.loading : ''}`}>
          {isLoading && (
            <div className={styles.loadingOverlay}>
              <div className={styles.spinner}></div>
            </div>
          )}
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
              {cart.map(item => (
                <tr key={item.cartItemId} className={styles.cartItem}>
                  <td>{item.name}</td>
                  <td>{formatCurrency(item.price)}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => {
                        const value = parseInt(e.target.value, 10);
                        updateQuantity(item.cartItemId, isNaN(value) ? 1 : value);
                      }}
                      className={styles.qtyInput}
                      aria-label={`Quantité pour ${item.name}`}
                      disabled={isLoading}
                    />
                  </td>
                  <td>{formatCurrency(new Decimal(item.price || 0).times(item.quantity || 1))}</td>
                  <td className={styles.actionsCell}>
                    <button
                      onClick={() => confirmModification(item)}
                      className={styles.modifyButton}
                      aria-label={`Modifier la quantité de ${item.name}`}
                      disabled={isLoading}
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => removeFromCart(item.cartItemId)}
                      className={styles.removeButton}
                      aria-label={`Supprimer ${item.name} du panier`}
                      disabled={isLoading}
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
                  {formatCurrency(totalPrice)}
                </td>
              </tr>
              <tr>
                <td colSpan="3" className={styles.totalLabel}>
                  Total addition :
                </td>
                <td colSpan="2" className={styles.totalPrice}>
                  {formatCurrency(bill?.totalBillAmount || 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className={styles.commandeContainer}>
          {!commandePassee ? (
            <>
              <button
                onClick={passerCommande}
                className={styles.orderButton}
                disabled={isLoading}
                aria-label="Passer la commande"
              >
                {isLoading ? 'Validation...' : 'Passer la commande'}
              </button>
              <button
                onClick={retourCategories}
                className={`${styles.orderButton} ${styles.categoriesButton}`}
                aria-label="Retourner aux catégories"
              >
                <FaArrowLeft style={{ marginRight: '5px' }} /> Retour aux catégories
              </button>
            </>
          ) : (
            <div className={styles.postOrderActions}>
              <p className={styles.successMessage}>
                Commande passée avec succès ! Vous pouvez continuer à ajouter des articles.
              </p>
              <button
                onClick={retourCategories}
                className={`${styles.orderButton} ${styles.categoriesButton}`}
                aria-label="Retourner aux catégories"
              >
                <FaArrowLeft style={{ marginRight: '5px' }} /> Retour aux catégories
              </button>
              <button
                onClick={ajouterAutreCommande}
                className={`${styles.orderButton} ${styles.newBillButton}`}
                aria-label="Ajouter une autre commande"
                disabled={isLoading}
              >
                Ajouter une autre commande
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