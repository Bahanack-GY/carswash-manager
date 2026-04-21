import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, literal } from 'sequelize';
import { Client } from './models/client.model.js';
import { Vehicle } from './models/vehicle.model.js';
import { Subscription } from './models/subscription.model.js';
import { CreateClientDto } from './dto/create-client.dto.js';
import { UpdateClientDto } from './dto/update-client.dto.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { CreateSubscriptionDto } from './dto/create-subscription.dto.js';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client)
    private readonly clientModel: typeof Client,
    @InjectModel(Vehicle)
    private readonly vehicleModel: typeof Vehicle,
    @InjectModel(Subscription)
    private readonly subscriptionModel: typeof Subscription,
  ) {}

  async findAll(query: {
    search?: string;
    stationId?: number;
    page?: number;
    limit?: number;
    vehicleType?: string;
    contact?: string;
    quartier?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const where: Record<string, any> = {};

    if (query.stationId) {
      where.stationId = query.stationId;
    }

    if (query.search) {
      const s = query.search.replace(/'/g, "''");
      const sNoSpaces = s.replace(/ /g, '');
      where[Op.or as any] = [
        { nom: { [Op.iLike]: `%${s}%` } },
        { contact: { [Op.iLike]: `%${s}%` } },
        literal(
          `EXISTS (SELECT 1 FROM vehicles WHERE vehicles."clientId" = "Client"."id" AND (` +
          `vehicles.brand ILIKE '%${s}%' OR vehicles.modele ILIKE '%${s}%' OR ` +
          `vehicles.type ILIKE '%${s}%' OR REPLACE(vehicles.immatriculation, ' ', '') ILIKE '%${sNoSpaces}%'))`,
        ),
      ];
    }

    if (query.contact) {
      where.contact = { [Op.iLike]: `%${query.contact}%` };
    }

    if (query.quartier) {
      where.quartier = { [Op.iLike]: `%${query.quartier}%` };
    }

    if (query.dateFrom || query.dateTo) {
      const dateFilter: Record<symbol, any> = {};
      if (query.dateFrom) dateFilter[Op.gte] = new Date(query.dateFrom);
      if (query.dateTo) {
        const end = new Date(query.dateTo);
        end.setHours(23, 59, 59, 999);
        dateFilter[Op.lte] = end;
      }
      where.createdAt = dateFilter;
    }

    const vehicleInclude = query.vehicleType
      ? [{ model: Vehicle, where: { type: { [Op.iLike]: `%${query.vehicleType}%` } }, required: true, attributes: [] as string[] }]
      : [];

    const { rows: data, count: total } =
      await this.clientModel.findAndCountAll({
        where,
        include: vehicleInclude,
        distinct: true,
        attributes: {
          include: [
            [
              literal(
                `(SELECT COUNT(*) FROM vehicles WHERE vehicles."clientId" = "Client"."id")`,
              ),
              'vehicleCount',
            ],
            [
              literal(
                `(SELECT COUNT(*) FROM subscriptions WHERE subscriptions."clientId" = "Client"."id" AND subscriptions."actif" = true)`,
              ),
              'activeSubscriptionCount',
            ],
            [
              literal(
                `(SELECT STRING_AGG(DISTINCT COALESCE(type, ''), ', ') FROM vehicles WHERE vehicles."clientId" = "Client"."id" AND type IS NOT NULL AND type != '')`,
              ),
              'vehicleTypes',
            ],
          ],
        },
        order: [['nom', 'ASC']],
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
    const client = await this.clientModel.findByPk(id, {
      include: [Vehicle, Subscription],
    });

    if (!client) {
      throw new NotFoundException(`Client #${id} introuvable`);
    }

    return client;
  }

  async create(createClientDto: CreateClientDto) {
    await this.checkClientUniqueness(createClientDto.contact);
    return this.clientModel.create(createClientDto as any);
  }

  async update(id: number, updateClientDto: UpdateClientDto) {
    const client = await this.findOne(id);
    await this.checkClientUniqueness(updateClientDto.contact, id);
    return client.update(updateClientDto);
  }

  private async checkClientUniqueness(contact?: string, excludeId?: number) {
    if (contact) {
      const byContact = await this.clientModel.findOne({
        where: {
          contact,
          ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
        },
      });
      if (byContact) {
        throw new ConflictException(`Un client avec le numéro ${contact} existe déjà`);
      }
    }
  }

  async findVehicleByPlate(immatriculation: string) {
    const plate = immatriculation.trim();
    const vehicle = await this.vehicleModel.findOne({
      where: { immatriculation: { [Op.iLike]: plate } },
      include: [{ model: Client }],
    });
    return vehicle;
  }

  async getVehicles(clientId: number) {
    await this.findOne(clientId);
    return this.vehicleModel.findAll({
      where: { clientId },
      order: [['createdAt', 'DESC']],
    });
  }

  async createVehicle(clientId: number, createVehicleDto: CreateVehicleDto) {
    await this.findOne(clientId);

    const plate = createVehicleDto.immatriculation?.trim().toUpperCase();

    if (plate) {
      const existing = await this.vehicleModel.findOne({
        where: { immatriculation: { [Op.iLike]: plate } },
      });
      if (existing) {
        throw new ConflictException(`Un véhicule avec l'immatriculation ${plate} existe déjà`);
      }
    }

    return this.vehicleModel.create({
      ...createVehicleDto,
      immatriculation: plate,
      clientId,
    } as any);
  }

  async createSubscription(
    clientId: number,
    createSubscriptionDto: CreateSubscriptionDto,
  ) {
    await this.findOne(clientId);
    return this.subscriptionModel.create({
      ...createSubscriptionDto,
      clientId,
    } as any);
  }
}
