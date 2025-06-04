import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Confirmation() {
  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const commandes = JSON.parse(localStorage.getItem('commandes')) || [];

    if (cart.length > 0) {
      const nouvelleCommande = {
        id: Date.now(), // identifiant unique
        items: cart,
        date: new Date().toLocaleString(),
        total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      };

      commandes.push(nouvelleCommande);
      localStorage.setItem('commandes', JSON.stringify(commandes));
      localStorage.removeItem('cart'); // vider le panier
    }
  }, []);

  return (
    <div>
      <h2>Commande confirmée ✅</h2>
      <p>Merci pour votre commande !</p>
      <Link to="/client/menu">Retour au menu</Link>
    </div>
  );
}
