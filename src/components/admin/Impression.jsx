import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import styles from './impression.module.css'; // Assure-toi que ce fichier existe

// Composant Impression, adapté pour recevoir la ref du contenu à imprimer
function Impression({ commande, onImprimer }) {
  const printRef = useRef();

  React.useEffect(() => {
    if (onImprimer) {
      onImprimer(printRef);
    }
  }, [onImprimer]);

  return (
    <div ref={printRef} className={styles.facture}>
      <h2>Facture - Commande #{commande.id}</h2>
      <p>Date : {commande.date}</p>
      <ul>
        {commande.items.map(item => (
          <li key={item._id}>
            <span>{item.name} – {item.quantity} × {item.price} DT</span>
            <span>{(item.quantity * item.price).toFixed(2)} DT</span>
          </li>
        ))}
      </ul>
      <p className={styles.total}><strong>Total : {commande.total.toFixed(2)} DT </strong></p>
    </div>
  );
}

export default function ListeCommandes() {
  const [commandes] = useState([
    {
      id: 1,
      date: '2025-05-21',
      total: 30.5,
      items: [
        { _id: 'a1', name: 'Crêpe sucre', quantity: 2, price: 5 },
        { _id: 'a2', name: 'Crêpe chocolat', quantity: 1, price: 20.5 },
      ],
    },
    {
      id: 2,
      date: '2025-05-20',
      total: 10,
      items: [
        { _id: 'b1', name: 'Crêpe nature', quantity: 2, price: 5 },
      ],
    },
  ]);

  const refsImpression = useRef({});

  const handleImprimer = (id) => {
    const printRef = refsImpression.current[id];
    if (!printRef) return;

    html2canvas(printRef.current).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`commande-${id}.pdf`);
    });
  };

  return (
    <div>
      {commandes.map((commande) => (
        <div key={commande.id} className={styles.containerCommande}>
          <Impression
            commande={commande}
            onImprimer={(ref) => { refsImpression.current[commande.id] = ref; }}
          />
          <button
            className={styles.btnImprimer}
            onClick={() => handleImprimer(commande.id)}
            aria-label={`Imprimer la facture commande ${commande.id}`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M19 8H5c-1.1 0-2 .9-2 2v6h4v4h10v-4h4v-6c0-1.1-.9-2-2-2zM17 18H7v-5h10v5zM17 3H7v3h10V3z"/>
            </svg>
            Imprimer
          </button>
        </div>
      ))}
    </div>
  );
}
