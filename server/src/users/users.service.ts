import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, literal } from 'sequelize';
import { User } from './models/user.model.js';
import { Affectation } from './models/affectation.model.js';
import { Performance } from './models/performance.model.js';
import { Station } from '../stations/models/station.model.js';
import { CommercialRegistration } from '../commercial/models/commercial-registration.model.js';
import {
  AffectationStatus,
  SanctionType,
  SanctionStatus,
} from '../common/constants/status.enum.js';
import { Role } from '../common/constants/roles.enum.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { AssignStationDto } from './dto/assign-station.dto.js';
import { TransferStationDto } from './dto/transfer-station.dto.js';
import { Sanction } from './models/sanction.model.js';
import { Promotion } from './models/promotion.model.js';
import { CreateSanctionDto } from './dto/create-sanction.dto.js';
import { LiftSanctionDto } from './dto/lift-sanction.dto.js';
import { CreatePromotionDto } from './dto/create-promotion.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(Affectation)
    private readonly affectationModel: typeof Affectation,
    @InjectModel(Performance)
    private readonly performanceModel: typeof Performance,
    @InjectModel(Sanction)
    private readonly sanctionModel: typeof Sanction,
    @InjectModel(Promotion)
    private readonly promotionModel: typeof Promotion,
    @InjectModel(CommercialRegistration)
    private readonly commercialRegistrationModel: typeof CommercialRegistration,
  ) {}

  async findAll(query: {
    role?: Role;
    stationId?: number;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { role, stationId, search, page = 1, limit = 20 } = query;
    const where: Record<string, any> = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where[Op.or as any] = [
        { nom: { [Op.iLike]: `%${search}%` } },
        { prenom: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const include: any[] = [
      {
        model: Affectation,
        where: {
          statut: AffectationStatus.Active,
          ...(stationId ? { stationId } : {}),
        },
        required: !!stationId,
        include: [
          {
            model: Station,
            attributes: ['id', 'nom'],
          },
        ],
      },
    ];

    const offset = (page - 1) * limit;

    const { rows, count } = await this.userModel.findAndCountAll({
      where,
      include,
      attributes: { exclude: ['password'] },
      limit,
      offset,
      distinct: true,
      order: [['nom', 'ASC']],
    });

    return {
      data: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  async findOne(id: number) {
    const user = await this.userModel.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Affectation,
          include: [
            {
              model: Station,
              attributes: ['id', 'nom'],
            },
          ],
        },
        {
          model: Sanction,
          as: 'sanctions',
          include: [
            {
              model: User,
              as: 'createur',
              attributes: ['id', 'nom', 'prenom'],
            },
          ],
        },
        {
          model: Promotion,
          as: 'promotions',
          include: [
            {
              model: User,
              as: 'promoteur',
              attributes: ['id', 'nom', 'prenom'],
            },
          ],
        },
      ],
      order: [
        [{ model: Sanction, as: 'sanctions' }, 'dateDebut', 'DESC'],
        [{ model: Promotion, as: 'promotions' }, 'date', 'DESC'],
      ],
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur #${id} introuvable`);
    }

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    await this.checkEmailUniqueness(createUserDto.email);
    const user = await this.userModel.create(createUserDto as any);

    // Return user without password
    const { password, ...result } = user.toJSON();
    return result;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userModel.findByPk(id);

    if (!user) {
      throw new NotFoundException(`Utilisateur #${id} introuvable`);
    }

    if (updateUserDto.email) {
      await this.checkEmailUniqueness(updateUserDto.email, id);
    }

    await user.update(updateUserDto);

    const { password, ...result } = user.toJSON();
    return result;
  }

  private async checkEmailUniqueness(email: string, excludeId?: number) {
    const existing = await this.userModel.findOne({
      where: {
        email,
        ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
      },
    });
    if (existing) {
      throw new ConflictException(`Un employé avec l'email ${email} existe déjà`);
    }
  }

  async getPerformance(userId: number, stationId?: number, startDate?: string, endDate?: string) {
    const user = await this.userModel.findByPk(userId);

    if (!user) {
      throw new NotFoundException(`Utilisateur #${userId} introuvable`);
    }

    const where: Record<string, any> = { userId };

    if (stationId) {
      where.stationId = stationId;
    }

    if (startDate && endDate) {
      where.date = { [Op.gte]: startDate, [Op.lte]: endDate };
    } else if (startDate) {
      where.date = { [Op.gte]: startDate };
    } else if (endDate) {
      where.date = { [Op.lte]: endDate };
    }

    return this.performanceModel.findAll({
      where,
      include: [
        {
          model: Station,
          attributes: ['id', 'nom'],
        },
      ],
      order: [['date', 'DESC']],
    });
  }

  async assignStation(userId: number, assignStationDto: AssignStationDto) {
    const user = await this.userModel.findByPk(userId);

    if (!user) {
      throw new NotFoundException(`Utilisateur #${userId} introuvable`);
    }

    return this.affectationModel.create({
      userId,
      stationId: assignStationDto.stationId,
      dateDebut: assignStationDto.dateDebut,
      statut: AffectationStatus.Active,
    } as any);
  }

  async transferStation(userId: number, dto: TransferStationDto) {
    const user = await this.userModel.findByPk(userId);

    if (!user) {
      throw new NotFoundException(`Utilisateur #${userId} introuvable`);
    }

    // Deactivate all current active affectations
    const today = new Date().toISOString().split('T')[0];
    await this.affectationModel.update(
      { statut: AffectationStatus.Inactive, dateFin: today },
      { where: { userId, statut: AffectationStatus.Active } },
    );

    // Create new affectation at the new station
    const affectation = await this.affectationModel.create({
      userId,
      stationId: dto.newStationId,
      dateDebut: today,
      statut: AffectationStatus.Active,
    } as any);

    return affectation;
  }

  async unassignStation(userId: number) {
    const user = await this.userModel.findByPk(userId);

    if (!user) {
      throw new NotFoundException(`Utilisateur #${userId} introuvable`);
    }

    const today = new Date().toISOString().split('T')[0];
    const [count] = await this.affectationModel.update(
      { statut: AffectationStatus.Inactive, dateFin: today },
      { where: { userId, statut: AffectationStatus.Active } },
    );

    return { unassigned: count };
  }

  async addSanction(
    userId: number,
    dto: CreateSanctionDto,
    currentUserId: number,
  ) {
    const user = await this.userModel.findByPk(userId);

    if (!user) {
      throw new NotFoundException(`Utilisateur #${userId} introuvable`);
    }

    if (user.role === Role.SuperAdmin) {
      throw new ForbiddenException(
        'Impossible de sanctionner un Super Admin',
      );
    }

    const today = new Date().toISOString().split('T')[0];

    const sanction = await this.sanctionModel.create({
      userId,
      type: dto.type,
      motif: dto.motif,
      dateDebut: today,
      statut: SanctionStatus.Active,
      createdBy: currentUserId,
    } as any);

    // Side effects based on sanction type
    if (dto.type === SanctionType.Suspension) {
      await user.update({ actif: false });
    } else if (dto.type === SanctionType.Renvoi) {
      await user.update({ actif: false });
      await this.affectationModel.update(
        { statut: AffectationStatus.Inactive, dateFin: today },
        { where: { userId, statut: AffectationStatus.Active } },
      );
    }

    return sanction;
  }

  async getUserSanctions(userId: number) {
    const user = await this.userModel.findByPk(userId);

    if (!user) {
      throw new NotFoundException(`Utilisateur #${userId} introuvable`);
    }

    return this.sanctionModel.findAll({
      where: { userId },
      include: [
        {
          model: User,
          as: 'createur',
          attributes: ['id', 'nom', 'prenom'],
        },
      ],
      order: [['dateDebut', 'DESC']],
    });
  }

  async liftSanction(sanctionId: number, dto: LiftSanctionDto) {
    const sanction = await this.sanctionModel.findByPk(sanctionId);

    if (!sanction) {
      throw new NotFoundException(`Sanction #${sanctionId} introuvable`);
    }

    if (sanction.statut === SanctionStatus.Levee) {
      throw new ForbiddenException('Cette sanction a déjà été levée');
    }

    const today = new Date().toISOString().split('T')[0];

    await sanction.update({
      statut: SanctionStatus.Levee,
      dateFin: today,
      noteLevee: dto.noteLevee || null,
    });

    // Reactivate user if no other active blocking sanctions remain
    if (
      sanction.type === SanctionType.Suspension ||
      sanction.type === SanctionType.Renvoi
    ) {
      const otherActive = await this.sanctionModel.count({
        where: {
          userId: sanction.userId,
          statut: SanctionStatus.Active,
          type: [SanctionType.Suspension, SanctionType.Renvoi],
        },
      });

      if (otherActive === 0) {
        await this.userModel.update(
          { actif: true },
          { where: { id: sanction.userId } },
        );
      }
    }

    return sanction;
  }

  async promoteUser(
    userId: number,
    dto: CreatePromotionDto,
    currentUserId: number,
  ) {
    const user = await this.userModel.findByPk(userId);

    if (!user) {
      throw new NotFoundException(`Utilisateur #${userId} introuvable`);
    }

    if (user.role === dto.nouveauRole) {
      throw new ForbiddenException(
        `L'utilisateur a déjà le rôle ${dto.nouveauRole}`,
      );
    }

    const ancienRole = user.role;
    const today = new Date().toISOString().split('T')[0];

    await user.update({ role: dto.nouveauRole });

    const promotion = await this.promotionModel.create({
      userId,
      ancienRole,
      nouveauRole: dto.nouveauRole,
      motif: dto.motif,
      date: today,
      createdBy: currentUserId,
    } as any);

    return promotion;
  }

  async findAvailableWashers(stationId: number) {
    return this.userModel.findAll({
      where: { role: Role.Laveur, actif: true },
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Affectation,
          where: {
            stationId,
            statut: AffectationStatus.Active,
          },
          required: true,
          include: [
            {
              model: Station,
              attributes: ['id', 'nom'],
            },
          ],
        },
      ],
      order: [['nom', 'ASC']],
    });
  }

  async getLeaderboard(type: 'laveurs' | 'commerciaux', stationId?: number) {
    if (type === 'laveurs') {
      const users = await this.userModel.findAll({
        where: { role: Role.Laveur, actif: true },
        attributes: [
          'id', 'nom', 'prenom',
          [
            literal(`(SELECT COALESCE(SUM(p."vehiculesLaves"), 0) FROM performances p WHERE p."userId" = "User"."id")`),
            'totalPoints',
          ],
        ],
        include: stationId
          ? [{
              model: Affectation,
              where: { stationId, statut: AffectationStatus.Active },
              attributes: [],
              required: true,
            }]
          : [],
        order: [[literal(`(SELECT COALESCE(SUM(p."vehiculesLaves"), 0) FROM performances p WHERE p."userId" = "User"."id")`), 'DESC']],
      });
      return users.map((u, i) => ({ ...u.toJSON(), rank: i + 1 }));
    } else {
      const users = await this.userModel.findAll({
        where: { role: Role.Commercial, actif: true },
        attributes: [
          'id', 'nom', 'prenom',
          [
            literal(`(SELECT COUNT(*) FROM commercial_registrations cr WHERE cr."commercialId" = "User"."id" AND cr.confirmed = true)`),
            'totalPoints',
          ],
        ],
        include: stationId
          ? [{
              model: Affectation,
              where: { stationId, statut: AffectationStatus.Active },
              attributes: [],
              required: true,
            }]
          : [],
        order: [[literal(`(SELECT COUNT(*) FROM commercial_registrations cr WHERE cr."commercialId" = "User"."id" AND cr.confirmed = true)`), 'DESC']],
      });
      return users.map((u, i) => ({ ...u.toJSON(), rank: i + 1 }));
    }
  }
}
