import { Sequelize } from 'sequelize-typescript';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Models
import { Station } from '../../stations/models/station.model';
import { User } from '../../users/models/user.model';
import { Affectation } from '../../users/models/affectation.model';
import { Performance as PerfModel } from '../../users/models/performance.model';
import { Client } from '../../clients/models/client.model';
import { Vehicle } from '../../clients/models/vehicle.model';
import { Subscription } from '../../clients/models/subscription.model';
import { Reservation } from '../../reservations/models/reservation.model';
import { TypeLavage } from '../../wash-operations/models/type-lavage.model';
import { ServiceSpecial } from '../../wash-operations/models/service-special.model';
import { FichePiste } from '../../wash-operations/models/fiche-piste.model';
import { FicheExtras } from '../../wash-operations/models/fiche-extras.model';
import { Coupon } from '../../wash-operations/models/coupon.model';
import { CouponWashers } from '../../wash-operations/models/coupon-washers.model';
import { Facture } from '../../billing/models/facture.model';
import { Paiement } from '../../billing/models/paiement.model';
import { LigneVente } from '../../billing/models/ligne-vente.model';
import { Produit } from '../../inventory/models/produit.model';
import { MouvementStock } from '../../inventory/models/mouvement-stock.model';
import { Fournisseur } from '../../inventory/models/fournisseur.model';
import { CommandeAchat } from '../../inventory/models/commande-achat.model';
import { Incident } from '../../incidents/models/incident.model';

async function seed() {
  console.log('\n========================================');
  console.log('  LIS Car Wash - Database Seeder');
  console.log('========================================\n');

  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'lis_car_wash',
    logging: false,
    models: [
      Station,
      User,
      Affectation,
      PerfModel,
      Client,
      Vehicle,
      Subscription,
      Reservation,
      TypeLavage,
      ServiceSpecial,
      FichePiste,
      FicheExtras,
      Coupon,
      CouponWashers,
      Facture,
      Paiement,
      LigneVente,
      Produit,
      MouvementStock,
      Fournisseur,
      CommandeAchat,
      Incident,
    ],
  });

  try {
    await sequelize.authenticate();
    console.log('  [seed] Database connection established.');

    await sequelize.sync({ force: true });
    console.log('  [seed] All tables recreated (force sync).\n');

    const hashedPassword = await bcrypt.hash('password123', 10);

    console.log('  [seed] Creating stations...');
    await Station.bulkCreate([
      {
        id: 1,
        nom: 'LIS Douala',
        adresse: 'Rue de la Joie, Akwa',
        town: 'Douala',
        contact: '+237 6 90 12 34 56',
        status: 'active',
      },
      {
        id: 2,
        nom: 'LIS Yaoundé',
        adresse: 'Boulevard du 20 Mai, Centre',
        town: 'Yaoundé',
        contact: '+237 6 70 98 76 54',
        status: 'active',
      },
    ]);
    console.log('  [seed]   2 stations created.');

    console.log('  [seed] Creating admin user...');
    await User.bulkCreate(
      [
        {
          id: 1,
          nom: 'Diallo',
          prenom: 'Amadou',
          email: 'admin@lis-carwash.cm',
          telephone: '+237 6 50 00 00 00',
          password: hashedPassword,
          role: 'super_admin',
          actif: true,
        },
      ],
      { hooks: false },
    );
    console.log('  [seed]   1 admin created.');

    // ─── Types de lavage (global, stationId = null) ───────────────────
    console.log('  [seed] Creating types de lavage...');
    await TypeLavage.bulkCreate([
      { stationId: null, nom: 'LIS Classique / Simple Lavage', prixBase: 3000, prixCatB: 5000, fraisService: 150, dureeEstimee: 45, statut: 'active' },
    ] as any[]);
    console.log('  [seed]   1 type de lavage created.');

    // ─── Services spéciaux (global, stationId = null) ─────────────────
    console.log('  [seed] Creating services spéciaux...');
    await ServiceSpecial.bulkCreate([
      // ── catégorie: lavage ──
      { stationId: null, nom: 'Nettoyage du Châssis / Bas de Caisse', categorie: 'lavage', particularites: 'Lavage non inclus', prix: 5000, prixCatB: 7000, fraisService: 150, commission: null, dureeEstimee: 60, statut: 'active' },
      { stationId: null, nom: 'Nettoyage et Revêtement du Moteur', categorie: 'lavage', particularites: 'Lavage inclus', prix: 10000, prixCatB: 10000, fraisService: 150, commission: null, dureeEstimee: 90, statut: 'active' },
      { stationId: null, nom: 'Cirage Carrosserie Complet', categorie: 'lavage', particularites: 'Lavage inclus', prix: 10000, prixCatB: 15000, fraisService: 300, commission: null, dureeEstimee: 60, statut: 'active' },
      { stationId: null, nom: 'Nettoyage Intérieur Platinium', categorie: 'lavage', particularites: null, prix: 35000, prixCatB: 40000, fraisService: 500, commission: null, dureeEstimee: 300, statut: 'active' },
      { stationId: null, nom: 'Polissage et Cirage Complet', categorie: 'lavage', particularites: null, prix: 35000, prixCatB: 50000, fraisService: 500, commission: null, dureeEstimee: 330, statut: 'active' },
      { stationId: null, nom: 'Polissage et Cirage Capot', categorie: 'lavage', particularites: null, prix: 10000, prixCatB: null, fraisService: 500, commission: null, dureeEstimee: 30, statut: 'active' },
      { stationId: null, nom: 'Élimination d\'une Rayure', categorie: 'lavage', particularites: 'Les rayures profondes ne peuvent pas être supprimées. Prix par endroit.', prix: 2000, prixCatB: null, fraisService: 200, commission: null, dureeEstimee: 15, statut: 'active' },
      { stationId: null, nom: 'Désodorisation et Désinfection', categorie: 'lavage', particularites: null, prix: 5000, prixCatB: null, fraisService: 200, commission: null, dureeEstimee: 20, statut: 'active' },
      { stationId: null, nom: 'Démontage, Lavage et Traitement des Roues', categorie: 'lavage', particularites: null, prix: 10000, prixCatB: null, fraisService: 600, commission: null, dureeEstimee: 60, statut: 'active' },
      { stationId: null, nom: 'Nettoyage et Entretien Plafond', categorie: 'lavage', particularites: null, prix: 10000, prixCatB: null, fraisService: 500, commission: null, dureeEstimee: 30, statut: 'active' },
      { stationId: null, nom: 'Nettoyage et Entretien Siège Simple', categorie: 'lavage', particularites: 'Lavage non inclus', prix: 20000, prixCatB: null, fraisService: 500, commission: null, dureeEstimee: 45, statut: 'active' },
      { stationId: null, nom: 'Démontage et Entretien Châssis Uniquement', categorie: 'lavage', particularites: 'Lavage non inclus', prix: 25000, prixCatB: null, fraisService: 500, commission: null, dureeEstimee: 240, statut: 'active' },
      { stationId: null, nom: 'Lustrage Interne Approfondi', categorie: 'lavage', particularites: 'Tableau de bord, portières, sièges, vitres et coffre', prix: 10000, prixCatB: null, fraisService: 500, commission: null, dureeEstimee: 60, statut: 'active' },

      // ── catégorie: renovation ──
      { stationId: null, nom: 'Rénovation d\'un Phare (la paire)', categorie: 'renovation', particularites: 'Lavage non inclus', prix: 10000, prixCatB: null, fraisService: 500, commission: null, dureeEstimee: 60, statut: 'active' },
      { stationId: null, nom: 'Revêtement Protecteur de la Peinture / Lustrage', categorie: 'renovation', particularites: 'Lavage non inclus', prix: 10000, prixCatB: null, fraisService: 500, commission: null, dureeEstimee: 20, statut: 'active' },

      // ── catégorie: film ──
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

      // ── catégorie: accessoire ──
      { stationId: null, nom: 'Volant à Main Cousu en Cuir Ultra Fibre', categorie: 'accessoire', particularites: null, prix: 20000, prixCatB: null, fraisService: 1000, commission: 1000, dureeEstimee: 120, statut: 'active' },
      { stationId: null, nom: 'Volant à Main Cousu en Cuir Ultra Fibre (Premium)', categorie: 'accessoire', particularites: 'Version premium', prix: 20000, prixCatB: null, fraisService: 1000, commission: 1000, dureeEstimee: 120, statut: 'active' },
      { stationId: null, nom: 'Essuie-Glace à Trois Sections (la paire)', categorie: 'accessoire', particularites: null, prix: 10000, prixCatB: null, fraisService: 200, commission: 500, dureeEstimee: 10, statut: 'active' },
      { stationId: null, nom: 'Essuie-Glace Sans Cadre (la paire)', categorie: 'accessoire', particularites: null, prix: 15000, prixCatB: null, fraisService: 200, commission: 500, dureeEstimee: 10, statut: 'active' },

      // ── catégorie: vitre ──
      { stationId: null, nom: 'Vitres Teintées Grade A — Voiture Complète', categorie: 'vitre', particularites: null, prix: 100000, prixCatB: null, fraisService: null, commission: 3000, dureeEstimee: 360, statut: 'active' },
      { stationId: null, nom: 'Vitres Teintées Grade A — Pare-Brise Uniquement', categorie: 'vitre', particularites: null, prix: 80000, prixCatB: null, fraisService: null, commission: 1000, dureeEstimee: 120, statut: 'active' },
      { stationId: null, nom: 'Vitres Teintées Grade A — Latérales et Arrières', categorie: 'vitre', particularites: null, prix: 100000, prixCatB: null, fraisService: null, commission: 1500, dureeEstimee: 240, statut: 'active' },
      { stationId: null, nom: 'Vitres Teintées Grade B — Voiture Complète', categorie: 'vitre', particularites: null, prix: 100000, prixCatB: null, fraisService: null, commission: 1500, dureeEstimee: 360, statut: 'active' },
      { stationId: null, nom: 'Vitres Teintées Grade B — Pare-Brise Uniquement', categorie: 'vitre', particularites: null, prix: 60000, prixCatB: null, fraisService: null, commission: 1000, dureeEstimee: 120, statut: 'active' },
      { stationId: null, nom: 'Vitres Teintées Grade B — Latérales et Arrières', categorie: 'vitre', particularites: null, prix: 100000, prixCatB: null, fraisService: null, commission: 1500, dureeEstimee: 240, statut: 'active' },
      { stationId: null, nom: 'Élimination des Traces d\'Eau (toutes vitres)', categorie: 'vitre', particularites: null, prix: 50000, prixCatB: null, fraisService: null, commission: 1000, dureeEstimee: 120, statut: 'active' },

      // ── catégorie: nettoyage ──
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
    ] as any[]);
    console.log('  [seed]   1 type de lavage + 50 services spéciaux created.');

    // Reset sequences
    for (const { table, seq } of [
      { table: 'stations', seq: 'stations_id_seq' },
      { table: 'users', seq: 'users_id_seq' },
      { table: 'types_lavage', seq: 'types_lavage_id_seq' },
      { table: 'services_speciaux', seq: 'services_speciaux_id_seq' },
    ]) {
      await sequelize.query(
        `SELECT setval('"${seq}"', (SELECT COALESCE(MAX(id), 0) FROM "${table}") + 1, false)`,
      );
    }

    console.log('\n========================================');
    console.log('  Seeding completed successfully!');
    console.log('========================================');
    console.log(`
  Stations:
    1. LIS Douala  - Rue de la Joie, Akwa
    2. LIS Yaoundé - Boulevard du 20 Mai, Centre

  Admin account:
    Email:    admin@lis-carwash.cm
    Password: password123
    Role:     super_admin

  Services: 1 type de lavage + 50 services spéciaux (global)
`);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n  [seed] ERROR:', error);
    await sequelize.close();
    process.exit(1);
  }
}

seed();
