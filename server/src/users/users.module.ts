import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './models/user.model.js';
import { Affectation } from './models/affectation.model.js';
import { Performance } from './models/performance.model.js';
import { Sanction } from './models/sanction.model.js';
import { Promotion } from './models/promotion.model.js';
import { Station } from '../stations/models/station.model.js';
import { CommercialRegistration } from '../commercial/models/commercial-registration.model.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [
    SequelizeModule.forFeature([User, Affectation, Performance, Station, Sanction, Promotion, CommercialRegistration]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
