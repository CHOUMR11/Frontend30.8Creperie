import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import ClientPage from '../pages/ClientPage';
import AdminPage from '../pages/AdminPage';
import LoginAdmin from '../pages/LoginAdmin';

// 🔒 Route protégée pour l’espace admin
function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
}

// 💡 Wrapper pour cacher le header/footer sur certaines pages
function LayoutWrapper({ children }) {
  const location = useLocation();
  const hideLayout = ['/admin/login'].includes(location.pathname);

  return (
    <>
      {!hideLayout && <Header />}
      {children}
      {!hideLayout && <Footer />}
    </>
  );
}

export default function AppRouter() {
  return (
    <Router>
      {/* Notifications globales */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        toastStyle={{ backgroundColor: '#3E2723', color: '#FFFFFF' }}
      />

      <LayoutWrapper>
        <Routes>
          {/* 👥 Espace client */}
          <Route path="/client/*" element={<ClientPage />} />

          {/* 🔐 Page de connexion admin */}
          <Route path="/admin/login" element={<LoginAdmin />} />

          {/* 🛡️ Espace admin protégé */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* 🔁 Redirection par défaut vers espace client */}
          <Route path="*" element={<Navigate to="/client/menu" replace />} />
        </Routes>
      </LayoutWrapper>
    </Router>
  );
}
