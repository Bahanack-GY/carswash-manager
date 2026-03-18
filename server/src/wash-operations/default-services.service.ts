import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TypeLavage } from './models/type-lavage.model.js';
import { ServiceSpecial } from './models/service-special.model.js';
import { DEFAULT_WASH_TYPES, DEFAULT_SERVICES_SPECIAUX } from './default-services.data.js';

@Injectable()
export class DefaultServicesService implements OnModuleInit {
  private readonly logger = new Logger(DefaultServicesService.name);

  constructor(
    @InjectModel(TypeLavage)
    private readonly typeLavageModel: typeof TypeLavage,
    @InjectModel(ServiceSpecial)
    private readonly serviceSpecialModel: typeof ServiceSpecial,
  ) {}

  async onModuleInit() {
    await this.seedGlobalDefaults();
  }

  /**
   * Idempotent: seeds global defaults only if none exist yet.
   * Safe to call on every module init and on each station creation.
   */
  async seedGlobalDefaults() {
    const existingWashTypes = await this.typeLavageModel.count({
      where: { stationId: null },
    });

    if (existingWashTypes === 0) {
      this.logger.log('Seeding global wash types...');
      await this.typeLavageModel.bulkCreate([...DEFAULT_WASH_TYPES] as any[]);
      this.logger.log(`  ${DEFAULT_WASH_TYPES.length} type(s) de lavage created.`);
    }

    const existingExtras = await this.serviceSpecialModel.count({
      where: { stationId: null },
    });

    if (existingExtras === 0) {
      this.logger.log('Seeding global services spéciaux...');
      await this.serviceSpecialModel.bulkCreate([...DEFAULT_SERVICES_SPECIAUX] as any[]);
      this.logger.log(`  ${DEFAULT_SERVICES_SPECIAUX.length} services spéciaux created.`);
    }
  }
}
