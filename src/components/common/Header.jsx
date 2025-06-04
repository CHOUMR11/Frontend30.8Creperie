import React from 'react';
import { Link } from 'react-router-dom';
import { FaUtensils, FaShoppingCart, FaUserShield } from 'react-icons/fa'; // <-- icônes ajoutées
import './Header.css';
import logo from '/src/assets/logo.png';

export default function Header() {
  return (
    <header className="header" style={{ padding: '1rem 1.5rem', backgroundColor: '#000' }}>
      <div className="header-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/client/menu" className="logo-link" style={{ display: 'flex', alignItems: 'center' }}>
          <img src={logo} alt="Crêperie 30.8 Logo" className="logo" style={{ height: '40px' }} />
        </Link>
        <nav className="nav-links" style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/client/menu" style={{ margin: '0 1rem', fontSize: '1rem', color: '#FFD700', display: 'flex', alignItems: 'center' }}>
            <FaUtensils style={{ marginRight: '0.4rem' }} /> Menu
          </Link>
          <Link to="/client/panier" style={{ margin: '0 1rem', fontSize: '1rem', color: '#FFD700', display: 'flex', alignItems: 'center' }}>
            <FaShoppingCart style={{ marginRight: '0.4rem' }} /> Panier
          </Link>
          <Link to="/admin" style={{ margin: '0 1rem', fontSize: '1rem', color: '#FFD700', display: 'flex', alignItems: 'center' }}>
            <FaUserShield style={{ marginRight: '0.4rem' }} /> Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
