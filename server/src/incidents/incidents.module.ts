import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Incident } from './models/incident.model.js';
import { Station } from '../stations/models/station.model.js';
import { Client } from '../clients/models/client.model.js';
import { IncidentsController } from './incidents.controller.js';
import { IncidentsService } from './incidents.service.js';

@Module({
  imports: [SequelizeModule.forFeature([Incident, Station, Client])],
  controllers: [IncidentsController],
  providers: [IncidentsService],
  exports: [IncidentsService],
})
export class IncidentsModule {}
