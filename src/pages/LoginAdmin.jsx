import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginAdmin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Vérifie le statut d'authentification au chargement
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    setIsAuthenticated(authStatus);
  }, []);

  const handleLogin = () => {
    if (username === 'admin' && password === 'admin123') {
      localStorage.setItem('isAuthenticated', 'true');
      setIsAuthenticated(true);
      navigate('/admin');
    } else {
      alert('Identifiants incorrects !');
    }
  };

  const handleGoToDashboard = () => {
    navigate('/admin');
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
          <button onClick={handleLogin} style={buttonStyle}>
            Se connecter
          </button>
        </>
      ) : (
        <>
          <p>Vous êtes déjà connecté.</p>
          <button onClick={handleGoToDashboard} style={buttonStyle}>
            Accéder à l'espace Admin
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
  gap: '1rem',
};

const inputStyle = {
  padding: '0.5rem',
  width: '220px',
  fontSize: '1rem',
};

const buttonStyle = {
  padding: '0.5rem 1.5rem',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
};
