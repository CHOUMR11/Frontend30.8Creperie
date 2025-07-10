import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getMenu } from '../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import Decimal from 'decimal.js';
import { debounce } from 'lodash';
import Header from '../common/Header';
import Footer from '../common/Footer';
import styles from './Menu.module.css';

// Import des images locales pour les catégories
import foodImage from '../../assets/food.jpg';
import drinksImage from '../../assets/Boissons.jpg';
import coffeeImage from '../../assets/cafe.jpg';
import teaImage from '../../assets/Thé.jpg';
import milkshakeImage from '../../assets/Milkshake.jpg';
import boxImage from '../../assets/Box.jpg';
import mojitoImage from '../../assets/Mojito.jpg';
import juiceImage from '../../assets/Jus.jpg';
import hotChocolateImage from '../../assets/Hot-Chocolate.jpg';
import frappuccinoImage from '../../assets/Frappucino.jpg';
import smoothieImage from '../../assets/Smoothie.jpg';
import jwajemImage from '../../assets/Jwajem.jpg';
import waffleImage from '../../assets/Gauffre.jpg';
import sweetCrepeImage from '../../assets/crepe-scuréé.jpg';
import cheesecakeImage from '../../assets/Cheescake.jpg';
import pancakeImage from '../../assets/pancake.jpg';
import savoryCrepeImage from '../../assets/crepe-salé.jpg';
import malfoufImage from '../../assets/MALFOUF.jpg';
import tacosImage from '../../assets/Tacos.jpg';
import omeletteImage from '../../assets/Omlette.jpg';
import paniniImage from '../../assets/sandwich-panini.jpg';
import breakfastImage from '../../assets/petit-dejeuner.jpg';
import frozenYogurtImage from '../../assets/yaourt-glacé.jpg';
import iceCreamScoopImage from '../../assets/Glace-Boule.jpg';
import iceCreamCupImage from '../../assets/Coupe-de-Glace.jpg';

// Utility function to format currency as XX.XXX DT
const formatCurrency = (amount) => {
  return `${Number(amount).toFixed(3)} DT`;
};

// Utility for generating UUIDs
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Storage utility with error handling
const storage = {
  get: (key) => {
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
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      console.log(`Removed ${key} from localStorage`);
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
      toast.error('Erreur lors de la suppression des données.', { autoClose: 2000 });
    }
  },
};

export default function Menu() {
  const [tableNumber, setTableNumber] = useState('');
  const [tableConfirmed, setTableConfirmed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [isMenuLoading, setIsMenuLoading] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const colors = {
    primary: '#5D4037',
    secondary: '#D7CCC8',
    accent: '#FF9800',
    light: '#FFF8F0',
    dark: '#3E2723',
    text: '#212121',
    lightText: '#757575',
    yellow: '#FFD600',
    white: '#FFFFFF',
  };

  const fixedCategories = [
    { name: 'Food', image: foodImage },
    { name: 'Boissons', image: drinksImage },
    { name: 'Café', image: coffeeImage },
    { name: 'Thé', image: teaImage },
    { name: 'Milkshake', image: milkshakeImage },
    { name: 'Moltov', image: boxImage },
    { name: 'Mojito', image: mojitoImage },
    { name: 'Jus', image: juiceImage },
    { name: 'Chocolat Chaud', image: hotChocolateImage },
    { name: 'Frappucino', image: frappuccinoImage },
    { name: 'Smoothie', image: smoothieImage },
    { name: 'Jwajem', image: jwajemImage },
    { name: 'Gauffre', image: waffleImage },
    { name: 'Crêpes Sucré', image: sweetCrepeImage },
    { name: 'Cheescake', image: cheesecakeImage },
    { name: 'Pancake', image: pancakeImage },
    { name: 'Crêpes Salé', image: savoryCrepeImage },
    { name: 'Malfouf', image: malfoufImage },
    { name: 'Tacos', image: tacosImage },
    { name: 'Omlette', image: omeletteImage },
    { name: 'Sandwich Panini', image: paniniImage },
    { name: 'Formule petit-déjeuner', image: breakfastImage },
    { name: 'Yaghourt Glacé', image: frozenYogurtImage },
    { name: 'Glace Boule', image: iceCreamScoopImage },
    { name: 'Coupe de glace', image: iceCreamCupImage },
    { name: 'Box', image: boxImage },
  ];

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value) => setCategorySearch(value), 300),
    []
  );

  // Restore table number and cart on mount
  useEffect(() => {
    const storedTableNumber = storage.get('tableNumber') || '';
    console.log('Menu.jsx useEffect - storedTableNumber:', storedTableNumber);
    if (
      storedTableNumber &&
      storedTableNumber !== '0' &&
      !isNaN(storedTableNumber) &&
      Number(storedTableNumber) > 0 &&
      storedTableNumber.length <= 3
    ) {
      setTableNumber(storedTableNumber);
      setTableConfirmed(true);
      console.log('Menu.jsx useEffect - Restored table:', storedTableNumber);
      const params = new URLSearchParams(location.search);
      if (params.get('view') === 'categories') {
        setSelectedCategory('');
        console.log('Menu.jsx useEffect - Showing categories view for table:', storedTableNumber);
      }
      const savedCart = storage.get(`cart_${storedTableNumber}`) || [];
      setCart(savedCart);
      console.log('Panier chargé depuis localStorage:', savedCart);
    } else {
      setTableNumber('');
      setTableConfirmed(false);
      setCart([]);
      storage.remove('tableNumber');
      console.log('Menu.jsx useEffect - No valid table number, showing table selection');
    }
  }, [location.search]);

  // Persist cart in localStorage
  useEffect(() => {
    if (tableNumber && tableConfirmed) {
      storage.set(`cart_${tableNumber}`, cart);
      console.log('Panier sauvegardé dans localStorage:', cart);
    }
  }, [cart, tableNumber, tableConfirmed]);

  // Fetch menu from backend
  useEffect(() => {
    if (!tableConfirmed) return;
    setIsMenuLoading(true);
    getMenu()
      .then((res) => {
        console.log('Menu API Response:', res);
        setMenuItems(res.data || []);
      })
      .catch((err) => {
        console.error('Error fetching menu:', err);
        toast.error('Erreur lors du chargement du menu');
      })
      .finally(() => {
        setIsMenuLoading(false);
      });
  }, [tableConfirmed]);

  // Calculate cart total with decimal precision
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      return new Decimal(total).plus(new Decimal(item.price).times(item.quantity)).toNumber();
    }, 0);
  }, [cart]);

  // Cart management functions
  const addToCart = useCallback((item) => {
    setCart((prev) => {
      console.log('Ajout au panier, article:', item);
      const newItem = {
        ...item,
        cartItemId: generateUUID(),
        quantity: 1,
      };
      const newCart = [...prev, newItem];
      console.log('Nouvel article ajouté, panier:', newCart);
      return newCart;
    });
    toast.success(`${item.name} ajouté au panier !`);
  }, []);

  const confirmTable = useCallback(() => {
    if (!tableNumber.trim() || Number(tableNumber) <= 0 || tableNumber.length > 3) {
      toast.error('Veuillez saisir un numéro de table valide (1 à 999)');
      return;
    }
    setTableConfirmed(true);
    storage.set('tableNumber', tableNumber);
    console.log('Table confirmée:', tableNumber);
  }, [tableNumber]);

  const resetTable = useCallback(() => {
    // Réinitialiser les états côté client
    setTableNumber('');
    setTableConfirmed(false);
    setCart([]);
    setSelectedCategory('');
    setCategorySearch('');
    setSelectedImage(null);

    // Supprimer les données du localStorage
    const keysToRemove = Object.keys(localStorage).filter(
      (key) => key === `cart_${tableNumber}` || key === `bill_${tableNumber}` || key === 'tableNumber'
    );
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    console.log(`Données de la table ${tableNumber} supprimées : panier et facture réinitialisés.`);
    toast.info('Table quittée. Panier et facture réinitialisés.');

    // Rediriger vers la page de menu
    navigate('/client/menu');
  }, [tableNumber, navigate]);

  const goToCart = useCallback(() => {
    console.log('Navigation vers /client/panier, panier actuel:', cart);
    navigate('/client/panier');
  }, [navigate, cart]);

  const handleImageClick = useCallback((imageUrl) => {
    setSelectedImage(imageUrl);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedImage(null);
  }, []);

  // Filter categories and menu items
  const filteredCategories = useMemo(() => {
    return fixedCategories.filter((cat) =>
      cat.name.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categorySearch]);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => item.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  const cartCount = cart.reduce((acc, cur) => acc + cur.quantity, 0);

  // Table selection screen
  if (!tableConfirmed) {
    return (
      <div className={styles.container}>
        <Header tableNumber={tableNumber} cartCount={cartCount} />
        <div className={styles.tableSelectionCard}>
          <h2 className={styles.title}>Choisissez votre numéro de table</h2>
          <input
            type="number"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            min="1"
            max="999"
            className={styles.tableInput}
            placeholder="Numéro de table"
            aria-label="Numéro de table"
          />
          <button
            onClick={confirmTable}
            className={styles.confirmButton}
            aria-label="Valider le numéro de table"
          >
            Valider
          </button>
        </div>
        <Footer />
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          toastStyle={{ backgroundColor: colors.dark, color: colors.white }}
        />
      </div>
    );
  }

  // Menu display screen
  return (
    <div className={styles.menuContainer}>
      <Header tableNumber={tableNumber} cartCount={cartCount} />
      <main className={styles.mainContent}>
        {!selectedCategory ? (
          <div className={styles.categorySection}>
            <h3 className={styles.sectionTitle}>Choisissez une catégorie</h3>
            <input
              type="text"
              value={categorySearch}
              onChange={(e) => debouncedSearch(e.target.value)}
              className={styles.searchInput}
              placeholder="Rechercher une catégorie..."
              aria-label="Rechercher une catégorie"
            />
            {isMenuLoading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner}>
                  <span className={styles.dot}></span>
                  <span className={styles.dot}></span>
                  <span className={styles.dot}></span>
                </div>
                <span className={styles.loadingText}>Mise à jour des catégories...</span>
              </div>
            ) : (
              <div className={styles.categoryGrid}>
                {filteredCategories.length === 0 ? (
                  <p className={styles.emptyMessage}>Aucune catégorie trouvée.</p>
                ) : (
                  filteredCategories.map((cat) => (
                    <div
                      key={cat.name}
                      className={styles.categoryCard}
                      onClick={() => setSelectedCategory(cat.name)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setSelectedCategory(cat.name);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Sélectionner la catégorie ${cat.name}`}
                    >
                      <div className={styles.categoryImageWrapper}>
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className={styles.categoryImage}
                        />
                      </div>
                      <span className={styles.categoryName}>{cat.name}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.menuSection}>
            <div className={styles.categoryHeader}>
              <button
                onClick={() => setSelectedCategory('')}
                className={styles.backButton}
                aria-label="Retourner à la liste des catégories"
              >
                ← Retourner à la liste des catégories
              </button>
              <h3 className={styles.categoryTitle}>
                Catégorie : {selectedCategory}
              </h3>
            </div>
            {isMenuLoading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner}>
                  <span className={styles.dot}></span>
                  <span className={styles.dot}></span>
                  <span className={styles.dot}></span>
                </div>
                <span className={styles.loadingText}>Mise à jour des articles...</span>
              </div>
            ) : filteredMenuItems.length === 0 ? (
              <p className={styles.emptyMessage}>
                Aucun article trouvé dans cette catégorie.
              </p>
            ) : (
              <div className={styles.menuGrid}>
                {filteredMenuItems.map((item) => {
                  console.log(`Item: ${item.name}, Image: ${item.imageUrl}`);
                  const getImageUrl = () => {
                    if (item.imageUrl && item.imageUrl.trim() !== '') {
                      if (item.imageUrl.startsWith('http')) {
                        return item.imageUrl;
                      }
                      return `https://backendmenu-3.onrender.com${item.imageUrl.replace(
                        /^\/+/,
                        ''
                      )}`;
                    }
                    return 'https://picsum.photos/200/100?random=2000';
                  };

                  const imageUrl = getImageUrl();

                  return (
                    <div key={item._id} className={styles.menuItemCard}>
                      <div className={styles.itemImageContainer}>
                        <LazyLoadImage
                          src={imageUrl}
                          alt={item.name}
                          effect="blur"
                          placeholderSrc="https://picsum.photos/200/100?random=200"
                          className={styles.itemImage}
                          onClick={() => handleImageClick(imageUrl)}
                          onError={(e) => {
                            console.warn(`Erreur chargement image pour ${item.name}: ${imageUrl}`);
                            toast.error(`Impossible de charger l'image pour ${item.name}`);
                            e.target.src = 'https://picsum.photos/200/100?random=200';
                          }}
                          style={{ cursor: 'pointer' }}
                          aria-label={`Agrandir l'image de ${item.name}`}
                        />
                      </div>
                      <div className={styles.itemDetails}>
                        <h4 className={styles.menuItemName}>{item.name}</h4>
                        <p className={styles.itemDescription}>
                          {item.description || '...'}
                        </p>
                        <div className={styles.itemFooter}>
                          <span className={styles.itemPrice}>
                            {formatCurrency(item.price)}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCart(item)}
                            className={styles.addToCartButton}
                            aria-label={`Ajouter ${item.name} au panier`}
                          >
                            Ajouter
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
      <div className={styles.floatingCartButton}>
        <button
          className={styles.cartButton}
          onClick={goToCart}
          aria-label={`Voir le panier avec ${cartCount} articles`}
        >
          <span className={styles.cartIcon}></span>
          {cartCount > 0 && (
            <span className={styles.cartBadge}>{cartCount}</span>
          )}
        </button>
      </div>
      {selectedImage && (
        <div
          className={styles.imageModal}
          onClick={closeModal}
          role="dialog"
          aria-label="Image agrandie"
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.closeModalButton}
              onClick={closeModal}
              aria-label="Fermer l'image agrandie"
            >
              ✕
            </button>
            <LazyLoadImage
              src={selectedImage}
              alt="Image agrandie"
              effect="blur"
              placeholderSrc="https://picsum.photos/600/400"
              className={styles.modalImage}
              onError={(e) => {
                console.warn(`Erreur chargement modal image: ${selectedImage}`);
                toast.error('Impossible de charger l\'image agrandie');
                e.target.src = 'https://picsum.photos/600/400';
              }}
            />
          </div>
        </div>
      )}
      <div className={styles.resetButtonContainer}>
        <button
          type="button"
          onClick={resetTable}
          className={styles.resetButton}
          aria-label="Quitter la table"
        >
          Quitter la table
        </button>
      </div>
      <Footer />
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        toastStyle={{ backgroundColor: colors.dark, color: colors.white }}
      />
    </div>
  );
}