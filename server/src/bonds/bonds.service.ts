import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Transaction } from 'sequelize';
import { BonLavage } from './models/bon-lavage.model.js';
import { User } from '../users/models/user.model.js';
import { Coupon } from '../wash-operations/models/coupon.model.js';
import { Station } from '../stations/models/station.model.js';
import { CreateBonLavageDto } from './dto/create-bon-lavage.dto.js';
import { UseBonLavageDto } from './dto/use-bon-lavage.dto.js';

@Injectable()
export class BondsService {
  constructor(
    private readonly sequelize: Sequelize,
    @InjectModel(BonLavage)
    private readonly bonLavageModel: typeof BonLavage,
  ) {}

  async create(dto: CreateBonLavageDto, createdById: number) {
    const bondId = await this.sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
      async (t) => {
        const code = await this.generateBonCode(t);
        const bond = await this.bonLavageModel.create({
          code,
          pourcentage: dto.pourcentage,
          createdById,
          stationId: dto.stationId ?? null,
          description: dto.description ?? null,
        } as any, { transaction: t });
        return bond.id;
      },
    );
    return this.findOne(bondId);
  }

  async findAll(query: {
    isUsed?: boolean;
    stationId?: number;
    createdById?: number;
    page?: number;
    limit?: number;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const where: Record<string, any> = {};

    if (query.isUsed !== undefined) where.isUsed = query.isUsed;
    if (query.stationId) where.stationId = query.stationId;
    if (query.createdById) where.createdById = query.createdById;

    const { rows: data, count: total } =
      await this.bonLavageModel.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'createdBy',
            attributes: ['id', 'nom', 'prenom', 'role'],
          },
          {
            model: Coupon,
            attributes: ['id', 'numero', 'montantTotal', 'statut'],
          },
          { model: Station, attributes: ['id', 'nom'] },
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        distinct: true,
      });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const bond = await this.bonLavageModel.findByPk(id, {
      include: [
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'nom', 'prenom', 'role'],
        },
        {
          model: Coupon,
          attributes: ['id', 'numero', 'montantTotal', 'statut'],
        },
        { model: Station, attributes: ['id', 'nom'] },
      ],
    });
    if (!bond) throw new NotFoundException(`Bon de lavage #${id} introuvable`);
    return bond;
  }

  async validateByCode(code: string) {
    const bond = await this.bonLavageModel.findOne({
      where: { code: code.trim().toUpperCase() },
      include: [
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'nom', 'prenom', 'role'],
        },
        { model: Station, attributes: ['id', 'nom'] },
      ],
    });
    if (!bond) throw new NotFoundException(`Bon "${code}" introuvable`);
    if (bond.isUsed) {
      throw new ConflictException(
        `Ce bon a déjà été utilisé le ${bond.usedAt?.toLocaleDateString('fr-FR')}`,
      );
    }
    return bond;
  }

  async markAsUsed(id: number, dto: UseBonLavageDto) {
    const bond = await this.bonLavageModel.findByPk(id);
    if (!bond) throw new NotFoundException(`Bon de lavage #${id} introuvable`);
    if (bond.isUsed) {
      throw new ConflictException('Ce bon a déjà été utilisé');
    }

    bond.isUsed = true;
    bond.usedAt = new Date();
    bond.couponId = dto.couponId;
    await bond.save();
    return this.findOne(bond.id);
  }

  private async generateBonCode(t: Transaction): Promise<string> {
    // Lock the last row so concurrent creates are serialized within the transaction
    const last = await this.bonLavageModel.findOne({
      order: [['id', 'DESC']],
      attributes: ['code'],
      lock: Transaction.LOCK.UPDATE,
      transaction: t,
    });

    let nextNumber = 1;
    if (last?.code) {
      const match = last.code.match(/BON-(\d+)/);
      if (match) nextNumber = parseInt(match[1], 10) + 1;
    }

    return `BON-${String(nextNumber).padStart(4, '0')}`;
  }
}
