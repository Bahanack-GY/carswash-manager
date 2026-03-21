import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, fn, col } from 'sequelize';
import { AuditLog } from './models/audit-log.model.js';
import { Station } from '../stations/models/station.model.js';

export interface CreateAuditLogDto {
  userId: number | null;
  userName: string | null;
  userRole: string | null;
  userPhone: string | null;
  action: string;
  actionLabel: string;
  entity: string;
  entityId: string | null;
  stationId: number | null;
  route: string;
  statusCode: number | null;
  requestBody: Record<string, any> | null;
  metadata: Record<string, any> | null;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog)
    private readonly auditLogModel: typeof AuditLog,
    @InjectModel(Station)
    private readonly stationModel: typeof Station,
  ) {}

  async create(dto: CreateAuditLogDto): Promise<AuditLog> {
    let stationName: string | null = null;
    if (dto.stationId) {
      const station = await this.stationModel.findByPk(dto.stationId, {
        attributes: ['nom'],
      });
      stationName = station?.nom ?? null;
    }
    return this.auditLogModel.create({ ...dto, stationName } as any);
  }

  async findAll(query: {
    userId?: number;
    entity?: string;
    entityId?: string;
    action?: string;
    stationId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      userId,
      entity,
      entityId,
      action,
      stationId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 30,
    } = query;

    const where: Record<string, any> = {};

    if (userId) where.userId = userId;
    if (entity) where.entity = entity;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;
    if (stationId) where.stationId = stationId;

    if (startDate && endDate) {
      where.timestamp = {
        [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59')],
      };
    } else if (startDate) {
      where.timestamp = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      where.timestamp = { [Op.lte]: new Date(endDate + 'T23:59:59') };
    }

    if (search) {
      where[Op.or as any] = [
        { userName: { [Op.iLike]: `%${search}%` } },
        { actionLabel: { [Op.iLike]: `%${search}%` } },
        { entity: { [Op.iLike]: `%${search}%` } },
        { route: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const { rows: data, count: total } =
      await this.auditLogModel.findAndCountAll({
        where,
        limit,
        offset,
        order: [['timestamp', 'DESC']],
      });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<AuditLog | null> {
    return this.auditLogModel.findByPk(id);
  }

  async getFilterOptions(): Promise<{
    entities: string[];
    actions: string[];
  }> {
    const [entityRows, actionRows] = await Promise.all([
      this.auditLogModel.findAll({
        attributes: [[fn('DISTINCT', col('entity')), 'entity']],
        order: [['entity', 'ASC']],
        raw: true,
      }),
      this.auditLogModel.findAll({
        attributes: [[fn('DISTINCT', col('action')), 'action']],
        order: [['action', 'ASC']],
        raw: true,
      }),
    ]);

    return {
      entities: entityRows.map((r: any) => r.entity),
      actions: actionRows.map((r: any) => r.action),
    };
  }
}
