import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import ClientPage from '../pages/ClientPage';
import AdminPage from '../pages/AdminPage';
import LoginAdmin from '../pages/LoginAdmin';

function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  console.log('ProtectedRoute: isAuthenticated:', isAuthenticated); // Debugging
  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
}

function LayoutWrapper({ children }) {
  const location = useLocation();
  const isLoginPage = location.pathname === '/admin/login';

  return (
    <>
      {!isLoginPage && <Header />}
      {children}
      {!isLoginPage && <Footer />}
    </>
  );
}

export default function AppRouter() {
  return (
    <Router>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        toastStyle={{ backgroundColor: '#3E2723', color: '#FFFFFF' }}
      />
      <LayoutWrapper>
        <Routes>
          <Route path="/client/*" element={<ClientPage />} />
          <Route path="/admin/login" element={<LoginAdmin />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/client/menu" replace />} />
        </Routes>
      </LayoutWrapper>
    </Router>
  );
}