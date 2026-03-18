/**
 * Official LIS Car Wash service catalogue.
 * Used by both the database seeder and the runtime auto-seed on station creation.
 * stationId: null → global (visible to every station).
 */

export const DEFAULT_WASH_TYPES = [
  {
    stationId: null,
    nom: 'LIS Classique / Simple Lavage',
    prixBase: 3000,
    prixCatB: 5000,
    fraisService: 150,
    dureeEstimee: 45,
    statut: 'active',
  },
] as const;

export const DEFAULT_SERVICES_SPECIAUX = [
  // ── Lavage ────────────────────────────────────────────────────────────────
  { stationId: null, nom: 'Nettoyage du Châssis / Bas de Caisse', categorie: 'lavage', particularites: 'Lavage non inclus', prix: 5000, prixCatB: 7000, fraisService: 150, commission: null, dureeEstimee: 60, statut: 'active' },
  { stationId: null, nom: 'Nettoyage et Revêtement du Moteur', categorie: 'lavage', particularites: 'Lavage inclus', prix: 10000, prixCatB: 10000, fraisService: 150, commission: null, dureeEstimee: 90, statut: 'active' },
  { stationId: null, nom: 'Cirage Carrosserie Complet', categorie: 'lavage', particularites: 'Lavage inclus', prix: 10000, prixCatB: 15000, fraisService: 300, commission: null, dureeEstimee: 60, statut: 'active' },
  { stationId: null, nom: 'Nettoyage Intérieur Platinium', categorie: 'lavage', particularites: null, prix: 35000, prixCatB: 40000, fraisService: 500, commission: null, dureeEstimee: 300, statut: 'active' },
  { stationId: null, nom: 'Polissage et Cirage Complet', categorie: 'lavage', particularites: null, prix: 35000, prixCatB: 50000, fraisService: 500, commission: null, dureeEstimee: 330, statut: 'active' },
  { stationId: null, nom: 'Polissage et Cirage Capot', categorie: 'lavage', particularites: null, prix: 10000, prixCatB: null, fraisService: 500, commission: null, dureeEstimee: 30, statut: 'active' },
  { stationId: null, nom: 'Élimination d\'une Rayure (par endroit)', categorie: 'lavage', particularites: 'Les rayures profondes ne peuvent pas être supprimées', prix: 2000, prixCatB: null, fraisService: 200, commission: null, dureeEstimee: 15, statut: 'active' },
  { stationId: null, nom: 'Désodorisation et Désinfection', categorie: 'lavage', particularites: null, prix: 5000, prixCatB: null, fraisService: 200, commission: null, dureeEstimee: 20, statut: 'active' },
  { stationId: null, nom: 'Revêtement Protecteur de la Peinture / Lustrage', categorie: 'lavage', particularites: 'Lavage non inclus', prix: 10000, prixCatB: null, fraisService: 500, commission: null, dureeEstimee: 20, statut: 'active' },
  { stationId: null, nom: 'Démontage, Lavage et Traitement des Roues', categorie: 'lavage', particularites: null, prix: 10000, prixCatB: null, fraisService: 600, commission: null, dureeEstimee: 60, statut: 'active' },
  { stationId: null, nom: 'Nettoyage et Entretien Plafond', categorie: 'lavage', particularites: null, prix: 10000, prixCatB: null, fraisService: 500, commission: null, dureeEstimee: 30, statut: 'active' },
  { stationId: null, nom: 'Nettoyage et Entretien Siège Simple', categorie: 'lavage', particularites: 'Lavage non inclus', prix: 20000, prixCatB: null, fraisService: 500, commission: null, dureeEstimee: 45, statut: 'active' },
  { stationId: null, nom: 'Démontage et Entretien Châssis Uniquement', categorie: 'lavage', particularites: 'Lavage non inclus', prix: 25000, prixCatB: null, fraisService: 500, commission: null, dureeEstimee: 240, statut: 'active' },
  { stationId: null, nom: 'Lustrage Interne Approfondi', categorie: 'lavage', particularites: 'Tableau de bord, portières, sièges, vitres et coffre', prix: 10000, prixCatB: null, fraisService: 500, commission: null, dureeEstimee: 60, statut: 'active' },

  // ── Rénovation ────────────────────────────────────────────────────────────
  { stationId: null, nom: 'Rénovation d\'un Phare (la paire)', categorie: 'renovation', particularites: 'Lavage non inclus', prix: 10000, prixCatB: null, fraisService: 500, commission: null, dureeEstimee: 60, statut: 'active' },

  // ── Film ──────────────────────────────────────────────────────────────────
  { stationId: null, nom: 'Film Covering Complet (changement de couleur)', categorie: 'film', particularites: null, prix: 300000, prixCatB: null, fraisService: 1500, commission: 5000, dureeEstimee: 2880, statut: 'active' },
  { stationId: null, nom: 'Film Transparent Protection Peinture Complet — Cat A', categorie: 'film', particularites: null, prix: 400000, prixCatB: null, fraisService: 1500, commission: 5000, dureeEstimee: 2880, statut: 'active' },
  { stationId: null, nom: 'Film Transparent Protection Peinture Complet — Cat B', categorie: 'film', particularites: null, prix: 500000, prixCatB: null, fraisService: 1500, commission: 5000, dureeEstimee: 2880, statut: 'active' },
  { stationId: null, nom: 'Film Transparent Protection Capot Seul', categorie: 'film', particularites: 'Ancienne voiture', prix: 60000, prixCatB: null, fraisService: 1500, commission: null, dureeEstimee: 300, statut: 'active' },
  { stationId: null, nom: 'Film Protection Peinture — 2 Ailes Avant', categorie: 'film', particularites: null, prix: 60000, prixCatB: null, fraisService: 1500, commission: null, dureeEstimee: 180, statut: 'active' },
  { stationId: null, nom: 'Film Protection Peinture — 2 Ailes Arrières', categorie: 'film', particularites: null, prix: 60000, prixCatB: null, fraisService: 1500, commission: null, dureeEstimee: 180, statut: 'active' },
  { stationId: null, nom: 'Film Protection Peinture — 4 Portières', categorie: 'film', particularites: null, prix: 150000, prixCatB: null, fraisService: 1500, commission: null, dureeEstimee: 180, statut: 'active' },
  { stationId: null, nom: 'Film Protection Pare-Chocs Avant', categorie: 'film', particularites: 'Nouvelle voiture', prix: 80000, prixCatB: null, fraisService: 1500, commission: null, dureeEstimee: 180, statut: 'active' },
  { stationId: null, nom: 'Film Protection Pare-Chocs Arrière', categorie: 'film', particularites: 'Nouvelle voiture', prix: 80000, prixCatB: null, fraisService: 1500, commission: null, dureeEstimee: 180, statut: 'active' },
  { stationId: null, nom: 'Film Protection Peinture Capot (Recommandé)', categorie: 'film', particularites: null, prix: 60000, prixCatB: null, fraisService: 1500, commission: null, dureeEstimee: 180, statut: 'active' },
  { stationId: null, nom: 'Film Covering Toit Noir', categorie: 'film', particularites: null, prix: 60000, prixCatB: null, fraisService: 1500, commission: null, dureeEstimee: 300, statut: 'active' },

  // ── Accessoire ────────────────────────────────────────────────────────────
  { stationId: null, nom: 'Volant à Main Cousu en Cuir Ultra Fibre', categorie: 'accessoire', particularites: null, prix: 20000, prixCatB: null, fraisService: 1000, commission: 1000, dureeEstimee: 120, statut: 'active' },
  { stationId: null, nom: 'Volant à Main Cousu en Cuir Ultra Fibre (Premium)', categorie: 'accessoire', particularites: 'Version premium', prix: 20000, prixCatB: null, fraisService: 1000, commission: 1000, dureeEstimee: 120, statut: 'active' },
  { stationId: null, nom: 'Essuie-Glace à Trois Sections (la paire)', categorie: 'accessoire', particularites: null, prix: 10000, prixCatB: null, fraisService: 200, commission: 500, dureeEstimee: 10, statut: 'active' },
  { stationId: null, nom: 'Essuie-Glace Sans Cadre (la paire)', categorie: 'accessoire', particularites: null, prix: 15000, prixCatB: null, fraisService: 200, commission: 500, dureeEstimee: 10, statut: 'active' },

  // ── Vitre ─────────────────────────────────────────────────────────────────
  { stationId: null, nom: 'Vitres Teintées Grade A — Voiture Complète', categorie: 'vitre', particularites: null, prix: 100000, prixCatB: null, fraisService: null, commission: 3000, dureeEstimee: 360, statut: 'active' },
  { stationId: null, nom: 'Vitres Teintées Grade A — Pare-Brise Uniquement', categorie: 'vitre', particularites: null, prix: 80000, prixCatB: null, fraisService: null, commission: 1000, dureeEstimee: 120, statut: 'active' },
  { stationId: null, nom: 'Vitres Teintées Grade A — Latérales et Arrières', categorie: 'vitre', particularites: null, prix: 100000, prixCatB: null, fraisService: null, commission: 1500, dureeEstimee: 240, statut: 'active' },
  { stationId: null, nom: 'Vitres Teintées Grade B — Voiture Complète', categorie: 'vitre', particularites: null, prix: 100000, prixCatB: null, fraisService: null, commission: 1500, dureeEstimee: 360, statut: 'active' },
  { stationId: null, nom: 'Vitres Teintées Grade B — Pare-Brise Uniquement', categorie: 'vitre', particularites: null, prix: 60000, prixCatB: null, fraisService: null, commission: 1000, dureeEstimee: 120, statut: 'active' },
  { stationId: null, nom: 'Vitres Teintées Grade B — Latérales et Arrières', categorie: 'vitre', particularites: null, prix: 100000, prixCatB: null, fraisService: null, commission: 1500, dureeEstimee: 240, statut: 'active' },
  { stationId: null, nom: 'Élimination des Traces d\'Eau (toutes vitres)', categorie: 'vitre', particularites: null, prix: 50000, prixCatB: null, fraisService: null, commission: 1000, dureeEstimee: 120, statut: 'active' },

  // ── Nettoyage ─────────────────────────────────────────────────────────────
  { stationId: null, nom: 'Nettoyage Tapis Petit', categorie: 'nettoyage', particularites: null, prix: 5000, prixCatB: null, fraisService: 1000, commission: 500, dureeEstimee: 240, statut: 'active' },
  { stationId: null, nom: 'Nettoyage Tapis Moyen', categorie: 'nettoyage', particularites: null, prix: 10000, prixCatB: null, fraisService: 1000, commission: 500, dureeEstimee: 240, statut: 'active' },
  { stationId: null, nom: 'Nettoyage Tapis Grand', categorie: 'nettoyage', particularites: null, prix: 20000, prixCatB: null, fraisService: 1000, commission: 500, dureeEstimee: 240, statut: 'active' },
  { stationId: null, nom: 'Nettoyage Tapis Express Petit', categorie: 'nettoyage', particularites: null, prix: 8000, prixCatB: null, fraisService: 1000, commission: 500, dureeEstimee: 60, statut: 'active' },
  { stationId: null, nom: 'Nettoyage Tapis Express Moyen', categorie: 'nettoyage', particularites: null, prix: 15000, prixCatB: null, fraisService: 1000, commission: 500, dureeEstimee: 60, statut: 'active' },
  { stationId: null, nom: 'Nettoyage Tapis Express Grand', categorie: 'nettoyage', particularites: null, prix: 25000, prixCatB: null, fraisService: 1000, commission: 500, dureeEstimee: 60, statut: 'active' },
  { stationId: null, nom: 'Nettoyage Meuble Petit', categorie: 'nettoyage', particularites: null, prix: 40000, prixCatB: null, fraisService: 3000, commission: 2000, dureeEstimee: 2880, statut: 'active' },
  { stationId: null, nom: 'Nettoyage Meuble Moyen', categorie: 'nettoyage', particularites: null, prix: 55000, prixCatB: null, fraisService: 3000, commission: 2000, dureeEstimee: 2880, statut: 'active' },
  { stationId: null, nom: 'Nettoyage Meuble Grand', categorie: 'nettoyage', particularites: null, prix: 75000, prixCatB: null, fraisService: 3000, commission: 2000, dureeEstimee: 2880, statut: 'active' },
  { stationId: null, nom: 'Nettoyage et Protection Châssis Ultra Pro+', categorie: 'nettoyage', particularites: null, prix: 150000, prixCatB: 180000, fraisService: 3000, commission: 2000, dureeEstimee: 330, statut: 'active' },
] as const;
