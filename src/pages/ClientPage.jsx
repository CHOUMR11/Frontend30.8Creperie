import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Menu from '../components/client/Menu';
import Panier from '../components/client/Panier';
import Confirmation from '../components/client/Confirmation'; // ✅ Import ajouté

export default function ClientPage() {
  return (
    <Routes>
      <Route path="/" element={<Menu />} />              {/* /client/ */}
      <Route path="menu" element={<Menu />} />           {/* /client/menu */}
      <Route path="panier" element={<Panier />} />       {/* /client/panier */}
      <Route path="commande" element={<Confirmation />} /> {/* ✅ /client/commande */}
    </Routes>
  );
}
