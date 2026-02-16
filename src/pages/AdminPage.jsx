import React, { useEffect } from 'react';
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import GestionMenu from '../components/admin/GestionMenu';
import ListeCommandes from '../components/admin/ListeCommandes';
import './AdminPage.css';

export default function AdminPage() {
  const navigate = useNavigate();

  // Check authentication
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (isAuthenticated !== 'true') {
      navigate('/admin/login');
    }
  }, [navigate]);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/admin/login');
  };

  // Go home
  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="admin-page">
      <div className="admin-topbar">
        <strong>Bienvenue, Admin</strong>
      </div>

      <div className="admin-body">
        <div className="admin-header">
          <h2 className="admin-title">Espace d{"'"}administration</h2>
          <div className="admin-btn-group">
            <button onClick={handleGoHome} className="admin-btn admin-btn-secondary">
              Accueil
            </button>
            <button onClick={handleLogout} className="admin-btn admin-btn-logout">
              Deconnexion
            </button>
          </div>
        </div>

        <nav className="admin-nav">
          <Link to="/admin/menu">
            <button className="admin-btn admin-btn-nav">Gestion du Menu</button>
          </Link>
          <Link to="/admin/commandes">
            <button className="admin-btn admin-btn-nav">Liste des Commandes</button>
          </Link>
        </nav>

        <div className="admin-content">
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
