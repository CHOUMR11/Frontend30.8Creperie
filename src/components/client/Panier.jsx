import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaArrowLeft } from 'react-icons/fa';
import Decimal from 'decimal.js';
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

// Storage utility with error handling
const storage = {
  get: key => {
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
    }
  },
  remove: key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
    }
  },
  getCart: tableNumber => {
    return storage.get(`cart_${tableNumber}`) || [];
  },
  updateCart: (newCart, tableNumber) => {
    storage.set(`cart_${tableNumber}`, newCart);
  },
  clearCart: tableNumber => {
    storage.set(`cart_${tableNumber}`, []);
  },
  clearBillData: tableNumber => {
    storage.remove(`cart_${tableNumber}`);
    storage.remove('tableNumber');
  },
};

export default function Panier() {
  const navigate = useNavigate();
  const [tableNumber, setTableNumber] = useState(() => {
    return storage.get('tableNumber') || '0';
  });
  const [cart, setCart] = useState(() => {
    return storage.getCart(tableNumber);
  });
  const [commandePassee, setCommandePassee] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const quantityTimeoutRef = useRef(null);

  // Synchronize table number and cart
  useEffect(() => {
    const storedTableNumber = storage.get('tableNumber') || '0';
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
      toast.error('Quantite invalide.', { autoClose: 2000 });
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
        toast.info('Quantite mise a jour', { autoClose: 2000 });
        setCommandePassee(false);
        return newCart;
      });
    }, 300);
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((cartItemId) => {
    setCart(prevCart => {
      const newCart = prevCart.filter(item => item.cartItemId !== cartItemId);
      toast.info('Article supprime du panier', { autoClose: 2000 });
      setCommandePassee(false);
      return newCart;
    });
  }, []);

  // Calculate cart total with Decimal.js
  const totalPrice = useMemo(() => {
    const total = cart.reduce((sum, item) => {
      const itemTotal = new Decimal(item.price || 0).times(item.quantity || 1);
      return sum.plus(itemTotal);
    }, new Decimal(0));
    return total.toNumber();
  }, [cart]);

  // Place order - sends to backend API
  const passerCommande = useCallback(async () => {
    if (cart.length === 0) {
      toast.error('Votre panier est vide.', { autoClose: 2000 });
      return;
    }
    if (!tableNumber || tableNumber === '0') {
      toast.error('Numero de table non defini.', { autoClose: 2000 });
      navigate('/client/menu');
      return;
    }
    setIsLoading(true);
    try {
      await postOrder({
        tableNumber,
        items: cart.map(item => ({
          menuItem: item._id || item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      });
      setCart([]);
      storage.clearCart(tableNumber);
      toast.success('Commande envoyee avec succes !', { autoClose: 2000 });
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
      toast.error('Veuillez selectionner une table.', { autoClose: 2000 });
      navigate('/client/menu');
      return;
    }
    setCommandePassee(false);
    navigate('/client/menu?view=categories');
  }, [navigate, tableNumber]);

  // Return to categories
  const retourCategories = useCallback(() => {
    if (tableNumber === '0') {
      toast.error('Veuillez selectionner un numero de table.', { autoClose: 2000 });
      navigate('/client/menu');
      return;
    }
    if (cart.length > 0 && !commandePassee) {
      if (!window.confirm('Vous avez des articles non commandes. Voulez-vous retourner aux categories ?')) {
        return;
      }
    }
    navigate('/client/menu?view=categories');
  }, [navigate, cart.length, commandePassee, tableNumber]);

  // Clear all data
  const clearAllData = useCallback(() => {
    if (window.confirm('Effacer toutes les donnees de la table et du panier ?')) {
      storage.clearBillData(tableNumber);
      setTableNumber('0');
      setCart([]);
      setCommandePassee(false);
      toast.info('Donnees effacees.', { autoClose: 2000 });
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
          aria-label={`Quantite de ${item.name}`}
        />
        <button
          onClick={() => removeFromCart(item.cartItemId)}
          className={styles.removeButton}
          disabled={commandePassee}
          aria-label={`Supprimer ${item.name}`}
        >
          Supprimer
        </button>
      </div>
    </div>
  );

  return (
    <div className={styles.panierContainer}>
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
            <p>Veuillez selectionner un numero de table sur la page du menu.</p>
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
            <p className={styles.tableNumber}>Table N : {tableNumber}</p>
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
                  Retour aux Categories
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
