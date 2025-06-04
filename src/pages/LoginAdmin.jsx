// src/pages/LoginAdmin.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginAdmin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    if (username === 'admin' && password === 'admin123') {
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/admin');
    } else {
      alert('Identifiants incorrects !');
    }
  };

  return (
    <div style={containerStyle}>
      <h2>Connexion Admin</h2>
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
