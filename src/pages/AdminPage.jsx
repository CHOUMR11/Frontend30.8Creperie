import React, { useEffect } from 'react';
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import GestionMenu from '../components/admin/GestionMenu';
import ListeCommandes from '../components/admin/ListeCommandes';

export default function AdminPage() {
  const navigate = useNavigate();

  // Vérifie l'authentification
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (isAuthenticated !== 'true') {
      navigate('/admin/login');
    }
  }, [navigate]);

  // Déconnexion
  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/admin/login');
  };

  // Retour à la page d'accueil
  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div style={pageContainer}>
      {/* 🔝 Barre supérieure simplifiée */}
      <div style={topBarStyle}>
        <div style={adminInfo}>
          👤 <strong>Bienvenue, Admin</strong>
        </div>
      </div>

      {/* 🧱 Corps de la page */}
      <div style={bodyStyle}>
        <div style={headerContainer}>
          <h2 style={titleStyle}>Espace d'administration</h2>
          
          {/* Groupe de boutons */}
          <div style={buttonGroup}>
            <button onClick={handleGoHome} style={secondaryButtonStyle}>
              ← Accueil
            </button>
            <button onClick={handleLogout} style={logoutButtonStyle}>
              🚪 Déconnexion
            </button>
          </div>
        </div>

        {/* 📋 Navigation */}
        <div style={navContainerStyle}>
          <Link to="/admin/menu">
            <button style={buttonStyle}>📋 Gestion du Menu</button>
          </Link>
          <Link to="/admin/commandes">
            <button style={buttonStyle}>📦 Liste des Commandes</button>
          </Link>
        </div>

        {/* 🧩 Contenu interne */}
        <div style={contentContainer}>
          <Routes>
            <Route index element={<Navigate to="menu" replace />} />
            <Route path="menu" element={<GestionMenu />} />
            <Route path="commandes" element={<ListeCommandes />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

//
// 💄 STYLES
//
const pageContainer = {
  padding: '1rem',
  maxWidth: '1200px',
  margin: '0 auto',
};

const topBarStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#f8f9fa',
  padding: '1rem',
  borderRadius: '8px',
  marginBottom: '2rem',
  borderBottom: '1px solid #eaeaea',
};

const adminInfo = {
  fontSize: '1.1rem',
  fontWeight: '500',
};

const bodyStyle = {
  backgroundColor: '#ffffff',
  padding: '2rem',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
};

const headerContainer = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
  flexWrap: 'wrap',
  gap: '1rem',
};

const titleStyle = {
  color: '#2c3e50',
  fontSize: '1.8rem',
  fontWeight: '600',
  margin: 0,
};

const buttonGroup = {
  display: 'flex',
  gap: '0.8rem',
};

const secondaryButtonStyle = {
  padding: '0.6rem 1.2rem',
  fontSize: '0.95rem',
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontWeight: '500',
  ':hover': {
    backgroundColor: '#5a6268',
    transform: 'translateY(-2px)',
  }
};

const logoutButtonStyle = {
  padding: '0.6rem 1.2rem',
  fontSize: '0.95rem',
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontWeight: '500',
  ':hover': {
    backgroundColor: '#bd2130',
    transform: 'translateY(-2px)',
  }
};

const navContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: '1.5rem',
  marginBottom: '2.5rem',
  flexWrap: 'wrap',
};

const buttonStyle = {
  padding: '0.8rem 1.8rem',
  fontSize: '1rem',
  backgroundColor: '#2c3e50',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontWeight: '500',
  ':hover': {
    backgroundColor: '#1a252f',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  }
};

const contentContainer = {
  marginTop: '2rem',
  minHeight: '400px',
  borderTop: '1px solid #eee',
  paddingTop: '2rem',
};