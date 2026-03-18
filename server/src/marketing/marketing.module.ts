import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MarketingController } from './marketing.controller.js';
import { MarketingService } from './marketing.service.js';
import { SmsService } from './sms.service.js';
import { Client } from '../clients/models/client.model.js';
import { Vehicle } from '../clients/models/vehicle.model.js';
import { Subscription } from '../clients/models/subscription.model.js';
import { FichePiste } from '../wash-operations/models/fiche-piste.model.js';
import { Coupon } from '../wash-operations/models/coupon.model.js';
import { Facture } from '../billing/models/facture.model.js';
import { Paiement } from '../billing/models/paiement.model.js';
import { CommercialRegistration } from '../commercial/models/commercial-registration.model.js';
import { Station } from '../stations/models/station.model.js';
import { SmsTemplate } from './models/sms-template.model.js';
import { Campaign } from './models/campaign.model.js';
import { CampaignRecipient } from './models/campaign-recipient.model.js';
import { MarketingPromotion } from './models/promotion.model.js';
import { PromotionWashType } from './models/promotion-wash-type.model.js';
import { TypeLavage } from '../wash-operations/models/type-lavage.model.js';
import { ServiceSpecial } from '../wash-operations/models/service-special.model.js';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Client,
      Vehicle,
      Subscription,
      FichePiste,
      Coupon,
      Facture,
      Paiement,
      CommercialRegistration,
      Station,
      SmsTemplate,
      Campaign,
      CampaignRecipient,
      MarketingPromotion,
      PromotionWashType,
      TypeLavage,
      ServiceSpecial,
    ]),
  ],
  controllers: [MarketingController],
  providers: [MarketingService, SmsService],
})
export class MarketingModule {}
