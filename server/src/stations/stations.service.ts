import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { fn, col, literal } from 'sequelize';
import { Station } from './models/station.model.js';
import { Affectation } from '../users/models/affectation.model.js';
import { AffectationStatus } from '../common/constants/status.enum.js';
import { Role } from '../common/constants/roles.enum.js';
import { CreateStationDto } from './dto/create-station.dto.js';
import { UpdateStationDto } from './dto/update-station.dto.js';
import { DefaultServicesService } from '../wash-operations/default-services.service.js';

@Injectable()
export class StationsService {
  constructor(
    @InjectModel(Station)
    private readonly stationModel: typeof Station,
    @InjectModel(Affectation)
    private readonly affectationModel: typeof Affectation,
    private readonly defaultServicesService: DefaultServicesService,
  ) {}

  async findAll(userStationIds?: number[]) {
    const where: Record<string, any> = {};

    if (userStationIds && userStationIds.length > 0) {
      where.id = userStationIds;
    }

    const stations = await this.stationModel.findAll({
      where,
      attributes: {
        include: [
          [
            literal(
              `(SELECT COUNT(*) FROM affectations WHERE affectations."stationId" = "Station"."id" AND affectations."statut" = '${AffectationStatus.Active}')`,
            ),
            'employeeCount',
          ],
          [
            literal(
              `(SELECT u."prenom" || ' ' || u."nom" FROM affectations a JOIN users u ON u."id" = a."userId" WHERE a."stationId" = "Station"."id" AND a."statut" = '${AffectationStatus.Active}' AND u."role" = '${Role.Manager}' LIMIT 1)`,
            ),
            'managerName',
          ],
        ],
      },
      order: [['nom', 'ASC']],
    });

    return stations;
  }

  async findOne(id: number) {
    const station = await this.stationModel.findByPk(id);

    if (!station) {
      throw new NotFoundException(`Station #${id} introuvable`);
    }

    return station;
  }

  async create(createStationDto: CreateStationDto) {
    const station = await this.stationModel.create(createStationDto as any);
    await this.defaultServicesService.seedGlobalDefaults();
    return station;
  }

  async update(id: number, updateStationDto: UpdateStationDto) {
    const station = await this.findOne(id);
    return station.update(updateStationDto);
  }
}
