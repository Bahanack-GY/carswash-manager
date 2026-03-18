import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Station } from './models/station.model.js';
import { Affectation } from '../users/models/affectation.model.js';
import { StationsController } from './stations.controller.js';
import { StationsService } from './stations.service.js';
import { WashOperationsModule } from '../wash-operations/wash-operations.module.js';

@Module({
  imports: [SequelizeModule.forFeature([Station, Affectation]), WashOperationsModule],
  controllers: [StationsController],
  providers: [StationsService],
  exports: [StationsService],
})
export class StationsModule {}
