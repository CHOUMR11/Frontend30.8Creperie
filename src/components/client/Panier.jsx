import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaArrowLeft } from 'react-icons/fa';
import Decimal from 'decimal.js';
import Header from '../common/Header';
import Footer from '../common/Footer';
import styles from './Panier.module.css';
import { postOrder } from '../../services/api';

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
  clearCart: tableNumber => {
    storage.set(`cart_${tableNumber}`, []);
    console.log(`Panier vidé pour table ${tableNumber}`);
  },
  clearBillData: tableNumber => {
    storage.remove(`cart_${tableNumber}`);
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
  const quantityTimeoutRef = useRef(null);

  // Synchronize table number and cart
  useEffect(() => {
    const storedTableNumber = storage.get('tableNumber') || '0';
    console.log('Syncing tableNumber:', storedTableNumber);
    if (storedTableNumber !== tableNumber) {
      setTableNumber(storedTableNumber);
      setCart(storage.getCart(storedTableNumber));
      setCommandePassee(false);
    } else {
      setCart(storage.getCart(storedTableNumber));
    }
  }, [tableNumber]);

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
    if (!tableNumber || tableNumber === '0') {
      toast.error('Numéro de table non défini.', { autoClose: 2000 });
      navigate('/client/menu');
      return;
    }
    setIsLoading(true);
    try {
      await postOrder({ tableNumber, items: cart.map(item => ({ menuItem: item._id, quantity: item.quantity })) });
      setCart([]);
      storage.clearCart(tableNumber); // Vider le panier dans localStorage
      toast.success('Commande passée avec succès ! Vous pouvez ajouter d’autres articles.', { autoClose: 2000 });
      setCommandePassee(true);
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Erreur lors de la validation de la commande.', { autoClose: 2000 });
    } finally {
      setIsLoading(false);
    }
  }, [cart, tableNumber, navigate]);

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
  }, [navigate, cart.length, commandePassee, tableNumber]);

  // Clear all data
  const clearAllData = useCallback(() => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer toutes les données de la table et du panier ?')) {
      storage.clearBillData(tableNumber);
      setTableNumber('0');
      setCart([]);
      setCommandePassee(false);
      toast.info('Données effacées.', { autoClose: 2000 });
      navigate('/client/menu');
    }
  }, [tableNumber, navigate]);

  // Display cart items
  const CartItem = ({ item }) => (
    <div className={styles.cartItem}>
      <div className={styles.itemInfo}>
        <span className={styles.itemName}>{item.name}</span>
        <span className={styles.itemPrice}>{formatCurrency(item.price)}</span>
      </div>
      <div className={styles.itemActions}>
        <input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) => updateQuantity(item.cartItemId, parseInt(e.target.value))}
          className={styles.quantityInput}
          disabled={commandePassee}
        />
        <button
          onClick={() => removeFromCart(item.cartItemId)}
          className={styles.removeButton}
          disabled={commandePassee}
        >
          Supprimer
        </button>
      </div>
    </div>
  );

  return (
    <div className={styles.panierContainer}>
      <Header />
      <ToastContainer />
      <div className={styles.content}>
        <div className={styles.header}>
          <button onClick={() => navigate('/client/menu')} className={styles.backButton}>
            <FaArrowLeft /> Retour au Menu
          </button>
          <h1>Votre Panier</h1>
          <button onClick={clearAllData} className={styles.clearButton}>
            Effacer tout
          </button>
        </div>

        {tableNumber === '0' ? (
          <div className={styles.emptyCart}>
            <p>Veuillez d'abord sélectionner un numéro de table sur la page du menu.</p>
            <button onClick={() => navigate('/client/menu')} className={styles.backToMenuButton}>
              Aller au Menu
            </button>
          </div>
        ) : cart.length === 0 ? (
          <div className={styles.emptyCart}>
            <p>Votre panier est vide pour la table {tableNumber}.</p>
            <button onClick={ajouterAutreCommande} className={styles.backToMenuButton}>
              Ajouter des articles
            </button>
          </div>
        ) : (
          <>
            <p className={styles.tableNumber}>Table N°: {tableNumber}</p>
            <div className={styles.cartItems}>
              {cart.map((item) => (
                <CartItem key={item.cartItemId} item={item} />
              ))}
            </div>

            <div className={styles.totalSection}>
              <h2>Total: {formatCurrency(totalPrice)}</h2>
              <button
                onClick={passerCommande}
                className={styles.commanderButton}
                disabled={isLoading || commandePassee}
              >
                {isLoading ? 'Envoi...' : 'Passer la Commande'}
              </button>
            </div>

            {commandePassee && (
              <div className={styles.postOrderActions}>
                <button onClick={ajouterAutreCommande} className={styles.addMoreButton}>
                  Ajouter une autre commande
                </button>
                <button onClick={retourCategories} className={styles.backToCategoriesButton}>
                  Retour aux Catégories
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
