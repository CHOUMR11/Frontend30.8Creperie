import React, { useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';

import GestionMenu from '../components/admin/GestionMenu';
import ListeCommandes from '../components/admin/ListeCommandes';

export default function AdminPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (isAuthenticated !== 'true') {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login-admin'); // Redirige vers la page de connexion
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem' }}>
        <button onClick={handleLogout} style={logoutStyle}>🚪 Se déconnecter</button>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: '2rem',
        gap: '1rem'
      }}>
        <Link to="/admin/menu">
          <button style={buttonStyle}>📋 Gestion du Menu</button>
        </Link>
        <Link to="/admin/commandes">
          <button style={buttonStyle}>📦 Liste des Commandes</button>
        </Link>
      </div>

      <div style={{ marginTop: '3rem', padding: '1rem' }}>
        <Routes>
          <Route path="/menu" element={<GestionMenu />} />
          <Route path="/commandes" element={<ListeCommandes />} />
        </Routes>
      </div>
    </div>
  );
}

const buttonStyle = {
  padding: '0.8rem 2rem',
  fontSize: '1rem',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'background 0.3s',
};

const logoutStyle = {
  padding: '0.8rem 2rem',
  fontSize: '1rem',
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'background 0.3s',
};