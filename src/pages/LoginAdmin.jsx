import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginAdmin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('isAuthenticated') === 'true');
  const navigate = useNavigate();

  // Synchroniser l'état d'authentification avec localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(localStorage.getItem('isAuthenticated') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogin = () => {
    if (username === 'admin' && password === 'admin123') {
      localStorage.setItem('isAuthenticated', 'true');
      setIsAuthenticated(true);
      // Commenté pour rester sur la page et tester le bouton "Se déconnecter"
      // navigate('/admin');
    } else {
      alert('Identifiants incorrects !');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    // Pas de redirection ni de rechargement pour rester sur la page
  };

  return (
    <div style={containerStyle}>
      <h2>Connexion Admin</h2>
      {!isAuthenticated ? (
        <>
          <input
            type="text"
            placeholder="Nom d'utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
          <button onClick={handleLogin} style={buttonStyle}>Se connecter</button>
        </>
      ) : (
        <>
          <p>Connecté en tant qu'admin</p>
          <button onClick={handleLogout} style={{ ...buttonStyle, backgroundColor: '#dc3545' }}>
            Se déconnecter
          </button>
        </>
      )}
    </div>
  );
}

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginTop: '100px',
  gap: '1rem'
};

const inputStyle = {
  padding: '0.5rem',
  width: '200px',
  fontSize: '1rem'
};

const buttonStyle = {
  padding: '0.5rem 1.5rem',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer'
};