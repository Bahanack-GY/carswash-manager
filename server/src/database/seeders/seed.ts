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
import { Sanction } from '../../users/models/sanction.model';
import { Promotion } from '../../users/models/promotion.model';
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
import { AuditLog } from '../../audit/models/audit-log.model';
import { BonLavage } from '../../bonds/models/bon-lavage.model';
import { CommercialRegistration } from '../../commercial/models/commercial-registration.model';
import { Campaign } from '../../marketing/models/campaign.model';
import { CampaignRecipient } from '../../marketing/models/campaign-recipient.model';
import { MarketingPromotion } from '../../marketing/models/promotion.model';
import { PromotionWashType } from '../../marketing/models/promotion-wash-type.model';
import { SmsTemplate } from '../../marketing/models/sms-template.model';

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
      Sanction,
      Promotion,
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
      AuditLog,
      BonLavage,
      CommercialRegistration,
      Campaign,
      CampaignRecipient,
      MarketingPromotion,
      PromotionWashType,
      SmsTemplate,
    ],
  });

  try {
    await sequelize.authenticate();
    console.log('  [seed] Database connection established.');

    await sequelize.sync({ force: true });
    console.log('  [seed] All tables recreated (force sync).\n');

    const hashedPassword = await bcrypt.hash('Admin@2025!', 10);

    console.log('  [seed] Creating admin user...');
    await User.create({
      nom: 'Admin',
      prenom: 'Super',
      email: 'admin@carwash.mylisapp.online',
      password: hashedPassword,
      role: 'super_admin',
      actif: true,
      globalAccess: true,
    } as any, { hooks: false });
    console.log('  [seed]   Admin created.');

    console.log('\n========================================');
    console.log('  Seeding completed successfully!');
    console.log('========================================');
    console.log(`
  Admin account:
    Email:    admin@carwash.mylisapp.online
    Password: Admin@2025!
    Role:     super_admin
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
