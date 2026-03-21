import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, fn, col } from 'sequelize';
import { Paiement } from '../billing/models/paiement.model.js';
import { FichePiste } from '../wash-operations/models/fiche-piste.model.js';
import { Coupon } from '../wash-operations/models/coupon.model.js';
import { Reservation } from '../reservations/models/reservation.model.js';
import { Performance } from '../users/models/performance.model.js';
import { User } from '../users/models/user.model.js';
import { Vehicle } from '../clients/models/vehicle.model.js';
import { TypeLavage } from '../wash-operations/models/type-lavage.model.js';
import { Station } from '../stations/models/station.model.js';
import { Incident } from '../incidents/models/incident.model.js';
import {
  TransactionType,
  CouponStatus,
  FichePisteStatus,
  StationStatus,
  IncidentStatus,
} from '../common/constants/status.enum.js';

@Injectable()
export class DashboardService {
  /** Consistent "today" helpers using local timezone */
  private getToday() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return { startOfDay, endOfDay, dateStr };
  }

  constructor(
    @InjectModel(Paiement)
    private readonly paiementModel: typeof Paiement,
    @InjectModel(FichePiste)
    private readonly fichePisteModel: typeof FichePiste,
    @InjectModel(Coupon)
    private readonly couponModel: typeof Coupon,
    @InjectModel(Reservation)
    private readonly reservationModel: typeof Reservation,
    @InjectModel(Performance)
    private readonly performanceModel: typeof Performance,
    @InjectModel(Station)
    private readonly stationModel: typeof Station,
    @InjectModel(Incident)
    private readonly incidentModel: typeof Incident,
  ) {}

  // ─── Station KPIs ─────────────────────────────────────────────────

  async getStats(stationId: number, range: { start: Date; end: Date; startStr: string; endStr: string }) {
    const { start, end, startStr, endStr } = range;

    const [revenue, expenses, vehicules, lavagesActifs, reservations] =
      await Promise.all([
        this.paiementModel.sum('montant', {
          where: {
            stationId,
            type: TransactionType.Income,
            createdAt: { [Op.gte]: start, [Op.lt]: end },
          },
        }),

        this.paiementModel.sum('montant', {
          where: {
            stationId,
            type: TransactionType.Expense,
            createdAt: { [Op.gte]: start, [Op.lt]: end },
          },
        }),

        this.fichePisteModel.count({
          where: { stationId, date: { [Op.gte]: startStr, [Op.lte]: endStr } },
        }),

        // Live metric — always current
        this.couponModel.count({
          where: { statut: CouponStatus.Washing },
          include: [
            {
              model: FichePiste,
              where: { stationId },
              attributes: [],
            },
          ],
        }),

        this.reservationModel.count({
          where: {
            stationId,
            dateHeureApport: { [Op.gte]: start, [Op.lt]: end },
          },
        }),
      ]);

    return {
      revenue: revenue ?? 0,
      expenses: expenses ?? 0,
      vehicules,
      lavagesActifs,
      reservations,
    };
  }

  // ─── Revenue chart ───────────────────────────────────────────────

  async getRevenue(stationId: number, range: { start: Date; end: Date; startStr: string; endStr: string }) {
    return this.getRevenueRange(stationId, range.start, range.end, range.startStr, range.endStr);
  }

  // ─── Recent activity feed ─────────────────────────────────────────

  async getActivity(stationId: number, range: { startStr: string; endStr: string }) {
    const { startStr, endStr } = range;

    const fiches = await this.fichePisteModel.findAll({
      where: {
        stationId,
        date: { [Op.gte]: startStr, [Op.lte]: endStr },
      },
      include: [
        { model: Vehicle, attributes: ['id', 'immatriculation'] },
        { model: User, as: 'controleur', attributes: ['id', 'nom', 'prenom'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    return fiches.map((fiche) => {
      let type: string;

      switch (fiche.statut) {
        case FichePisteStatus.Open:
          type = 'Nouvelle fiche ouverte';
          break;
        case FichePisteStatus.InProgress:
          type = 'Lavage en cours';
          break;
        case FichePisteStatus.Completed:
          type = 'Lavage terminé';
          break;
        default:
          type = 'Activité';
      }

      const who = fiche.controleur
        ? `${fiche.controleur.prenom} ${fiche.controleur.nom}`
        : null;
      const car = fiche.vehicle?.immatriculation ?? null;

      const descParts = [car, who].filter(Boolean);
      const description = descParts.length > 0 ? descParts.join(' — ') : '';

      return {
        id: fiche.id,
        type,
        description,
        timestamp: fiche.createdAt,
        userId: fiche.controleurId ?? undefined,
      };
    });
  }

  // ─── Top performers ──────────────────────────────────────────────

  async getTopPerformers(stationId: number, range: { startStr: string; endStr: string }) {
    const { startStr, endStr } = range;
    const isSingleDay = startStr === endStr;

    if (isSingleDay) {
      const performances = await this.performanceModel.findAll({
        where: { stationId, date: startStr },
        include: [{ model: User, attributes: ['id', 'nom', 'prenom'] }],
        order: [['vehiculesLaves', 'DESC']],
        limit: 5,
      });

      return performances.map((perf) => ({
        id: perf.user?.id ?? perf.userId,
        nom: perf.user?.nom ?? '',
        prenom: perf.user?.prenom ?? '',
        lavages: perf.vehiculesLaves,
        score: Number(perf.bonusEstime) || 0,
      }));
    }

    // Multi-day: aggregate with SUM + GROUP BY
    const rows = (await this.performanceModel.findAll({
      where: { stationId, date: { [Op.gte]: startStr, [Op.lte]: endStr } },
      attributes: [
        'userId',
        [fn('SUM', col('vehiculesLaves')), 'totalLavages'],
        [fn('SUM', col('bonusEstime')), 'totalScore'],
      ],
      group: ['userId'],
      order: [[fn('SUM', col('vehiculesLaves')), 'DESC']],
      limit: 5,
      raw: true,
    })) as unknown as { userId: number; totalLavages: string; totalScore: string }[];

    if (rows.length === 0) return [];

    const userIds = rows.map((r) => r.userId);
    const users = await User.findAll({
      where: { id: userIds },
      attributes: ['id', 'nom', 'prenom'],
      raw: true,
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return rows.map((r) => {
      const u = userMap.get(r.userId);
      return {
        id: r.userId,
        nom: u?.nom ?? '',
        prenom: u?.prenom ?? '',
        lavages: parseInt(r.totalLavages, 10) || 0,
        score: parseFloat(r.totalScore) || 0,
      };
    });
  }

  // ─── Wash type distribution (pie chart) ───────────────────────────

  async getWashTypeDistribution(stationId: number, range: { startStr: string; endStr: string }) {
    const { startStr, endStr } = range;

    const fiches = await this.fichePisteModel.findAll({
      where: {
        stationId,
        date: { [Op.gte]: startStr, [Op.lte]: endStr },
      },
      attributes: [
        'typeLavageId',
        [fn('COUNT', col('FichePiste.id')), 'count'],
      ],
      include: [{ model: TypeLavage, attributes: ['id', 'nom'] }],
      group: ['typeLavageId', 'typeLavage.id', 'typeLavage.nom'],
      raw: false,
    });

    const totalCount = fiches.reduce(
      (sum, f) =>
        sum +
        (parseInt(f.getDataValue('count' as any) as string, 10) || 0),
      0,
    );

    return fiches.map((fiche) => {
      const count =
        parseInt(fiche.getDataValue('count' as any) as string, 10) || 0;
      return {
        type: fiche.typeLavage?.nom ?? 'Autre',
        count,
        percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
      };
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // GLOBAL (cross-station) endpoints
  // ═══════════════════════════════════════════════════════════════════

  private async getActiveStations() {
    return this.stationModel.findAll({
      where: { status: StationStatus.Active },
      attributes: ['id', 'nom'],
      raw: true,
    });
  }

  /** Convert optional startDate/endDate strings to a date range object */
  parseDateRange(startDate?: string, endDate?: string) {
    const today = this.getToday();

    if (startDate && endDate) {
      if (startDate > endDate) {
        throw new BadRequestException(
          `La date de début (${startDate}) ne peut pas être postérieure à la date de fin (${endDate})`,
        );
      }
      const startParts = startDate.split('-').map(Number);
      const endParts = endDate.split('-').map(Number);
      const start = new Date(startParts[0], startParts[1] - 1, startParts[2]);
      const end = new Date(endParts[0], endParts[1] - 1, endParts[2] + 1); // exclusive
      return {
        start,
        end,
        startStr: startDate,
        endStr: endDate,
      };
    }

    return {
      start: today.startOfDay,
      end: today.endOfDay,
      startStr: today.dateStr,
      endStr: today.dateStr,
    };
  }

  /** Get all YYYY-MM-DD strings between startStr and endStr (inclusive) */
  private getAllDateStrings(startStr: string, endStr: string): string[] {
    const dates: string[] = [];
    const parts = startStr.split('-').map(Number);
    const current = new Date(parts[0], parts[1] - 1, parts[2]);
    const endParts = endStr.split('-').map(Number);
    const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);

    while (current <= end) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${d}`);
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  /** Efficient revenue query using GROUP BY instead of one-per-day loop */
  private async getRevenueRange(
    stationId: number | null,
    start: Date,
    end: Date,
    startStr: string,
    endStr: string,
  ): Promise<{ date: string; amount: number }[]> {
    const where: any = {
      type: TransactionType.Income,
      createdAt: { [Op.gte]: start, [Op.lt]: end },
    };
    if (stationId) where.stationId = stationId;

    const rows = (await this.paiementModel.findAll({
      where,
      attributes: [
        [fn('DATE', col('createdAt')), 'date'],
        [fn('SUM', col('montant')), 'amount'],
      ],
      group: [fn('DATE', col('createdAt'))],
      order: [[fn('DATE', col('createdAt')), 'ASC']],
      raw: true,
    })) as unknown as { date: string; amount: string }[];

    // Build a map of date → amount
    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(row.date, parseFloat(row.amount) || 0);
    }

    // Fill all days in the range
    return this.getAllDateStrings(startStr, endStr).map((d) => ({
      date: new Date(d).toISOString(),
      amount: map.get(d) ?? 0,
    }));
  }

  // ─── Global KPIs ────────────────────────────────────────────────

  async getGlobalStats(range: { start: Date; end: Date; startStr: string; endStr: string }) {
    const { start, end, startStr, endStr } = range;

    const [totalRevenue, totalExpenses, totalVehicules, totalLavagesActifs, totalReservations, stationCount, incidentCount] =
      await Promise.all([
        this.paiementModel.sum('montant', {
          where: {
            type: TransactionType.Income,
            createdAt: { [Op.gte]: start, [Op.lt]: end },
          },
        }),

        this.paiementModel.sum('montant', {
          where: {
            type: TransactionType.Expense,
            createdAt: { [Op.gte]: start, [Op.lt]: end },
          },
        }),

        this.fichePisteModel.count({
          where: { date: { [Op.gte]: startStr, [Op.lte]: endStr } },
        }),

        // Live metric — always current
        this.couponModel.count({
          where: { statut: CouponStatus.Washing },
        }),

        this.reservationModel.count({
          where: {
            dateHeureApport: { [Op.gte]: start, [Op.lt]: end },
          },
        }),

        // Live metrics
        this.stationModel.count({
          where: { status: StationStatus.Active },
        }),

        this.incidentModel.count({
          where: { statut: { [Op.ne]: IncidentStatus.Resolved } },
        }),
      ]);

    return {
      totalRevenue: totalRevenue ?? 0,
      totalExpenses: totalExpenses ?? 0,
      totalVehicules,
      totalLavagesActifs,
      totalReservations,
      stationCount,
      incidentCount,
    };
  }

  // ─── Revenue by station ────────────────────────────────────────

  async getRevenueByStation(range: { start: Date; end: Date; startStr: string; endStr: string }) {
    const stations = await this.getActiveStations();

    const result = await Promise.all(
      stations.map(async (station) => {
        const data = await this.getRevenueRange(station.id, range.start, range.end, range.startStr, range.endStr);
        return {
          stationId: station.id,
          stationName: station.nom,
          data,
        };
      }),
    );

    return result;
  }

  // ─── Station ranking ───────────────────────────────────────────

  async getStationRanking(range: { start: Date; end: Date; startStr: string; endStr: string }) {
    const { start, end, startStr, endStr } = range;
    const stations = await this.getActiveStations();

    const rankings = await Promise.all(
      stations.map(async (station) => {
        const [revenue, vehicules, reservations, incidentCount] =
          await Promise.all([
            this.paiementModel.sum('montant', {
              where: {
                stationId: station.id,
                type: TransactionType.Income,
                createdAt: { [Op.gte]: start, [Op.lt]: end },
              },
            }),
            this.fichePisteModel.count({
              where: { stationId: station.id, date: { [Op.gte]: startStr, [Op.lte]: endStr } },
            }),
            this.reservationModel.count({
              where: {
                stationId: station.id,
                dateHeureApport: { [Op.gte]: start, [Op.lt]: end },
              },
            }),
            // Incidents: always live (unresolved count)
            this.incidentModel.count({
              where: {
                stationId: station.id,
                statut: { [Op.ne]: IncidentStatus.Resolved },
              },
            }),
          ]);

        return {
          stationId: station.id,
          stationName: station.nom,
          revenue: revenue ?? 0,
          vehicules,
          reservations,
          hasIncident: incidentCount > 0,
        };
      }),
    );

    return rankings.sort((a, b) => b.revenue - a.revenue);
  }

  // ─── Global top performers ─────────────────────────────────────

  async getGlobalTopPerformers(range: { startStr: string; endStr: string }) {
    const { startStr, endStr } = range;
    const isSingleDay = startStr === endStr;

    if (isSingleDay) {
      // Single day: simple query
      const rows = await this.performanceModel.findAll({
        where: { date: startStr },
        include: [{ model: User, attributes: ['id', 'nom', 'prenom'] }],
        order: [['vehiculesLaves', 'DESC']],
        limit: 10,
      });

      const stationIds = [...new Set(rows.map((p) => p.stationId))];
      const stations = stationIds.length > 0
        ? await this.stationModel.findAll({ where: { id: stationIds }, attributes: ['id', 'nom'], raw: true })
        : [];
      const stationMap = new Map(stations.map((s) => [s.id, s.nom]));

      return rows.map((perf) => ({
        id: perf.user?.id ?? perf.userId,
        nom: perf.user?.nom ?? '',
        prenom: perf.user?.prenom ?? '',
        lavages: perf.vehiculesLaves,
        score: Number(perf.bonusEstime) || 0,
        stationName: stationMap.get(perf.stationId) ?? '',
      }));
    }

    // Multi-day: aggregate with SUM + GROUP BY
    const rows = (await this.performanceModel.findAll({
      where: { date: { [Op.gte]: startStr, [Op.lte]: endStr } },
      attributes: [
        'userId',
        [fn('SUM', col('vehiculesLaves')), 'totalLavages'],
        [fn('SUM', col('bonusEstime')), 'totalScore'],
      ],
      group: ['userId'],
      order: [[fn('SUM', col('vehiculesLaves')), 'DESC']],
      limit: 10,
      raw: true,
    })) as unknown as { userId: number; totalLavages: string; totalScore: string }[];

    if (rows.length === 0) return [];

    // Fetch user details and station names
    const userIds = rows.map((r) => r.userId);
    const users = await this.performanceModel.findAll({
      where: { userId: userIds, date: { [Op.gte]: startStr, [Op.lte]: endStr } },
      attributes: ['userId', 'stationId'],
      include: [{ model: User, attributes: ['id', 'nom', 'prenom'] }],
      group: ['userId', 'stationId', 'user.id', 'user.nom', 'user.prenom'],
      raw: false,
    });

    const userMap = new Map<number, { nom: string; prenom: string }>();
    const userStationMap = new Map<number, number>();
    for (const u of users) {
      if (!userMap.has(u.userId)) {
        userMap.set(u.userId, { nom: u.user?.nom ?? '', prenom: u.user?.prenom ?? '' });
        userStationMap.set(u.userId, u.stationId);
      }
    }

    const stationIds = [...new Set(userStationMap.values())];
    const stations = stationIds.length > 0
      ? await this.stationModel.findAll({ where: { id: stationIds }, attributes: ['id', 'nom'], raw: true })
      : [];
    const stationMap = new Map(stations.map((s) => [s.id, s.nom]));

    return rows.map((r) => {
      const info = userMap.get(r.userId);
      const stId = userStationMap.get(r.userId);
      return {
        id: r.userId,
        nom: info?.nom ?? '',
        prenom: info?.prenom ?? '',
        lavages: parseInt(r.totalLavages, 10) || 0,
        score: parseFloat(r.totalScore) || 0,
        stationName: stId ? (stationMap.get(stId) ?? '') : '',
      };
    });
  }

  // ─── Global wash type distribution ─────────────────────────────

  async getGlobalWashTypeDistribution(range: { startStr: string; endStr: string }) {
    const { startStr, endStr } = range;

    const fiches = await this.fichePisteModel.findAll({
      where: { date: { [Op.gte]: startStr, [Op.lte]: endStr } },
      attributes: [
        'typeLavageId',
        [fn('COUNT', col('FichePiste.id')), 'count'],
      ],
      include: [{ model: TypeLavage, attributes: ['id', 'nom'] }],
      group: ['typeLavageId', 'typeLavage.id', 'typeLavage.nom'],
      raw: false,
    });

    const totalCount = fiches.reduce(
      (sum, f) =>
        sum + (parseInt(f.getDataValue('count' as any) as string, 10) || 0),
      0,
    );

    return fiches.map((fiche) => {
      const count =
        parseInt(fiche.getDataValue('count' as any) as string, 10) || 0;
      return {
        type: fiche.typeLavage?.nom ?? 'Autre',
        count,
        percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
      };
    });
  }
}
