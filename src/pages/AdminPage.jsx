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
    navigate('/admin/login'); // Redirige vers la page de connexion
  };

  return (
    <div style={{ padding: '1rem' }}>
      {/* Top bar : message de bienvenue + bouton de déconnexion */}
      <div style={topBarStyle}>
        <span style={welcomeStyle}>Bienvenue, Admin 👋</span>
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

      {/* Routes internes de la page admin */}
      <div style={{ marginTop: '2rem', padding: '1rem' }}>
        <Routes>
          {/* Redirection automatique vers /admin/menu */}
          <Route path="/" element={<Navigate to="/admin/menu" replace />} />
          <Route path="/menu" element={<GestionMenu />} />
          <Route path="/commandes" element={<ListeCommandes />} />
        </Routes>
      </div>
    </div>
  );
}

// 💄 Styles
const topBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
  padding: '0.5rem 1rem',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
};

const welcomeStyle = {
  fontSize: '1.2rem',
  fontWeight: 'bold',
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
