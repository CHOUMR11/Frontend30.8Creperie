import React, { useEffect } from 'react';
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import GestionMenu from '../components/admin/GestionMenu';
import ListeCommandes from '../components/admin/ListeCommandes';

export default function AdminPage() {
  const navigate = useNavigate();

  // Vérification de l'authentification au chargement
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (isAuthenticated !== 'true') {
      navigate('/admin/login');
    }
  }, [navigate]);

  // Gestion de la déconnexion
  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/admin/login');
  };

  return (
    <div style={pageContainer}>
      {/* Barre supérieure sous le Header */}
      <div style={topBarContainer}>
        <div style={adminInfo}>
          <span>👤 Connecté en tant qu'Admin</span>
        </div>
        <button onClick={handleLogout} style={logoutStyle}>
          🚪 Se déconnecter
        </button>
      </div>

      {/* Menu de navigation */}
      <div style={navContainerStyle}>
        <Link to="/admin/menu">
          <button style={buttonStyle}>📋 Gestion du Menu</button>
        </Link>
        <Link to="/admin/commandes">
          <button style={buttonStyle}>📦 Liste des Commandes</button>
        </Link>
      </div>

      {/* Contenu interne des routes admin */}
      <div style={{ marginTop: '2rem', padding: '1rem' }}>
        <Routes>
          <Route index element={<Navigate to="menu" replace />} />
          <Route path="menu" element={<GestionMenu />} />
          <Route path="commandes" element={<ListeCommandes />} />
        </Routes>
      </div>
    </div>
  );
}

// 💄 Styles
const pageContainer = {
  padding: '1rem',
};

const topBarContainer = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#e9ecef',
  padding: '1rem',
  borderRadius: '8px',
  marginBottom: '2rem',
  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
};

const adminInfo = {
  fontSize: '1.1rem',
  fontWeight: '500',
};

const logoutStyle = {
  padding: '0.6rem 1.2rem',
  fontSize: '1rem',
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
};

const navContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1rem',
};

const buttonStyle = {
  padding: '0.8rem 2rem',
  fontSize: '1rem',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
};
