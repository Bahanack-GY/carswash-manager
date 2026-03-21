import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { ReservationsService } from './reservations.service';
import { Reservation } from './models/reservation.model';

describe('ReservationsService', () => {
    let service: ReservationsService;
    let reservationModel: any;

    const mockReservation = {
        id: 1,
        numero: 'RES-0001',
        stationId: 1,
        clientId: 1,
        vehicleId: 1,
        dateHeureApport: new Date('2026-03-01T10:00:00Z'),
        statut: 'pending',
        update: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReservationsService,
                {
                    provide: Sequelize,
                    useValue: {
                        transaction: jest.fn().mockImplementation((_opts: any, cb: any) => cb({ LOCK: { UPDATE: 'UPDATE' } })),
                    },
                },
                {
                    provide: getModelToken(Reservation),
                    useValue: {
                        findAndCountAll: jest.fn(),
                        findByPk: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<ReservationsService>(ReservationsService);
        reservationModel = module.get(getModelToken(Reservation));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ─── findAll ──────────────────────────────────────────────────────
    describe('findAll', () => {
        it('should return paginated reservations', async () => {
            reservationModel.findAndCountAll.mockResolvedValue({
                rows: [mockReservation],
                count: 1,
            });

            const result = await service.findAll({ page: 1, limit: 20 });

            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(1);
        });

        it('should filter by stationId', async () => {
            reservationModel.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

            await service.findAll({ stationId: 1 });

            expect(reservationModel.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ stationId: 1 }),
                }),
            );
        });

        it('should filter by statut', async () => {
            reservationModel.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

            await service.findAll({ statut: 'pending' as any });

            expect(reservationModel.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ statut: 'pending' }),
                }),
            );
        });

        it('should filter by date', async () => {
            reservationModel.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

            await service.findAll({ date: '2026-03-01' });

            expect(reservationModel.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        dateHeureApport: expect.any(Object),
                    }),
                }),
            );
        });
    });

    // ─── findOne ──────────────────────────────────────────────────────
    describe('findOne', () => {
        it('should return a reservation', async () => {
            reservationModel.findByPk.mockResolvedValue(mockReservation);

            const result = await service.findOne(1);

            expect(result).toEqual(mockReservation);
        });

        it('should throw NotFoundException if reservation not found', async () => {
            reservationModel.findByPk.mockResolvedValue(null);

            await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
        });
    });

    // ─── create ───────────────────────────────────────────────────────
    describe('create', () => {
        it('should create a reservation with auto-generated numero', async () => {
            // First findOne: double-booking check → no conflict
            // Second findOne: generateNumero → no previous reservation
            reservationModel.findOne.mockResolvedValue(null);
            reservationModel.create.mockResolvedValue({
                ...mockReservation,
                numero: 'RES-0001',
            });

            const result = await service.create({
                stationId: 1,
                clientId: 1,
                vehicleId: 1,
                dateHeureApport: '2026-03-01T10:00:00Z',
            } as any);

            expect(result.numero).toBe('RES-0001');
        });

        it('should increment numero from last reservation', async () => {
            // Double-booking check → no conflict, then generateNumero → last is RES-0042
            reservationModel.findOne
                .mockResolvedValueOnce(null)              // double-booking: no conflict
                .mockResolvedValueOnce({ numero: 'RES-0042' }); // generateNumero
            reservationModel.create.mockImplementation((data: any) => ({
                id: 2,
                ...data,
            }));

            const result = await service.create({
                stationId: 1,
                clientId: 1,
                vehicleId: 1,
                dateHeureApport: '2026-03-02T10:00:00Z',
            } as any);

            expect(result.numero).toBe('RES-0043');
        });
    });

    // ─── update ───────────────────────────────────────────────────────
    describe('update', () => {
        it('should update reservation fields', async () => {
            reservationModel.findByPk.mockResolvedValue(mockReservation);
            mockReservation.update.mockResolvedValue({
                ...mockReservation,
                statut: 'confirmed',
            });

            const result = await service.update(1, { statut: 'confirmed' } as any);

            expect(mockReservation.update).toHaveBeenCalledWith({ statut: 'confirmed' });
        });

        it('should throw NotFoundException if reservation to update not found', async () => {
            reservationModel.findByPk.mockResolvedValue(null);

            await expect(
                service.update(999, { statut: 'confirmed' } as any),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException for invalid status transition', async () => {
            reservationModel.findByPk.mockResolvedValue({ ...mockReservation, statut: 'done', update: jest.fn() });

            await expect(
                service.update(1, { statut: 'pending' } as any),
            ).rejects.toThrow(BadRequestException);
        });
    });
});
