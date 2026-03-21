import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, fn, col, literal } from 'sequelize';
import { Facture } from './models/facture.model.js';
import { Paiement } from './models/paiement.model.js';
import { LigneVente } from './models/ligne-vente.model.js';
import { Client } from '../clients/models/client.model.js';
import { Coupon } from '../wash-operations/models/coupon.model.js';
import { Station } from '../stations/models/station.model.js';
import { User } from '../users/models/user.model.js';
import { CreateFactureDto } from './dto/create-facture.dto.js';
import { CreatePaiementDto } from './dto/create-paiement.dto.js';
import { TransactionType } from '../common/constants/status.enum.js';

@Injectable()
export class BillingService {
  constructor(
    @InjectModel(Facture)
    private readonly factureModel: typeof Facture,
    @InjectModel(Paiement)
    private readonly paiementModel: typeof Paiement,
    @InjectModel(LigneVente)
    private readonly ligneVenteModel: typeof LigneVente,
  ) {}

  // ─── Factures ───────────────────────────────────────────────────────

  async findAllFactures(query: {
    stationId?: number;
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

    const { rows: data, count: total } =
      await this.factureModel.findAndCountAll({
        where,
        include: [
          { model: Client, attributes: ['id', 'nom', 'contact'] },
          { model: Coupon, attributes: ['id', 'numero', 'statut'] },
          { model: Station, attributes: ['id', 'nom'] },
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

  async findOneFacture(id: number) {
    const facture = await this.factureModel.findByPk(id, {
      include: [
        { model: Client },
        { model: Coupon },
        { model: Station },
        { model: LigneVente },
        { model: Paiement },
      ],
    });

    if (!facture) {
      throw new NotFoundException(`Facture #${id} introuvable`);
    }

    return facture;
  }

  async createFacture(dto: CreateFactureDto) {
    const numero = await this.generateFactureNumero();

    const { lignes, ...factureData } = dto;

    const facture = await this.factureModel.create({
      ...factureData,
      numero,
    } as any);

    if (lignes && lignes.length > 0) {
      const ligneRecords = lignes.map((ligne) => ({
        factureId: facture.id,
        produitId: ligne.produitId,
        quantite: ligne.quantite,
        prixUnitaire: ligne.prixUnitaire,
        sousTotal: ligne.quantite * ligne.prixUnitaire,
      }));
      await this.ligneVenteModel.bulkCreate(ligneRecords as any);
    }

    return this.findOneFacture(facture.id);
  }

  private async generateFactureNumero(): Promise<string> {
    const lastFacture = await this.factureModel.findOne({
      order: [['numero', 'DESC']],
      attributes: ['numero'],
    });

    let nextNumber = 1;

    if (lastFacture?.numero) {
      const match = lastFacture.numero.match(/FAC-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `FAC-${String(nextNumber).padStart(4, '0')}`;
  }

  // ─── Paiements ──────────────────────────────────────────────────────

  async createPaiement(dto: CreatePaiementDto, userId?: number) {
    return this.paiementModel.create({ ...dto, userId } as any);
  }

  // ─── Caisse ─────────────────────────────────────────────────────────

  async getCaisseSummary(
    stationId: number,
    date?: string,
    startDate?: string,
    endDate?: string,
  ) {
    let createdAtFilter: Record<string, any>;

    const resolvedDate = date ?? new Date().toISOString().split('T')[0];

    if (startDate && endDate) {
      const start = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T23:59:59.999`);
      createdAtFilter = { [Op.gte]: start, [Op.lte]: end };
    } else {
      createdAtFilter = {
        [Op.gte]: new Date(`${resolvedDate}T00:00:00`),
        [Op.lt]: new Date(`${resolvedDate}T23:59:59.999`),
      };
    }

    const where: Record<string, any> = {
      stationId,
      createdAt: createdAtFilter,
    };

    const incomeWhere = { ...where, type: TransactionType.Income };
    const expenseWhere = { ...where, type: TransactionType.Expense };

    const methods = ['cash', 'card', 'wave', 'orange_money', 'transfer', 'bond'] as const;

    const [incomeResult, expenseResult, nombreTransactions, ...methodResults] =
      await Promise.all([
        this.paiementModel.sum('montant', { where: incomeWhere }),
        this.paiementModel.sum('montant', { where: expenseWhere }),
        this.paiementModel.count({ where }),
        ...methods.map((methode) =>
          this.paiementModel.sum('montant', {
            where: { ...incomeWhere, methode },
          }),
        ),
      ]);

    const totalRecettes = incomeResult ?? 0;
    const totalDepenses = expenseResult ?? 0;
    const solde = totalRecettes - totalDepenses;

    const parMethode: Record<string, number> = {};
    methods.forEach((methode, i) => {
      parMethode[methode] = methodResults[i] ?? 0;
    });

    return {
      totalRecettes,
      totalDepenses,
      solde,
      nombreTransactions,
      parMethode,
      stationId,
      date: startDate && endDate ? `${startDate}/${endDate}` : resolvedDate,
    };
  }

  async getCaisseTransactions(query: {
    stationId: number;
    userId?: number;
    date?: string;
    startDate?: string;
    endDate?: string;
    type?: TransactionType;
    page?: number;
    limit?: number;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const where: Record<string, any> = {
      stationId: query.stationId,
    };

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.startDate && query.endDate) {
      // Date range: startDate..endDate (inclusive)
      const startParts = query.startDate.split('-').map(Number);
      const endParts = query.endDate.split('-').map(Number);
      const start = new Date(startParts[0], startParts[1] - 1, startParts[2]);
      const end = new Date(endParts[0], endParts[1] - 1, endParts[2] + 1); // exclusive
      where.createdAt = { [Op.gte]: start, [Op.lt]: end };
    } else if (query.date) {
      where.createdAt = {
        [Op.gte]: new Date(`${query.date}T00:00:00`),
        [Op.lt]: new Date(`${query.date}T23:59:59.999`),
      };
    }

    if (query.type) {
      where.type = query.type;
    }

    const { rows: data, count: total } =
      await this.paiementModel.findAndCountAll({
        where,
        include: [
          { model: Facture, attributes: ['id', 'numero', 'date'] },
          { model: User, attributes: ['id', 'nom', 'prenom', 'role'] },
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
}
