import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TypeLavage } from './models/type-lavage.model.js';
import { ServiceSpecial } from './models/service-special.model.js';
import { FichePiste } from './models/fiche-piste.model.js';
import { FicheExtras } from './models/fiche-extras.model.js';
import { Coupon } from './models/coupon.model.js';
import { CouponWashers } from './models/coupon-washers.model.js';
import { Vehicle } from '../clients/models/vehicle.model.js';
import { Client } from '../clients/models/client.model.js';
import { User } from '../users/models/user.model.js';
import { Station } from '../stations/models/station.model.js';
import { Performance } from '../users/models/performance.model.js';
import { Paiement } from '../billing/models/paiement.model.js';
import { MarketingPromotion } from '../marketing/models/promotion.model.js';
import { BonLavage } from '../bonds/models/bon-lavage.model.js';
import { WashTypesController } from './wash-types.controller.js';
import { ExtrasController } from './extras.controller.js';
import { FichesPisteController } from './fiches-piste.controller.js';
import { CouponsController } from './coupons.controller.js';
import { WashOperationsService } from './wash-operations.service.js';
import { DefaultServicesService } from './default-services.service.js';
import { CommercialModule } from '../commercial/commercial.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [
    CommercialModule,
    AuditModule,
    SequelizeModule.forFeature([
      TypeLavage,
      ServiceSpecial,
      FichePiste,
      FicheExtras,
      Coupon,
      CouponWashers,
      Vehicle,
      Client,
      User,
      Station,
      Performance,
      Paiement,
      MarketingPromotion,
      BonLavage,
    ]),
  ],
  controllers: [
    WashTypesController,
    ExtrasController,
    FichesPisteController,
    CouponsController,
  ],
  providers: [WashOperationsService, DefaultServicesService],
  exports: [WashOperationsService, DefaultServicesService],
})
export class WashOperationsModule {}
