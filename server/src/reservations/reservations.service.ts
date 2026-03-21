import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op, Transaction } from 'sequelize';
import { Reservation } from './models/reservation.model.js';
import { Client } from '../clients/models/client.model.js';
import { Vehicle } from '../clients/models/vehicle.model.js';
import { Station } from '../stations/models/station.model.js';
import { CreateReservationDto } from './dto/create-reservation.dto.js';
import { UpdateReservationDto } from './dto/update-reservation.dto.js';
import { ReservationStatus } from '../common/constants/status.enum.js';

const RESERVATION_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  [ReservationStatus.Pending]: [ReservationStatus.Confirmed, ReservationStatus.Cancelled],
  [ReservationStatus.Confirmed]: [ReservationStatus.Done, ReservationStatus.Cancelled],
  [ReservationStatus.Done]: [],
  [ReservationStatus.Cancelled]: [],
};

@Injectable()
export class ReservationsService {
  constructor(
    private readonly sequelize: Sequelize,
    @InjectModel(Reservation)
    private readonly reservationModel: typeof Reservation,
  ) {}

  async findAll(query: {
    stationId?: number;
    statut?: ReservationStatus;
    date?: string;
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

    if (query.date) {
      const startOfDay = new Date(`${query.date}T00:00:00.000Z`);
      const endOfDay = new Date(`${query.date}T23:59:59.999Z`);
      where.dateHeureApport = { [Op.between]: [startOfDay, endOfDay] };
    }

    const { rows: data, count: total } =
      await this.reservationModel.findAndCountAll({
        where,
        include: [
          { model: Client, attributes: ['nom', 'contact'] },
          { model: Vehicle, attributes: ['immatriculation', 'modele'] },
          { model: Station, attributes: ['nom'] },
        ],
        order: [['dateHeureApport', 'DESC']],
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
    const reservation = await this.reservationModel.findByPk(id, {
      include: [Client, Vehicle, Station],
    });

    if (!reservation) {
      throw new NotFoundException(`Réservation #${id} introuvable`);
    }

    return reservation;
  }

  async create(createReservationDto: CreateReservationDto) {
    return this.sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
      async (t) => {
        // Double-booking check: same vehicle, overlapping time slot (±2h window)
        if (createReservationDto.vehicleId && createReservationDto.dateHeureApport) {
          const slot = new Date(createReservationDto.dateHeureApport);
          const windowMs = 2 * 60 * 60 * 1000; // 2-hour window
          const conflict = await this.reservationModel.findOne({
            where: {
              vehicleId: createReservationDto.vehicleId,
              statut: { [Op.in]: [ReservationStatus.Pending, ReservationStatus.Confirmed] },
              dateHeureApport: {
                [Op.between]: [new Date(slot.getTime() - windowMs), new Date(slot.getTime() + windowMs)],
              },
            },
            transaction: t,
          });
          if (conflict) {
            throw new ConflictException(
              `Ce véhicule a déjà une réservation active dans les 2h autour du créneau demandé (réservation #${conflict.numero})`,
            );
          }
        }

        const numero = await this.generateNumero(t);
        return this.reservationModel.create({ ...createReservationDto, numero } as any, { transaction: t });
      },
    );
  }

  async update(id: number, updateReservationDto: UpdateReservationDto) {
    const reservation = await this.findOne(id);

    if (updateReservationDto.statut && updateReservationDto.statut !== reservation.statut) {
      const allowed = RESERVATION_TRANSITIONS[reservation.statut] ?? [];
      if (!allowed.includes(updateReservationDto.statut)) {
        throw new BadRequestException(
          `Transition invalide : ${reservation.statut} → ${updateReservationDto.statut}. Transitions autorisées : ${allowed.length ? allowed.join(', ') : 'aucune'}`,
        );
      }
    }

    return reservation.update(updateReservationDto);
  }

  private async generateNumero(t: Transaction): Promise<string> {
    const lastReservation = await this.reservationModel.findOne({
      order: [['numero', 'DESC']],
      attributes: ['numero'],
      lock: Transaction.LOCK.UPDATE,
      transaction: t,
    });

    let nextNumber = 1;

    if (lastReservation?.numero) {
      const match = lastReservation.numero.match(/RES-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `RES-${String(nextNumber).padStart(4, '0')}`;
  }
}
