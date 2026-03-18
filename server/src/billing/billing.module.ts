import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Facture } from './models/facture.model.js';
import { Paiement } from './models/paiement.model.js';
import { LigneVente } from './models/ligne-vente.model.js';
import { Coupon } from '../wash-operations/models/coupon.model.js';
import { Station } from '../stations/models/station.model.js';
import { Client } from '../clients/models/client.model.js';
import { FacturesController } from './factures.controller.js';
import { PaiementsController } from './paiements.controller.js';
import { CaisseController } from './caisse.controller.js';
import { BillingService } from './billing.service.js';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Facture,
      Paiement,
      LigneVente,
      Coupon,
      Station,
      Client,
    ]),
  ],
  controllers: [FacturesController, PaiementsController, CaisseController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
