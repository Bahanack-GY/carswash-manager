import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op, Transaction } from 'sequelize';
import { CommercialRegistration } from './models/commercial-registration.model.js';
import { Vehicle } from '../clients/models/vehicle.model.js';
import { Client } from '../clients/models/client.model.js';
import { Station } from '../stations/models/station.model.js';
import { User } from '../users/models/user.model.js';
import { Coupon } from '../wash-operations/models/coupon.model.js';
import { FichePiste } from '../wash-operations/models/fiche-piste.model.js';
import { ServiceSpecial } from '../wash-operations/models/service-special.model.js';
import { Performance } from '../users/models/performance.model.js';
import { RegisterVehicleDto } from './dto/register-vehicle.dto.js';

@Injectable()
export class CommercialService {
  constructor(
    private readonly sequelize: Sequelize,
    @InjectModel(CommercialRegistration)
    private readonly registrationModel: typeof CommercialRegistration,
    @InjectModel(Vehicle)
    private readonly vehicleModel: typeof Vehicle,
    @InjectModel(Client)
    private readonly clientModel: typeof Client,
    @InjectModel(Station)
    private readonly stationModel: typeof Station,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(Coupon)
    private readonly couponModel: typeof Coupon,
    @InjectModel(FichePiste)
    private readonly fichePisteModel: typeof FichePiste,
    @InjectModel(ServiceSpecial)
    private readonly serviceSpecialModel: typeof ServiceSpecial,
    @InjectModel(Performance)
    private readonly performanceModel: typeof Performance,
  ) {}

  async registerVehicle(commercialId: number, stationId: number, dto: RegisterVehicleDto) {
    const plate = dto.immatriculation.trim();
    const today = new Date().toISOString().slice(0, 10);
    // Only block duplicates registered within the last 7 days to avoid stale pending records accumulating
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

    return this.sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
      async (t) => {
        // Lock matching rows so concurrent registrations for the same plate are serialized
        const existing = await this.registrationModel.findOne({
          where: {
            immatriculation: { [Op.iLike]: plate },
            confirmed: false,
            date: { [Op.gte]: sevenDaysAgoStr },
          },
          lock: Transaction.LOCK.UPDATE,
          transaction: t,
        });
        if (existing) {
          throw new ConflictException(
            `Le véhicule ${plate} a déjà un enregistrement en attente de confirmation`,
          );
        }

        const registration = await this.registrationModel.create({
          commercialId,
          immatriculation: plate.toUpperCase(),
          prospectNom: dto.prospectNom.trim(),
          prospectTelephone: dto.prospectTelephone.trim(),
          prospectEmail: dto.prospectEmail?.trim() || null,
          prospectQuartier: dto.prospectQuartier?.trim() || null,
          vehicleBrand: dto.vehicleBrand?.trim() || null,
          vehicleModele: dto.vehicleModele?.trim() || null,
          vehicleColor: dto.vehicleColor?.trim() || null,
          vehicleType: dto.vehicleType?.trim() || null,
          stationId,
          date: today,
          confirmed: false,
        } as any, { transaction: t });

        return registration;
      },
    );
  }

  async getTodayRegistrations(commercialId: number, stationId: number) {
    const today = new Date().toISOString().slice(0, 10);

    return this.registrationModel.findAll({
      where: { commercialId, stationId, date: today },
      order: [['createdAt', 'DESC']],
    });
  }

  async getStats(commercialId: number, stationId: number) {
    const today = new Date().toISOString().slice(0, 10);

    const commercial = await this.userModel.findByPk(commercialId);
    const station = await this.stationModel.findByPk(stationId);
    const dailyGoal = commercial?.objectifJournalier ?? station?.objectifCommercialJournalier ?? 10;

    const todayTotal = await this.registrationModel.count({
      where: { commercialId, stationId, date: today },
    });

    const todayConfirmed = await this.registrationModel.count({
      where: { commercialId, stationId, date: today, confirmed: true },
    });

    const allTimeTotal = await this.registrationModel.count({
      where: { commercialId, stationId },
    });

    const allTimeConfirmed = await this.registrationModel.count({
      where: { commercialId, stationId, confirmed: true },
    });

    return { todayTotal, todayConfirmed, allTimeTotal, allTimeConfirmed, dailyGoal };
  }

  async getHistory(
    commercialId: number,
    stationId: number,
    filters?: { from?: string; to?: string; status?: 'confirmed' | 'pending'; search?: string },
  ) {
    const where: any = { commercialId, stationId };

    if (filters?.from && filters?.to) {
      where.date = { [Op.between]: [filters.from, filters.to] };
    } else if (filters?.from) {
      where.date = { [Op.gte]: filters.from };
    } else if (filters?.to) {
      where.date = { [Op.lte]: filters.to };
    }

    if (filters?.status === 'confirmed') where.confirmed = true;
    if (filters?.status === 'pending') where.confirmed = false;

    if (filters?.search) {
      const term = `%${filters.search.trim()}%`;
      where[Op.or as any] = [
        { immatriculation: { [Op.iLike]: term } },
        { prospectNom: { [Op.iLike]: term } },
        { prospectTelephone: { [Op.iLike]: term } },
      ];
    }

    return this.registrationModel.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Confirm a commercial registration by matching the vehicle plate.
   * Called when a new lavage is created with a plate that a commercial registered.
   */
  async confirmRegistrationByPlate(
    plate: string,
    vehicleId: number,
    couponId?: number,
  ) {
    return this.sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
      async (t) => {
        // SELECT FOR UPDATE prevents two concurrent lavages from confirming the same prospect
        const registration = await this.registrationModel.findOne({
          where: { immatriculation: { [Op.iLike]: plate.trim() }, confirmed: false },
          order: [['createdAt', 'ASC']],
          lock: Transaction.LOCK.UPDATE,
          transaction: t,
        });

        if (!registration) return null;

        await registration.update(
          { confirmed: true, vehicleId, ...(couponId ? { couponId } : {}) },
          { transaction: t },
        );

        const vehicle = await this.vehicleModel.findByPk(vehicleId, { transaction: t });
        if (vehicle?.clientId) {
          await this.clientModel.update(
            { commercialId: registration.commercialId },
            { where: { id: vehicle.clientId, commercialId: null }, transaction: t },
          );
        }

        return registration;
      },
    );
  }

  async confirmRegistrationById(
    registrationId: number,
    vehicleId: number,
    couponId?: number,
  ) {
    return this.sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
      async (t) => {
        // SELECT FOR UPDATE prevents race between explicit link and plate-based fallback
        const registration = await this.registrationModel.findOne({
          where: { id: registrationId, confirmed: false },
          lock: Transaction.LOCK.UPDATE,
          transaction: t,
        });

        if (!registration) return null;

        await registration.update(
          { confirmed: true, vehicleId, ...(couponId ? { couponId } : {}) },
          { transaction: t },
        );

        const vehicle = await this.vehicleModel.findByPk(vehicleId, { transaction: t });
        if (vehicle?.clientId) {
          await this.clientModel.update(
            { commercialId: registration.commercialId },
            { where: { id: vehicle.clientId, commercialId: null }, transaction: t },
          );
        }

        return registration;
      },
    );
  }

  // ─── Portefeuille clients ────────────────────────────────────

  async getPortfolio(commercialId: number) {
    return this.clientModel.findAll({
      where: { commercialId },
      include: [{ model: Vehicle, attributes: ['id', 'immatriculation', 'brand', 'modele', 'color', 'type'] }],
      order: [['createdAt', 'DESC']],
    });
  }

  async transferPortfolio(fromCommercialId: number, toCommercialId: number | null) {
    const [count] = await this.clientModel.update(
      { commercialId: toCommercialId },
      { where: { commercialId: fromCommercialId } },
    );
    return { transferred: count, toCommercialId };
  }

  async getPendingRegistrations(stationId: number) {
    return this.registrationModel.findAll({
      where: { stationId, confirmed: false },
      include: [{ model: User, attributes: ['id', 'nom', 'prenom'] }],
      order: [['createdAt', 'DESC']],
    });
  }

  // ─── Commissions ──────────────────────────────────────────────

  /**
   * Returns all confirmed registrations for a commercial with commission
   * amounts computed from the extras (services spéciaux) in each linked coupon.
   */
  async getCommissions(
    commercialId: number,
    stationId: number,
    filters?: { from?: string; to?: string },
  ) {
    const where: any = { commercialId, stationId, confirmed: true };
    if (filters?.from && filters?.to) {
      where.date = { [Op.between]: [filters.from, filters.to] };
    } else if (filters?.from) {
      where.date = { [Op.gte]: filters.from };
    } else if (filters?.to) {
      where.date = { [Op.lte]: filters.to };
    }

    const registrations = await this.registrationModel.findAll({
      where,
      include: [
        {
          model: Coupon,
          required: false,
          include: [
            {
              model: FichePiste,
              include: [
                {
                  model: ServiceSpecial,
                  attributes: ['id', 'nom', 'commission'],
                },
              ],
            },
          ],
        },
      ],
      order: [['date', 'DESC']],
    });

    const entries = registrations.map((reg) => {
      const extras: ServiceSpecial[] = (reg as any).coupon?.fichePiste?.extras ?? [];
      const commissionsBreakdown = extras
        .filter((e) => e.commission != null && Number(e.commission) > 0)
        .map((e) => ({ nom: e.nom, commission: Number(e.commission) }));
      const totalCommission = commissionsBreakdown.reduce((s, e) => s + e.commission, 0);

      return {
        id: reg.id,
        date: reg.date,
        immatriculation: reg.immatriculation,
        prospectNom: reg.prospectNom,
        vehicleType: (reg as any).vehicleType ?? null,
        couponId: reg.couponId ?? null,
        couponNumero: (reg as any).coupon?.numero ?? null,
        montantTotal: (reg as any).coupon?.montantTotal ?? null,
        services: commissionsBreakdown,
        totalCommission,
      };
    });

    const grandTotal = entries.reduce((s, e) => s + e.totalCommission, 0);
    return { entries, grandTotal };
  }

  /**
   * Admin view: commissions per commercial + washer frais de service per user.
   */
  async getAdminBonusSummary(
    stationId: number,
    filters?: { from?: string; to?: string },
  ) {
    // ── Commissions per commercial ─────────────────────────────
    const regWhere: any = { stationId, confirmed: true };
    if (filters?.from && filters?.to) {
      regWhere.date = { [Op.between]: [filters.from, filters.to] };
    } else if (filters?.from) {
      regWhere.date = { [Op.gte]: filters.from };
    } else if (filters?.to) {
      regWhere.date = { [Op.lte]: filters.to };
    }

    const confirmedRegs = await this.registrationModel.findAll({
      where: regWhere,
      include: [
        { model: User, attributes: ['id', 'nom', 'prenom'] },
        {
          model: Coupon,
          required: false,
          include: [
            { model: FichePiste, include: [{ model: ServiceSpecial, attributes: ['id', 'nom', 'commission'] }] },
          ],
        },
      ],
    });

    // Group by commercial
    const commByCommercial = new Map<number, { nom: string; prenom: string; total: number; count: number }>();
    for (const reg of confirmedRegs) {
      const commercial = (reg as any).commercial;
      if (!commercial) continue;
      const extras: ServiceSpecial[] = (reg as any).coupon?.fichePiste?.extras ?? [];
      const commissionTotal = extras.reduce((s, e) => s + (e.commission != null ? Number(e.commission) : 0), 0);
      const existing = commByCommercial.get(commercial.id) ?? { nom: commercial.nom, prenom: commercial.prenom, total: 0, count: 0 };
      existing.total += commissionTotal;
      existing.count += 1;
      commByCommercial.set(commercial.id, existing);
    }

    const commercialCommissions = Array.from(commByCommercial.entries()).map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.total - a.total);
    const totalCommissions = commercialCommissions.reduce((s, c) => s + c.total, 0);

    // ── Frais de service per washer ────────────────────────────
    const perfWhere: any = { stationId };
    if (filters?.from && filters?.to) {
      perfWhere.date = { [Op.between]: [filters.from, filters.to] };
    } else if (filters?.from) {
      perfWhere.date = { [Op.gte]: filters.from };
    } else if (filters?.to) {
      perfWhere.date = { [Op.lte]: filters.to };
    }

    const performances = await this.performanceModel.findAll({
      where: perfWhere,
      include: [{ model: User, attributes: ['id', 'nom', 'prenom'] }],
    });

    // Aggregate per user
    const fraisByWasher = new Map<number, { nom: string; prenom: string; totalFrais: number; vehiculesLaves: number }>();
    for (const perf of performances) {
      const washer = (perf as any).user;
      if (!washer) continue;
      const existing = fraisByWasher.get(washer.id) ?? { nom: washer.nom, prenom: washer.prenom, totalFrais: 0, vehiculesLaves: 0 };
      existing.totalFrais += Number(perf.bonusEstime ?? 0);
      existing.vehiculesLaves += Number(perf.vehiculesLaves ?? 0);
      fraisByWasher.set(washer.id, existing);
    }

    const washerFrais = Array.from(fraisByWasher.entries()).map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.totalFrais - a.totalFrais);
    const totalFraisService = washerFrais.reduce((s, w) => s + w.totalFrais, 0);

    return {
      commercialCommissions,
      totalCommissions,
      washerFrais,
      totalFraisService,
    };
  }
}
