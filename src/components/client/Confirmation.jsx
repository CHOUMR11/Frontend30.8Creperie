import React from 'react';
import { Link } from 'react-router-dom';

export default function Confirmation() {
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={iconStyle}>OK</div>
        <h2 style={titleStyle}>Commande confirmee</h2>
        <p style={messageStyle}>Merci pour votre commande !</p>
        <Link to="/client/menu" style={linkStyle}>
          Retour au menu
        </Link>
      </div>
    </div>
  );
}

const containerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: 'calc(100vh - 112px)',
  padding: '20px',
  backgroundColor: '#FFF8F0',
};

const cardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  padding: '40px',
  textAlign: 'center',
  boxShadow: '0 8px 24px rgba(93, 64, 55, 0.15)',
  maxWidth: '450px',
  width: '100%',
};

const iconStyle = {
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  backgroundColor: '#4caf50',
  color: '#FFFFFF',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 20px',
  fontSize: '1.5rem',
  fontWeight: '700',
};

const titleStyle = {
  color: '#5D4037',
  fontSize: '1.8rem',
  fontWeight: '700',
  marginBottom: '12px',
};

const messageStyle = {
  color: '#757575',
  fontSize: '1.1rem',
  marginBottom: '24px',
};

const linkStyle = {
  display: 'inline-block',
  backgroundColor: '#5D4037',
  color: '#FFFFFF',
  textDecoration: 'none',
  padding: '12px 30px',
  borderRadius: '8px',
  fontSize: '1rem',
  fontWeight: '600',
  transition: 'background-color 0.3s',
};
