import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Reservation } from './models/reservation.model.js';
import { Client } from '../clients/models/client.model.js';
import { Vehicle } from '../clients/models/vehicle.model.js';
import { Station } from '../stations/models/station.model.js';
import { ReservationsController } from './reservations.controller.js';
import { ReservationsService } from './reservations.service.js';

@Module({
  imports: [SequelizeModule.forFeature([Reservation, Client, Vehicle, Station])],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
