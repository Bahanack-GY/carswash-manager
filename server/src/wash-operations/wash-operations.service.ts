import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op, Transaction } from 'sequelize';
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
import { Paiement } from '../billing/models/paiement.model.js';
import { Performance } from '../users/models/performance.model.js';
import { MarketingPromotion, PromotionType, DiscountType } from '../marketing/models/promotion.model.js';
import { CreateTypeLavageDto } from './dto/create-type-lavage.dto.js';
import { UpdateTypeLavageDto } from './dto/update-type-lavage.dto.js';
import { CreateServiceSpecialDto } from './dto/create-service-special.dto.js';
import { UpdateServiceSpecialDto } from './dto/update-service-special.dto.js';
import { CreateFichePisteDto } from './dto/create-fiche-piste.dto.js';
import { UpdateFichePisteDto } from './dto/update-fiche-piste.dto.js';
import { CreateCouponDto } from './dto/create-coupon.dto.js';
import { UpdateCouponStatusDto } from './dto/update-coupon-status.dto.js';
import { AssignWashersDto } from './dto/assign-washers.dto.js';
import { AddServicesToCouponDto } from './dto/add-services-to-coupon.dto.js';
import { CreateNouveauLavageDto } from './dto/create-nouveau-lavage.dto.js';
import {
  FichePisteStatus,
  CouponStatus,
} from '../common/constants/status.enum.js';
import { CommercialService } from '../commercial/commercial.service.js';
import { BonLavage } from '../bonds/models/bon-lavage.model.js';

@Injectable()
export class WashOperationsService {
  constructor(
    private readonly sequelize: Sequelize,
    @InjectModel(TypeLavage)
    private readonly typeLavageModel: typeof TypeLavage,
    @InjectModel(ServiceSpecial)
    private readonly serviceSpecialModel: typeof ServiceSpecial,
    @InjectModel(FichePiste)
    private readonly fichePisteModel: typeof FichePiste,
    @InjectModel(FicheExtras)
    private readonly ficheExtrasModel: typeof FicheExtras,
    @InjectModel(Coupon)
    private readonly couponModel: typeof Coupon,
    @InjectModel(CouponWashers)
    private readonly couponWashersModel: typeof CouponWashers,
    @InjectModel(Vehicle)
    private readonly vehicleModel: typeof Vehicle,
    @InjectModel(Client)
    private readonly clientModel: typeof Client,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(Station)
    private readonly stationModel: typeof Station,
    @InjectModel(Performance)
    private readonly performanceModel: typeof Performance,
    @InjectModel(MarketingPromotion)
    private readonly promotionModel: typeof MarketingPromotion,
    @InjectModel(BonLavage)
    private readonly bonLavageModel: typeof BonLavage,
    private readonly commercialService: CommercialService,
  ) {}

  // ─── TypeLavage ───────────────────────────────────────────────────────

  async findAllTypes(query?: { stationId?: number }) {
    const where: Record<string, any> = query?.stationId
      ? { [Op.or]: [{ stationId: query.stationId }, { stationId: null }] }
      : {};
    return this.typeLavageModel.findAll({ where, order: [['nom', 'ASC']] });
  }

  async createType(dto: CreateTypeLavageDto) {
    return this.typeLavageModel.create(dto as any);
  }

  async updateType(id: number, dto: UpdateTypeLavageDto) {
    const type = await this.typeLavageModel.findByPk(id);
    if (!type) {
      throw new NotFoundException(`Type de lavage #${id} introuvable`);
    }
    return type.update(dto);
  }

  async deleteType(id: number) {
    const type = await this.typeLavageModel.findByPk(id);
    if (!type) {
      throw new NotFoundException(`Type de lavage #${id} introuvable`);
    }
    await type.destroy();
  }

  // ─── ServiceSpecial ──────────────────────────────────────────────────

  async findAllExtras(query?: { stationId?: number }) {
    const where: Record<string, any> = query?.stationId
      ? { [Op.or]: [{ stationId: query.stationId }, { stationId: null }] }
      : {};
    return this.serviceSpecialModel.findAll({ where, order: [['nom', 'ASC']] });
  }

  async createExtra(dto: CreateServiceSpecialDto) {
    return this.serviceSpecialModel.create(dto as any);
  }

  async updateExtra(id: number, dto: UpdateServiceSpecialDto) {
    const extra = await this.serviceSpecialModel.findByPk(id);
    if (!extra) {
      throw new NotFoundException(`Service spécial #${id} introuvable`);
    }
    return extra.update(dto);
  }

  async deleteExtra(id: number) {
    const extra = await this.serviceSpecialModel.findByPk(id);
    if (!extra) {
      throw new NotFoundException(`Service spécial #${id} introuvable`);
    }
    await extra.destroy();
  }

  // ─── FichePiste ───────────────────────────────────────────────────────

  async findAllFiches(query: {
    stationId?: number;
    clientId?: number;
    controleurId?: number;
    statut?: FichePisteStatus;
    date?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const where: Record<string, any> = {};

    if (query.stationId) {
      where.stationId = query.stationId;
    }

    if (query.clientId) {
      where.clientId = query.clientId;
    }

    if (query.controleurId) {
      where.controleurId = query.controleurId;
    }

    if (query.statut) {
      where.statut = query.statut;
    }

    if (query.startDate && query.endDate) {
      where.date = { [Op.gte]: query.startDate, [Op.lte]: query.endDate };
    } else if (query.date) {
      where.date = query.date;
    }

    const { rows: data, count: total } =
      await this.fichePisteModel.findAndCountAll({
        where,
        include: [
          { model: Vehicle, attributes: ['immatriculation', 'modele'] },
          { model: Client, attributes: ['nom'] },
          { model: TypeLavage, attributes: ['nom', 'prixBase'] },
          { model: ServiceSpecial, attributes: ['id', 'nom', 'prix'] },
          { model: User, as: 'controleur', attributes: ['nom', 'prenom'] },
          { model: Coupon },
        ],
        order: [['date', 'DESC']],
        limit,
        offset,
        distinct: true,
      });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneFiche(id: number) {
    const fiche = await this.fichePisteModel.findByPk(id, {
      include: [
        { model: Vehicle },
        { model: Client },
        { model: TypeLavage },
        { model: ServiceSpecial },
        { model: User, as: 'controleur' },
        { model: Station },
        {
          model: Coupon,
          include: [{ model: User, as: 'washers' }],
        },
      ],
    });

    if (!fiche) {
      throw new NotFoundException(`Fiche de piste #${id} introuvable`);
    }

    return fiche;
  }

  async createFiche(dto: CreateFichePisteDto) {
    const { extrasIds, ...ficheData } = dto;

    const ficheId = await this.sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
      async (t) => {
        const numero = await this.generateFicheNumero(t);
        const fiche = await this.fichePisteModel.create(
          { ...ficheData, numero } as any,
          { transaction: t },
        );

        if (extrasIds && extrasIds.length > 0) {
          const extras = extrasIds.map((serviceSpecialId) => ({ fichePisteId: fiche.id, serviceSpecialId }));
          await this.ficheExtrasModel.bulkCreate(extras as any, { transaction: t });
        }

        return fiche.id;
      },
    );

    return this.findOneFiche(ficheId);
  }

  async updateFiche(id: number, dto: UpdateFichePisteDto) {
    const fiche = await this.fichePisteModel.findByPk(id);
    if (!fiche) {
      throw new NotFoundException(`Fiche de piste #${id} introuvable`);
    }

    const { extrasIds, ...ficheData } = dto;

    await this.sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
      async (t) => {
        await fiche.update(ficheData, { transaction: t });

        if (extrasIds !== undefined) {
          await this.ficheExtrasModel.destroy({ where: { fichePisteId: id }, transaction: t });

          if (extrasIds.length > 0) {
            const extras = extrasIds.map((serviceSpecialId) => ({ fichePisteId: id, serviceSpecialId }));
            await this.ficheExtrasModel.bulkCreate(extras as any, { transaction: t });
          }
        }
      },
    );

    return this.findOneFiche(id);
  }

  private async generateFicheNumero(t: Transaction): Promise<string> {
    const lastFiche = await this.fichePisteModel.findOne({
      order: [['numero', 'DESC']],
      attributes: ['numero'],
      lock: Transaction.LOCK.UPDATE,
      transaction: t,
    });
    const next = lastFiche?.numero ? (parseInt(lastFiche.numero.match(/FP-(\d+)/)?.[1] ?? '0', 10) + 1) : 1;
    return `FP-${String(next).padStart(4, '0')}`;
  }

  // ─── Coupon ───────────────────────────────────────────────────────────

  async findAllCoupons(query: {
    stationId?: number;
    statut?: CouponStatus;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const ficheWhere: Record<string, any> = {};

    if (query.stationId) {
      ficheWhere.stationId = query.stationId;
    }

    const couponWhere: Record<string, any> = {};

    if (query.statut) {
      couponWhere.statut = query.statut;
    }

    if (query.startDate && query.endDate) {
      couponWhere.updatedAt = {
        [Op.gte]: new Date(`${query.startDate}T00:00:00`),
        [Op.lte]: new Date(`${query.endDate}T23:59:59.999`),
      };
    }

    const { rows: data, count: total } =
      await this.couponModel.findAndCountAll({
        where: couponWhere,
        include: [
          {
            model: FichePiste,
            where: Object.keys(ficheWhere).length > 0 ? ficheWhere : undefined,
            include: [
              { model: Vehicle, attributes: ['immatriculation', 'modele'] },
              { model: Client, attributes: ['nom'] },
              { model: TypeLavage, attributes: ['nom', 'prixBase', 'dureeEstimee'] },
            ],
          },
          { model: User, as: 'washers', attributes: ['id', 'nom', 'prenom'] },
          { model: Paiement, attributes: ['id', 'methode', 'montant', 'description', 'referenceExterne'] },
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        distinct: true,
      });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneCoupon(id: number) {
    const coupon = await this.couponModel.findByPk(id, {
      include: [
        {
          model: FichePiste,
          include: [
            { model: Vehicle },
            { model: Client },
            { model: TypeLavage },
            { model: ServiceSpecial },
            { model: Station },
            { model: User, as: 'controleur' },
          ],
        },
        { model: User, as: 'washers' },
        { model: Paiement, attributes: ['id', 'methode', 'montant', 'description', 'referenceExterne'] },
        { model: MarketingPromotion, attributes: ['id', 'nom', 'type', 'discountType', 'discountValue', 'serviceSpecialId'] },
      ],
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon #${id} introuvable`);
    }

    return coupon;
  }

  async createCoupon(dto: CreateCouponDto) {
    const fiche = await this.fichePisteModel.findByPk(dto.fichePisteId, {
      include: [
        { model: TypeLavage },
        { model: ServiceSpecial },
      ],
    });

    if (!fiche) {
      throw new NotFoundException(
        `Fiche de piste #${dto.fichePisteId} introuvable`,
      );
    }

    const prixBase = Number(fiche.typeLavage?.prixBase ?? 0);
    const extrasPrix = (fiche.extras ?? []).reduce(
      (sum, extra) => sum + Number(extra.prix),
      0,
    );
    const montantTotal = prixBase + extrasPrix;

    const couponId = await this.sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
      async (t) => {
        const numero = await this.generateCouponNumero(t);
        const coupon = await this.couponModel.create(
          { fichePisteId: dto.fichePisteId, numero, montantTotal } as any,
          { transaction: t },
        );

        if (dto.washerIds && dto.washerIds.length > 0) {
          const washers = dto.washerIds.map((userId) => ({ couponId: coupon.id, userId }));
          await this.couponWashersModel.bulkCreate(washers as any, { transaction: t });
        }

        return coupon.id;
      },
    );

    return this.findOneCoupon(couponId);
  }

  async updateCouponStatus(id: number, dto: UpdateCouponStatusDto) {
    const coupon = await this.couponModel.findByPk(id, {
      include: [
        { model: FichePiste, include: [{ model: TypeLavage }, { model: ServiceSpecial }] },
        { model: User, as: 'washers' },
      ],
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon #${id} introuvable`);
    }

    await this.sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
      async (t) => {
        const updateData: Record<string, any> = { statut: dto.statut };
        if (dto.statut === CouponStatus.Washing) {
          updateData.washingStartedAt = new Date();
        }
        await coupon.update(updateData, { transaction: t });

        if (dto.statut === CouponStatus.Done && coupon.washers?.length > 0) {
          const today = new Date().toISOString().split('T')[0];
          const stationId = coupon.fichePiste?.stationId;
          const extras = coupon.fichePiste?.extras ?? [];

          const typeLavageFrais = coupon.fichePiste?.typeLavage?.fraisService != null
            ? Number(coupon.fichePiste.typeLavage.fraisService) : null;
          const extrasFraisTotal = extras.reduce(
            (sum, e) => sum + (e.fraisService != null ? Number(e.fraisService) : 0), 0,
          );
          const serviceBonuses = extras.filter((e) => e.bonus != null).map((e) => Number(e.bonus));
          const maxServiceBonus = serviceBonuses.length > 0 ? Math.max(...serviceBonuses) : null;

          for (const washer of coupon.washers) {
            let bonusPerWasher: number;
            if (typeLavageFrais != null || extrasFraisTotal > 0) {
              bonusPerWasher = (typeLavageFrais ?? 0) + extrasFraisTotal;
            } else if (maxServiceBonus != null) {
              bonusPerWasher = maxServiceBonus;
            } else {
              bonusPerWasher = Number(washer.bonusParLavage) || 150;
            }

            const [perf] = await this.performanceModel.findOrCreate({
              where: { userId: washer.id, stationId, date: today },
              defaults: { userId: washer.id, stationId, date: today, vehiculesLaves: 0, bonusEstime: 0 } as any,
              transaction: t,
            });

            // Atomic increment — no read-modify-write race condition
            await perf.increment(
              { vehiculesLaves: 1, bonusEstime: bonusPerWasher },
              { transaction: t },
            );
          }
        }

        if (dto.statut === CouponStatus.Paid) {
          const fichePiste = coupon.fichePiste;

          if (fichePiste?.clientId) {
            const client = await this.clientModel.findByPk(fichePiste.clientId, {
              lock: Transaction.LOCK.UPDATE,
              transaction: t,
            });
            if (client) {
              // Atomic increment — prevents lost updates under concurrency
              await client.increment('pointsFidelite', { by: 1, transaction: t });
              const newPoints = (client.pointsFidelite ?? 0) + 1;

              if (newPoints % 10 === 0) {
                const bonCode = await this.generateFideliteBonCode(t);
                await this.bonLavageModel.create({
                  code: bonCode,
                  pourcentage: 100,
                  stationId: null,
                  createdById: fichePiste.controleurId ?? 1,
                  description: `Bon fidélité automatique — ${newPoints} lavages (client #${client.id})`,
                } as any, { transaction: t });
              }
            }
          }
        }
      },
    );

    // Confirm commercial registration after commit (best-effort, separate concern)
    if (dto.statut === CouponStatus.Paid && coupon.fichePiste?.vehicleId) {
      const vehicle = await this.vehicleModel.findByPk(coupon.fichePiste.vehicleId);
      if (vehicle?.immatriculation) {
        await this.commercialService.confirmRegistrationByPlate(
          vehicle.immatriculation,
          coupon.fichePiste.vehicleId,
          coupon.id,
        );
      }
    }

    return this.findOneCoupon(id);
  }

  async assignWashers(couponId: number, dto: AssignWashersDto) {
    const coupon = await this.couponModel.findByPk(couponId);
    if (!coupon) {
      throw new NotFoundException(`Coupon #${couponId} introuvable`);
    }

    await this.sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
      async (t) => {
        await this.couponWashersModel.destroy({ where: { couponId }, transaction: t });

        if (dto.washerIds.length > 0) {
          const washers = dto.washerIds.map((userId) => ({ couponId, userId }));
          await this.couponWashersModel.bulkCreate(washers as any, { transaction: t });
        }
      },
    );

    return this.findOneCoupon(couponId);
  }

  async addServicesToCoupon(id: number, dto: AddServicesToCouponDto) {
    const coupon = await this.couponModel.findByPk(id, {
      include: [{ model: FichePiste, include: [{ model: ServiceSpecial }] }],
    });
    if (!coupon) throw new NotFoundException(`Coupon #${id} introuvable`);
    if (coupon.statut !== CouponStatus.Washing) {
      throw new NotFoundException('Impossible de modifier un coupon qui n\'est pas en cours de lavage');
    }

    const fiche = coupon.fichePiste;
    const isCatB = false;

    await this.sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
      async (t) => {
      // Add new extras (skip duplicates)
      if (dto.extrasIds && dto.extrasIds.length > 0) {
        const existingExtrasIds = (fiche.extras ?? []).map((e) => e.id);
        const newExtrasIds = dto.extrasIds.filter((eid) => !existingExtrasIds.includes(eid));
        if (newExtrasIds.length > 0) {
          await this.ficheExtrasModel.bulkCreate(
            newExtrasIds.map((serviceSpecialId) => ({ fichePisteId: fiche.id, serviceSpecialId })) as any,
            { transaction: t },
          );
        }
      }

      // Recalculate montantTotal from the updated fiche state
      const updatedFiche = await this.fichePisteModel.findByPk(fiche.id, {
        include: [{ model: ServiceSpecial }, { model: TypeLavage }],
        transaction: t,
      });
      const allExtrasIds = (updatedFiche!.extras ?? []).map((e) => e.id);
      let newTotal = 0;

      const typeLavageIds: number[] = [];
      if (updatedFiche!.typeLavageId) typeLavageIds.push(updatedFiche!.typeLavageId);
      if (dto.typeLavageIds && dto.typeLavageIds.length > 0) {
        for (const tid of dto.typeLavageIds) {
          if (!typeLavageIds.includes(tid)) typeLavageIds.push(tid);
        }
      }
      if (typeLavageIds.length > 0) {
        const washTypes = await this.typeLavageModel.findAll({
          where: { id: { [Op.in]: typeLavageIds } },
          transaction: t,
        });
        newTotal += washTypes.reduce((sum, wt) =>
          sum + (isCatB && wt.prixCatB != null ? Number(wt.prixCatB) : Number(wt.prixBase ?? 0)), 0);
      }

      if (allExtrasIds.length > 0) {
        const extras = await this.serviceSpecialModel.findAll({
          where: { id: { [Op.in]: allExtrasIds } },
          transaction: t,
        });
        newTotal += extras.reduce((sum, e) =>
          sum + (isCatB && e.prixCatB != null ? Number(e.prixCatB) : Number(e.prix ?? 0)), 0);
      }

      const remise = Number(coupon.remise) || 0;
      await coupon.update({ montantTotal: Math.max(0, newTotal - remise) }, { transaction: t });
    });

    return this.findOneCoupon(id);
  }

  async findMyAssigned(userId: number) {
    const couponIds = await this.couponWashersModel.findAll({
      where: { userId },
      attributes: ['couponId'],
    });

    const ids = couponIds.map((cw) => cw.couponId);

    if (ids.length === 0) {
      return [];
    }

    return this.couponModel.findAll({
      where: { id: { [Op.in]: ids } },
      include: [
        {
          model: FichePiste,
          include: [
            { model: Vehicle, attributes: ['immatriculation', 'modele'] },
            { model: Client, attributes: ['nom'] },
            { model: TypeLavage, attributes: ['nom', 'prixBase'] },
          ],
        },
        { model: User, as: 'washers', attributes: ['id', 'nom', 'prenom'] },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  private async generateFideliteBonCode(t: Transaction): Promise<string> {
    let code: string;
    let exists: boolean;
    do {
      const random = Math.floor(Math.random() * 9999) + 1;
      code = `BON-${String(random).padStart(4, '0')}`;
      exists = !!(await this.bonLavageModel.findOne({ where: { code }, transaction: t }));
    } while (exists);
    return code;
  }

  private async generateCouponNumero(t: Transaction): Promise<string> {
    const lastCoupon = await this.couponModel.findOne({
      order: [['numero', 'DESC']],
      attributes: ['numero'],
      lock: Transaction.LOCK.UPDATE,
      transaction: t,
    });
    const next = lastCoupon?.numero ? (parseInt(lastCoupon.numero.match(/CPN-(\d+)/)?.[1] ?? '0', 10) + 1) : 1;
    return `CPN-${String(next).padStart(4, '0')}`;
  }

  // ─── Nouveau Lavage (combined Fiche + Coupon) ──────────────────────

  async createNouveauLavage(dto: CreateNouveauLavageDto) {
    const transaction = await this.sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    });

    try {
      // 1. Resolve typeLavageId (multi-select: first ID is primary FK)
      const resolvedTypeIds: number[] =
        dto.typeLavageIds && dto.typeLavageIds.length > 0
          ? dto.typeLavageIds
          : dto.typeLavageId
          ? [dto.typeLavageId]
          : [];
      const primaryTypeLavageId = resolvedTypeIds[0] ?? null;

      // 2. Create FichePiste
      const ficheNumero = await this.generateFicheNumero(transaction);
      const { extrasIds, washerIds, promotionId, typeLavageIds: _tIds, typeLavageId: _tId, ...ficheBase } = dto;

      const fiche = await this.fichePisteModel.create(
        { ...ficheBase, typeLavageId: primaryTypeLavageId, numero: ficheNumero } as any,
        { transaction },
      );

      // 3. Attach extras
      const allExtrasIds = extrasIds ? [...extrasIds] : [];

      if (allExtrasIds.length > 0) {
        const extras = allExtrasIds.map((serviceSpecialId) => ({
          fichePisteId: fiche.id,
          serviceSpecialId,
        }));
        await this.ficheExtrasModel.bulkCreate(extras as any, { transaction });
      }

      // 4. Calculate total — sum all selected wash types using vehicle category pricing
      const isCatB = dto.vehicleCategory === 'B';
      let prixBase = 0;
      if (resolvedTypeIds.length > 0) {
        const washTypeRecords = await this.typeLavageModel.findAll({
          where: { id: { [Op.in]: resolvedTypeIds } },
          transaction,
        });
        prixBase = washTypeRecords.reduce((sum, t) => {
          const price = isCatB && t.prixCatB != null ? Number(t.prixCatB) : Number(t.prixBase ?? 0);
          return sum + price;
        }, 0);
      }

      let extrasPrix = 0;
      if (allExtrasIds.length > 0) {
        const extrasRecords = await this.serviceSpecialModel.findAll({
          where: { id: { [Op.in]: allExtrasIds } },
          transaction,
        });
        extrasPrix = extrasRecords.reduce((sum, e) => {
          const price = isCatB && e.prixCatB != null ? Number(e.prixCatB) : Number(e.prix);
          return sum + price;
        }, 0);
      }

      const montantTotal = prixBase + extrasPrix;

      // 5. Apply promotion if provided
      let finalMontant = montantTotal;
      let remise: number | null = null;
      let validPromotionId: number | null = null;

      if (promotionId) {
        const promotion = await this.promotionModel.findByPk(promotionId, {
          include: [{ model: this.serviceSpecialModel }],
          transaction,
        });

        if (promotion && promotion.isActive) {
          const today = new Date().toISOString().slice(0, 10);
          const withinDates = promotion.startDate <= today && promotion.endDate >= today;
          const withinUsage = promotion.maxUses === null || promotion.usedCount < promotion.maxUses;
          const stationMatch = promotion.stationId === null || promotion.stationId === dto.stationId;

          if (withinDates && withinUsage && stationMatch) {
            if (promotion.type === PromotionType.Discount) {
              if (promotion.discountType === DiscountType.Percentage) {
                remise = Math.round(montantTotal * Number(promotion.discountValue) / 100);
              } else {
                remise = Number(promotion.discountValue ?? 0);
              }
              remise = Math.min(remise, montantTotal);
              finalMontant = montantTotal - remise;
            } else if (promotion.type === PromotionType.ServiceOffert && promotion.serviceSpecialId) {
              // Add free service to extras if not already present — no remise, just a free add-on
              if (!allExtrasIds.includes(promotion.serviceSpecialId)) {
                await this.ficheExtrasModel.create(
                  { fichePisteId: fiche.id, serviceSpecialId: promotion.serviceSpecialId } as any,
                  { transaction },
                );
              }
            }

            validPromotionId = promotion.id;
            await promotion.increment('usedCount', { transaction });
          }
        }
      }

      // 5. Create Coupon
      const couponNumero = await this.generateCouponNumero(transaction);
      const coupon = await this.couponModel.create(
        {
          fichePisteId: fiche.id,
          numero: couponNumero,
          montantTotal: finalMontant,
          promotionId: validPromotionId,
          remise,
        } as any,
        { transaction },
      );

      // 6. Assign washers
      if (washerIds && washerIds.length > 0) {
        const washers = washerIds.map((userId) => ({
          couponId: coupon.id,
          userId,
        }));
        await this.couponWashersModel.bulkCreate(washers as any, {
          transaction,
        });
      }

      await transaction.commit();

      // 7. Auto-confirm commercial registration if the vehicle plate was prospected
      if (dto.linkedProspectId) {
        // Explicit link: confirm by registration ID (matches by phone/name too)
        await this.commercialService.confirmRegistrationById(
          dto.linkedProspectId,
          dto.vehicleId,
          coupon.id,
        );
      } else if (dto.vehicleId) {
        // Fallback: match by plate
        const vehicle = await this.vehicleModel.findByPk(dto.vehicleId);
        if (vehicle?.immatriculation) {
          await this.commercialService.confirmRegistrationByPlate(
            vehicle.immatriculation,
            dto.vehicleId,
            coupon.id,
          );
        }
      }

      // Return full coupon with all relations
      return this.findOneCoupon(coupon.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
