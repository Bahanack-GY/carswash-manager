import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CommercialRegistration } from './models/commercial-registration.model.js';
import { Vehicle } from '../clients/models/vehicle.model.js';
import { Client } from '../clients/models/client.model.js';
import { Station } from '../stations/models/station.model.js';
import { User } from '../users/models/user.model.js';
import { Coupon } from '../wash-operations/models/coupon.model.js';
import { FichePiste } from '../wash-operations/models/fiche-piste.model.js';
import { ServiceSpecial } from '../wash-operations/models/service-special.model.js';
import { Performance } from '../users/models/performance.model.js';
import { CommercialController } from './commercial.controller.js';
import { CommercialService } from './commercial.service.js';

@Module({
  imports: [SequelizeModule.forFeature([CommercialRegistration, Vehicle, Client, Station, User, Coupon, FichePiste, ServiceSpecial, Performance])],
  controllers: [CommercialController],
  providers: [CommercialService],
  exports: [CommercialService],
})
export class CommercialModule {}
