import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Client } from './models/client.model.js';
import { Vehicle } from './models/vehicle.model.js';
import { Subscription } from './models/subscription.model.js';
import { ClientsController } from './clients.controller.js';
import { ClientsService } from './clients.service.js';

@Module({
  imports: [SequelizeModule.forFeature([Client, Vehicle, Subscription])],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
