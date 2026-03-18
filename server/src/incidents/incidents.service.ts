import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Incident } from './models/incident.model.js';
import { Station } from '../stations/models/station.model.js';
import { User } from '../users/models/user.model.js';
import { CreateIncidentDto } from './dto/create-incident.dto.js';
import { UpdateIncidentDto } from './dto/update-incident.dto.js';
import { IncidentStatus, IncidentSeverity } from '../common/constants/status.enum.js';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectModel(Incident)
    private readonly incidentModel: typeof Incident,
  ) {}

  async findAll(query: {
    stationId?: number;
    statut?: IncidentStatus;
    severity?: IncidentSeverity;
    stopsActivity?: boolean;
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

    if (query.statut) {
      where.statut = query.statut;
    }

    if (query.severity) {
      where.severity = query.severity;
    }

    if (query.stopsActivity !== undefined) {
      where.stopsActivity = query.stopsActivity;
    }

    const { rows: data, count: total } =
      await this.incidentModel.findAndCountAll({
        where,
        include: [
          { model: Station, attributes: ['id', 'nom'] },
          { model: User, as: 'declarant', attributes: ['id', 'nom', 'prenom'] },
        ],
        order: [['dateDeclaration', 'DESC']],
        limit,
        offset,
      });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const incident = await this.incidentModel.findByPk(id, {
      include: [
        { model: Station, attributes: ['id', 'nom'] },
        { model: User, as: 'declarant', attributes: ['id', 'nom', 'prenom'] },
      ],
    });

    if (!incident) {
      throw new NotFoundException(`Incident #${id} introuvable`);
    }

    return incident;
  }

  async create(createIncidentDto: CreateIncidentDto, declarantId?: number) {
    return this.incidentModel.create({
      ...createIncidentDto,
      declarantId,
    } as any);
  }

  async update(id: number, updateIncidentDto: UpdateIncidentDto) {
    const incident = await this.findOne(id);

    // Auto-set resolvedAt when status changes to resolved
    if (
      updateIncidentDto.statut === IncidentStatus.Resolved &&
      !updateIncidentDto.resolvedAt
    ) {
      updateIncidentDto.resolvedAt = new Date().toISOString();
    }

    return incident.update(updateIncidentDto);
  }

  async getActiveByStation(): Promise<
    Record<number, { hasStoppingIncident: boolean; hasNonStoppingIncident: boolean }>
  > {
    const activeIncidents = await this.incidentModel.findAll({
      where: {
        statut: { [Op.ne]: IncidentStatus.Resolved },
      },
      attributes: ['stationId', 'stopsActivity'],
    });

    const result: Record<number, { hasStoppingIncident: boolean; hasNonStoppingIncident: boolean }> = {};

    for (const incident of activeIncidents) {
      if (!result[incident.stationId]) {
        result[incident.stationId] = {
          hasStoppingIncident: false,
          hasNonStoppingIncident: false,
        };
      }

      if (incident.stopsActivity) {
        result[incident.stationId].hasStoppingIncident = true;
      } else {
        result[incident.stationId].hasNonStoppingIncident = true;
      }
    }

    return result;
  }
}
