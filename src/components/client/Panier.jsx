import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaArrowLeft } from 'react-icons/fa';
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
    } catch (error) {
      console.error(`Error writing ${key} to localStorage:`, error);
      toast.error('Erreur lors de la sauvegarde des données.', { autoClose: 2000 });
    }
  },
  getSessionBill: tableNumber => {
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
    console.log(`Panier mis à jour dans localStorage pour table ${tableNumber}:`, newCart);
  },
  getCart: tableNumber => {
    const cart = storage.get(`cart_${tableNumber}`) || [];
    console.log(`Panier chargé depuis localStorage pour table ${tableNumber}:`, cart);
    return cart;
  },
  updateBills: newBills => {
    storage.set('bills', newBills);
    console.log('Bills mis à jour dans localStorage:', newBills);
  },
  clearCart: tableNumber => {
    storage.set(`cart_${tableNumber}`, []);
    console.log(`Panier vidé pour table ${tableNumber}`);
  },
  clearBillData: tableNumber => {
    const bills = storage.get('bills') || [];
    const updatedBills = bills.filter(bill => bill.tableNumber !== tableNumber);
    storage.set('bills', updatedBills);
    const sessionBills = storage.get('sessionBills') || {};
    delete sessionBills[tableNumber];
    storage.set('sessionBills', sessionBills);
    localStorage.removeItem('currentBillId');
    localStorage.removeItem('tableNumber');
    console.log(`Bill data and table number cleared for table ${tableNumber}`);
  },
};

export default function Panier() {
  const navigate = useNavigate();
  const [tableNumber, setTableNumber] = useState(() => {
    const num = localStorage.getItem('tableNumber') || '0';
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
    const sessionBillId = storage.getSessionBill(tableNumber);
    if (sessionBillId) {
      const bills = storage.get('bills') || [];
      const existingBill = bills.find(bill => bill.id === sessionBillId && bill.tableNumber === tableNumber);
      if (existingBill) {
        console.log('Bill existant chargé:', existingBill);
        return existingBill;
      }
    }
    const newBillId = generateUUID();
    const newBill = {
      id: newBillId,
      tableNumber,
      orders: [],
      totalBillAmount: 0,
    };
    const updatedBills = [...(storage.get('bills') || []), newBill];
    storage.updateBills(updatedBills);
    storage.setSessionBill(tableNumber, newBillId);
    console.log('Nouveau bill créé:', newBill);
    return newBill;
  }, [tableNumber]);

  // Synchronize table number, cart, and bill
  useEffect(() => {
    const storedTableNumber = localStorage.getItem('tableNumber') || '0';
    console.log('Syncing tableNumber:', storedTableNumber);
    if (storedTableNumber !== tableNumber) {
      // Clear data for previous table if table number changes
      if (tableNumber !== '0') {
        storage.clearCart(tableNumber);
        storage.clearBillData(tableNumber);
      }
      setTableNumber(storedTableNumber);
      setCart([]);
      setCommandePassee(false);
      if (storedTableNumber !== '0') {
        setBill(initializeBill());
      } else {
        setBill(null);
      }
    } else {
      const loadedCart = storage.getCart(storedTableNumber);
      setCart(loadedCart);
      setCommandePassee(false);
      if (storedTableNumber !== '0') {
        setBill(initializeBill());
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

  // Debounced quantity update
  const updateQuantity = useCallback(
    (cartItemId, quantity) => {
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
    },
    []
  );

  const removeFromCart = useCallback(
    cartItemId => {
      setCart(prevCart => {
        const newCart = prevCart.filter(item => item.cartItemId !== cartItemId);
        toast.info('Article supprimé du panier', { autoClose: 2000 });
        setCommandePassee(false);
        return newCart;
      });
    },
    []
  );

  const confirmModification = useCallback(
    item => {
      toast.success(`Quantité pour ${item.name} modifiée à ${item.quantity}`, {
        autoClose: 2000,
      });
      setCommandePassee(false);
    },
    []
  );

  const totalPrice = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  const passerCommande = useCallback(async () => {
    if (cart.length === 0) {
      toast.error('Votre panier est vide.', { autoClose: 2000 });
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
      if (!currentBill) {
        throw new Error('Bill not found in storage');
      }
      const newOrder = {
        id: generateUUID(),
        billId: bill.id,
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
      const updatedBill = {
        ...currentBill,
        orders: [...(currentBill.orders || []), newOrder],
        totalBillAmount: (currentBill.totalBillAmount || 0) + totalPrice,
      };
      const updatedBills = [...bills.filter(b => b.id !== bill.id), updatedBill];
      storage.updateBills(updatedBills);
      storage.setSessionBill(tableNumber, bill.id);
      setBill(updatedBill);
      toast.success('Commande passée avec succès ! Vous pouvez ajouter d’autres articles.', { autoClose: 2000 });
      setCommandePassee(true);
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Erreur lors de la validation de la commande.', { autoClose: 2000 });
    } finally {
      setIsLoading(false);
    }
  }, [cart, tableNumber, bill, totalPrice]);

  const ajouterAutreCommande = useCallback(() => {
    if (tableNumber === '0') {
      toast.error('Numéro de table non défini. Veuillez sélectionner une table.', { autoClose: 2000 });
      navigate('/client/choisir-tableau');
      return;
    }
    if (cart.length > 0) {
      passerCommande().then(() => {
        setCart([]); // Clear the cart after saving the order
        storage.updateCart([], tableNumber); // Update localStorage
        navigate('/client/menu?view=categories'); // Navigate to categories
      }).catch(error => {
        console.error('Error in ajouterAutreCommande:', error);
        toast.error('Erreur lors de l’ajout d’une autre commande.', { autoClose: 2000 });
      });
    } else {
      navigate('/client/menu?view=categories'); // Navigate directly if cart is empty
    }
  }, [passerCommande, navigate, cart, tableNumber]);

  const retourCategories = useCallback(() => {
    if (tableNumber === '0') {
      toast.error('Veuillez d’abord sélectionner un numéro de table.', {
        autoClose: 2000,
      });
      return;
    }
    if (cart.length > 0 && !commandePassee) {
      if (
        !window.confirm(
          'Vous avez des articles non commandés. Voulez-vous retourner aux catégories ?'
        )
      ) {
        return;
      }
    }
    navigate('/client/menu?view=categories');
  }, [navigate, tableNumber, cart, commandePassee]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (quantityTimeoutRef.current) {
        clearTimeout(quantityTimeoutRef.current);
      }
    };
  }, []);

  console.log('Rendering Panier with state:', {
    tableNumber,
    cart,
    commandePassee,
    isLoading,
    bill,
  });

  if (tableNumber === '0') {
    return (
      <div className={styles.container}>
        <Header tableNumber="" cartCount={0} />
        <main className={styles.mainContent}>
          <h2>Numéro de table non défini</h2>
          <p>Veuillez sélectionner une table pour continuer.</p>
          <button
            onClick={() => {
              if (tableNumber !== '0') {
                storage.clearCart(tableNumber);
                storage.clearBillData(tableNumber);
              }
              navigate('/client/choisir-tableau');
            }}
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

  if (cart.length === 0) {
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

  return (
    <div className={styles.container}>
      <Header
        tableNumber={tableNumber}
        cartCount={cart.reduce((a, c) => a + c.quantity, 0)}
      />
      <main className={styles.mainContent}>
        <h2>
          Panier - Table n°{tableNumber} (Addition: {bill?.id?.slice(0, 8)})
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
                  <td>{item.price.toFixed(2)} DT</td>
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
                  <td>{(item.price * item.quantity).toFixed(2)} DT</td>
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
                  {totalPrice.toFixed(2)} DT
                </td>
              </tr>
              <tr>
                <td colSpan="3" className={styles.totalLabel}>
                  Total addition :
                </td>
                <td colSpan="2" className={styles.totalPrice}>
                  {(bill?.totalBillAmount || 0).toFixed(2)} DT
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
                Commande passée avec succès ! Vous pouvez continuer à ajouter des
                articles.
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