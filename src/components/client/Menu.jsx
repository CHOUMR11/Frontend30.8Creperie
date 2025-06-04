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
import frappuccinoImage from '../../assets/Frappucino.jpg';
import smoothieImage from '../../assets/Smoothie.jpg';
import jwajemImage from '../../assets/Jwajem.jpg';
import waffleImage from '../../assets/Gauffre.jpg';
import sweetCrepeImage from '../../assets/crepe-scuréé.jpg'; // Corrected filename
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

export default function Menu() {
  /** ──────────────────────────────────────────────────────────────────────
   *  State management
   *  ───────────────────────────────────────────────────────────────────────
   */
  const [tableNumber, setTableNumber] = useState(() =>
    localStorage.getItem('tableNumber') || '0'
  );
  const [tableConfirmed, setTableConfirmed] = useState(() =>
    localStorage.getItem('tableNumber') !== '0'
  );
  const [selectedCategory, setSelectedCategory] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState(() =>
    JSON.parse(localStorage.getItem(`cart_${localStorage.getItem('tableNumber') || '0'}`)) || []
  );
  const [loading, setLoading] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [selectedImage, setSelectedImage] = useState(null); // Pour la modale

  // navigation hook (pour rediriger vers /cart, etc.)
  const navigate = useNavigate();

  // Schéma de couleurs (peut être utilisé dans le style inline ou ailleurs)
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

  // Catégories fixes + images associées
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
  // 1️⃣ Récupérer le numéro de table + panier depuis localStorage
  useEffect(() => {
    const storedTableNumber = localStorage.getItem('tableNumber') || '0';
    setTableNumber(storedTableNumber);
    setTableConfirmed(storedTableNumber !== '0');
    setCart(JSON.parse(localStorage.getItem(`cart_${storedTableNumber}`)) || []);
  }, []);

  // 2️⃣ Persister le panier dans localStorage dès que cart ou tableNumber change
  useEffect(() => {
    if (tableNumber !== '0') {
      localStorage.setItem(`cart_${tableNumber}`, JSON.stringify(cart));
    }
  }, [cart, tableNumber]);

  // 3️⃣ Récupérer le menu depuis le backend lorsque la table est confirmée
  useEffect(() => {
    if (!tableConfirmed) return;

    setLoading(true);
    getMenu()
      .then((res) => {
        console.log('Menu API Response:', res);
        // res.data doit être un array d’objets { _id, name, price, description, imageUrl, category, … }
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
   *  Calcul du total du panier (memoisé pour éviter recalculs inutiles)
   *  ───────────────────────────────────────────────────────────────────────
   */
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  /** ──────────────────────────────────────────────────────────────────────
   *  Fonctions ⇢ Gestion du panier
   *  ───────────────────────────────────────────────────────────────────────
   */
  // Ajouter un item au panier (ou incrémenter la quantité si déjà présent)
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

  // Confirmer le numéro de table (bouton “Valider”)
  const confirmTable = useCallback(() => {
    if (!tableNumber.trim() || Number(tableNumber) <= 0) {
      toast.error('Veuillez saisir un numéro de table valide');
      return;
    }
    setTableConfirmed(true);
    localStorage.setItem('tableNumber', tableNumber);
    setCart(JSON.parse(localStorage.getItem(`cart_${tableNumber}`)) || []);
  }, [tableNumber]);

  // Réinitialiser la table (bouton “Quitter la table”)
  const resetTable = useCallback(() => {
    setTableNumber('0');
    setTableConfirmed(false);
    setCart([]);
    localStorage.setItem('tableNumber', '0');
    localStorage.setItem(`cart_${tableNumber}`, JSON.stringify([]));
    toast.info('Numéro de table réinitialisé.');
  }, [tableNumber]);

  // Aller vers la page du panier (non utilisé pour l'instant, mais prêt)
  const goToCart = useCallback(() => {
    navigate('/cart');
  }, [navigate]);

  // Ouvrir la modale d’image
  const handleImageClick = useCallback((imageUrl) => {
    setSelectedImage(imageUrl);
  }, []);

  // Fermer la modale
  const closeModal = useCallback(() => {
    setSelectedImage(null);
  }, []);

  /** ──────────────────────────────────────────────────────────────────────
   *  Filtrage ⇢ Catégories & Items
   *  ───────────────────────────────────────────────────────────────────────
   */
  // Filtrer dynamiquement la liste fixe de catégories
  const filteredCategories = useMemo(() => {
    return fixedCategories.filter((cat) =>
      cat.name.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categorySearch]);

  // Une fois qu'une catégorie est sélectionnée, ne garder que les items de cette catégorie
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => item.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  // Nombre total d’articles dans le panier
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
   *  Écran “Affichage du menu” (table confirmée)
   *  ───────────────────────────────────────────────────────────────────────
   */
  return (
    <div className={styles.menuContainer}>
      <Header tableNumber={tableNumber} cartCount={cartCount} />

      <main className={styles.mainContent}>
        {/* Si aucune catégorie sélectionnée → afficher le carrousel de catégories */}
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
              <div className={styles.loadingIndicator}>Chargement...</div>
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
          /* Affichage des items pour la catégorie choisie */
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
              <div className={styles.loadingIndicator}>Chargement...</div>
            ) : filteredMenuItems.length === 0 ? (
              <p className={styles.emptyMessage}>
                Aucun article trouvé dans cette catégorie.
              </p>
            ) : (
              <div className={styles.menuGrid}>
                {filteredMenuItems.map((item) => {
                  // Pour diagnostiquer l’URL d’image
                  console.log(`Item: ${item.name}, Image: ${item.imageUrl}`);

                  // Gestion robuste de l'URL de l’image (soit absolue soit relative)
                  const getImageUrl = () => {
                    if (item.imageUrl && item.imageUrl.trim() !== '') {
                      // Si c’est une URL complète, on l’utilise telle quelle
                      if (item.imageUrl.startsWith('http')) {
                        return item.imageUrl;
                      }
                      // Sinon, on suppose que c’est un chemin relatif envoyé par le backend
                      return `https://back-end-digi-food-fn5i.vercel.app/${item.imageUrl.replace(
                        /^\/+/,
                        ''
                      )}`;
                    }
                    // Si aucune image fournie, fallback aléatoire
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
                            {item.price.toFixed(2)} DT
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

      {/* Modale pour agrandir l’image */}
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

      {/* Bouton “Quitter la table” */}
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
