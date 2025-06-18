import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getMenu } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
import frappuccinoImage from '../../assets/frappucino.jpg';
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

export default function Menu() {
  /** ──────────────────────────────────────────────────────────────────────
   *  State management
   *  ───────────────────────────────────────────────────────────────────────
   */
  const [tableNumber, setTableNumber] = useState('');
  const [tableConfirmed, setTableConfirmed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  const navigate = useNavigate();

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

  /** ──────────────────────────────────────────────────────────────────────
   *  Effets ⇢ Initialisation / Persistance
   *  ───────────────────────────────────────────────────────────────────────
   */
  // 1️⃣ Reset table number and cart on component mount to force table selection
  useEffect(() => {
    // Clear localStorage and reset state to ensure table selection on every visit
    localStorage.removeItem('tableNumber');
    localStorage.removeItem('cart_0'); // Clear default cart
    setTableNumber('');
    setTableConfirmed(false);
    setCart([]);
  }, []); // Empty dependency array ensures this runs only on mount

  // 2️⃣ Persist the cart in localStorage when cart or tableNumber changes
  useEffect(() => {
    if (tableNumber !== '' && tableConfirmed) {
      localStorage.setItem(`cart_${tableNumber}`, JSON.stringify(cart));
    }
  }, [cart, tableNumber, tableConfirmed]);

  // 3️⃣ Fetch menu from backend when table is confirmed
  useEffect(() => {
    if (!tableConfirmed) return;

    setLoading(true);
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
        setLoading(false);
      });
  }, [tableConfirmed]);

  /** ──────────────────────────────────────────────────────────────────────
   *  Calcul du total du panier
   *  ───────────────────────────────────────────────────────────────────────
   */
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  /** ──────────────────────────────────────────────────────────────────────
   *  Fonctions ⇢ Gestion du panier
   *  ───────────────────────────────────────────────────────────────────────
   */
  const addToCart = useCallback((item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i._id === item._id);
      if (existing) {
        return prev.map((i) =>
          i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} ajouté au panier !`);
  }, []);

  const confirmTable = useCallback(() => {
    if (!tableNumber.trim() || Number(tableNumber) <= 0) {
      toast.error('Veuillez saisir un numéro de table valide');
      return;
    }
    setTableConfirmed(true);
    localStorage.setItem('tableNumber', tableNumber);
  }, [tableNumber]);

  const resetTable = useCallback(() => {
    setTableNumber('');
    setTableConfirmed(false);
    setCart([]);
    localStorage.removeItem('tableNumber');
    localStorage.removeItem(`cart_${tableNumber}`);
    toast.info('Numéro de table réinitialisé.');
  }, [tableNumber]);

  const goToCart = useCallback(() => {
    console.log('Navigating to /client/panier');
    navigate('/client/panier');
  }, [navigate]);

  const handleImageClick = useCallback((imageUrl) => {
    setSelectedImage(imageUrl);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedImage(null);
  }, []);

  /** ──────────────────────────────────────────────────────────────────────
   *  Filtrage ⇢ Catégories & Items
   *  ───────────────────────────────────────────────────────────────────────
   */
  const filteredCategories = useMemo(() => {
    return fixedCategories.filter((cat) =>
      cat.name.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categorySearch]);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => item.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  const cartCount = cart.reduce((acc, cur) => acc + cur.quantity, 0);

  /** ──────────────────────────────────────────────────────────────────────
   *  Écran “Choix du numéro de table”
   *  ───────────────────────────────────────────────────────────────────────
   */
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
      </div>
    );
  }

  /** ──────────────────────────────────────────────────────────────────────
   *  Écran “Affichage du menu”
   *  ───────────────────────────────────────────────────────────────────────
   */
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
              onChange={(e) => setCategorySearch(e.target.value)}
              className={styles.searchInput}
              placeholder="Rechercher une catégorie..."
              aria-label="Rechercher une catégorie"
            />
            {loading ? (
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
                ← Retour aux catégories
              </button>
              <h3 className={styles.categoryTitle}>
                Catégorie : {selectedCategory}
              </h3>
            </div>

            {loading ? (
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
                        <img
                          src={imageUrl}
                          alt={item.name}
                          className={styles.itemImage}
                          onClick={() => handleImageClick(imageUrl)}
                          onError={(e) => {
                            console.warn(
                              `Erreur chargement image pour ${item.name}: ${imageUrl}`
                            );
                            e.target.onerror = null;
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
            <img
              src={selectedImage}
              alt="Image agrandie"
              className={styles.modalImage}
              onError={(e) => {
                console.warn(`Erreur chargement modal image: ${selectedImage}`);
                e.target.src = 'https://picsum.photos/600/300?random=3';
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
          aria-label="Réinitialiser le numéro de table"
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