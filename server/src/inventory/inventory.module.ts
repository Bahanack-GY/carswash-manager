import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Produit } from './models/produit.model.js';
import { MouvementStock } from './models/mouvement-stock.model.js';
import { Fournisseur } from './models/fournisseur.model.js';
import { CommandeAchat } from './models/commande-achat.model.js';
import { Station } from '../stations/models/station.model.js';
import { User } from '../users/models/user.model.js';
import { Paiement } from '../billing/models/paiement.model.js';
import { ProduitsController } from './produits.controller.js';
import { MouvementsStockController } from './mouvements-stock.controller.js';
import { FournisseursController } from './fournisseurs.controller.js';
import { CommandesAchatController } from './commandes-achat.controller.js';
import { InventoryService } from './inventory.service.js';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Produit,
      MouvementStock,
      Fournisseur,
      CommandeAchat,
      Station,
      User,
      Paiement,
    ]),
  ],
  controllers: [
    ProduitsController,
    MouvementsStockController,
    FournisseursController,
    CommandesAchatController,
  ],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
