import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BonLavage } from './models/bon-lavage.model.js';
import { User } from '../users/models/user.model.js';
import { Coupon } from '../wash-operations/models/coupon.model.js';
import { Station } from '../stations/models/station.model.js';
import { BondsController } from './bonds.controller.js';
import { BondsService } from './bonds.service.js';

@Module({
  imports: [SequelizeModule.forFeature([BonLavage, User, Coupon, Station])],
  controllers: [BondsController],
  providers: [BondsService],
  exports: [BondsService],
})
export class BondsModule {}
