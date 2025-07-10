import React, { useState, useEffect } from 'react';
import styles from './GestionMenu.module.css';

export default function GestionMenu() {
  const [menu, setMenu] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    imageUrl: '',
    category: '',
  });
  const [editIndex, setEditIndex] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Point all requests to the correct endpoint
  const API_URL = 'https://backendmenu-3.onrender.com/api/menu';

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      try {
        const res = await fetch(API_URL);
        if (!res.ok) {
          throw new Error(`Erreur réseau: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        console.log('Raw API response:', data); // Debugging
        // Handle different response structures
        let menuData = [];
        if (Array.isArray(data)) {
          menuData = data;
        } else if (data && Array.isArray(data.data)) {
          menuData = data.data; // Handle { data: [...] } structure
        } else {
          throw new Error('Réponse API invalide: les données ne sont pas un tableau');
        }
        // Map _id → id to normalize
        const normalizedData = menuData.map((item) => ({
          id: item._id || item.id || `temp-${Math.random().toString(36).substr(2, 9)}`, // Fallback ID
          name: item.name || '',
          price: item.price || 0,
          description: item.description || '',
          imageUrl: item.imageUrl || '',
          category: item.category || '',
        }));
        setMenu(normalizedData);
      } catch (err) {
        console.error('Erreur chargement menu:', err.message, err.stack);
        setError(`Erreur lors du chargement du menu: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'price'
          ? value === ''
            ? ''
            : parseFloat(value) || ''
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate required fields
    if (!formData.name || formData.price === '' || !formData.category) {
      setError('Nom, prix et catégorie sont obligatoires');
      return;
    }
    if (isNaN(formData.price) || formData.price <= 0) {
      setError('Le prix doit être un nombre positif');
      return;
    }
    setError(null);

    const payload = {
      name: formData.name,
      price: parseFloat(formData.price),
      description: formData.description,
      imageUrl: formData.imageUrl,
      category: formData.category,
    };

    try {
      if (editIndex !== null) {
        // Update existing item
        const itemToUpdate = menu[editIndex];
        const response = await fetch(`${API_URL}/${itemToUpdate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Erreur lors de la mise à jour: ${response.status}`
          );
        }
        const updatedItem = await response.json();
        const normalizedUpdatedItem = {
          id: updatedItem._id || updatedItem.id,
          name: updatedItem.name,
          price: updatedItem.price,
          description: updatedItem.description,
          imageUrl: updatedItem.imageUrl,
          category: updatedItem.category,
        };
        const updatedMenu = [...menu];
        updatedMenu[editIndex] = normalizedUpdatedItem;
        setMenu(updatedMenu);
        setEditIndex(null);
      } else {
        // Create new item
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Erreur lors de l'ajout: ${response.status}`
          );
        }
        const newItem = await response.json();
        const normalizedNewItem = {
          id: newItem._id || newItem.id,
          name: newItem.name,
          price: newItem.price,
          description: newItem.description,
          imageUrl: newItem.imageUrl,
          category: newItem.category,
        };
        setMenu([...menu, normalizedNewItem]);
      }

      setFormData({
        name: '',
        price: '',
        description: '',
        imageUrl: '',
        category: '',
      });
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err.message, err.stack);
      setError(`Erreur lors de la sauvegarde: ${err.message}`);
    }
  };

  const handleDelete = async (index) => {
    if (!window.confirm('Supprimer cet élément ?')) return;

    try {
      const itemToDelete = menu[index];
      if (!itemToDelete.id) throw new Error('ID manquant');
      const response = await fetch(`${API_URL}/${itemToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Erreur lors de la suppression: ${response.status}`
        );
      }
      const updated = [...menu];
      updated.splice(index, 1);
      setMenu(updated);
    } catch (err) {
      console.error('Erreur suppression:', err.message, err.stack);
      setError(`Erreur lors de la suppression: ${err.message}`);
    }
  };

  const handleEdit = (index) => {
    setEditIndex(index);
    setFormData({
      name: menu[index].name,
      price: menu[index].price.toString(),
      description: menu[index].description,
      imageUrl: menu[index].imageUrl,
      category: menu[index].category,
    });
  };

  const handleCancel = () => {
    setEditIndex(null);
    setFormData({ name: '', price: '', description: '', imageUrl: '', category: '' });
    setError(null);
  };

  if (loading) return <div className={styles.loading}>Chargement du menu...</div>;

  return (
    <div className={styles.container}>
      <h2>Gestion du Menu</h2>
      {error && <div className={styles.errorMessage}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label className={styles.label} htmlFor="name">
            Nom de l'article
          </label>
          <input
            id="name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className={styles.input}
            placeholder="Ex: Burger Classic"
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label} htmlFor="price">
            Prix (DT)
          </label>
          <input
            id="price"
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            step="0.01"
            min="0"
            required
            className={styles.input}
            placeholder="Ex: 12.50"
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label} htmlFor="category">
            Catégorie
          </label>
          <input
            id="category"
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className={styles.input}
            placeholder="Ex: Food"
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label} htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={styles.textarea}
            placeholder="Ex: Délicieux burger au bœuf grillé"
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label} htmlFor="imageUrl">
            URL de l'image
          </label>
          <input
            id="imageUrl"
            type="text"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            className={styles.input}
            placeholder="Ex: https://example.com/image.jpg"
          />
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.button}>
            {editIndex !== null ? 'Modifier' : 'Ajouter'}
          </button>
          {editIndex !== null && (
            <button type="button" onClick={handleCancel} className={styles.button}>
              Annuler
            </button>
          )}
        </div>
      </form>

      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Nom</th>
            <th className={styles.th}>Prix (DT)</th>
            <th className={styles.th}>Catégorie</th>
            <th className={styles.th}>Description</th>
            <th className={styles.th}>Image</th>
            <th className={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {menu.length === 0 ? (
            <tr>
              <td colSpan="6" align="center">
                Aucun article dans le menu
              </td>
            </tr>
          ) : (
            menu.map((item, index) => (
              <tr key={item.id} className={styles.tr}>
                <td className={styles.td}>{item.name}</td>
                <td className={styles.td}>{item.price.toFixed(2)}</td>
                <td className={styles.td}>{item.category || 'Non défini'}</td>
                <td className={styles.td}>
                  {item.description || 'Aucune description'}
                </td>
                <td className={styles.td}>
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className={styles.image}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.appendChild(
                          document.createTextNode('Image non disponible')
                        );
                      }}
                    />
                  ) : (
                    <em>Pas d'image</em>
                  )}
                </td>
                <td className={styles.td}>
                  <button
                    onClick={() => handleEdit(index)}
                    className={`${styles.actionButton} ${styles.editButton}`}
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(index)}
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}