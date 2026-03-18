import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Paiement } from '../billing/models/paiement.model.js';
import { Facture } from '../billing/models/facture.model.js';
import { FichePiste } from '../wash-operations/models/fiche-piste.model.js';
import { Coupon } from '../wash-operations/models/coupon.model.js';
import { Reservation } from '../reservations/models/reservation.model.js';
import { Performance } from '../users/models/performance.model.js';
import { User } from '../users/models/user.model.js';
import { TypeLavage } from '../wash-operations/models/type-lavage.model.js';
import { Station } from '../stations/models/station.model.js';
import { Incident } from '../incidents/models/incident.model.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Paiement,
      Facture,
      FichePiste,
      Coupon,
      Reservation,
      Performance,
      User,
      TypeLavage,
      Station,
      Incident,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
