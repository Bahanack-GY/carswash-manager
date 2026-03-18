import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { CommercialService } from './commercial.service';
import { CommercialRegistration } from './models/commercial-registration.model';
import { Vehicle } from '../clients/models/vehicle.model';
import { Client } from '../clients/models/client.model';
import { Station } from '../stations/models/station.model';
import { User } from '../users/models/user.model';
import { Coupon } from '../wash-operations/models/coupon.model';
import { FichePiste } from '../wash-operations/models/fiche-piste.model';
import { ServiceSpecial } from '../wash-operations/models/service-special.model';
import { Performance } from '../users/models/performance.model';

describe('CommercialService', () => {
    let service: CommercialService;
    let registrationModel: any;
    let vehicleModel: any;
    let stationModel: any;
    let userModel: any;

    const mockRegistration = {
        id: 1,
        commercialId: 1,
        immatriculation: 'LT-1234-AB',
        prospectNom: 'John Doe',
        prospectTelephone: '+237600000000',
        stationId: 1,
        date: '2026-03-01',
        confirmed: false,
        vehicleId: null,
        couponId: null,
        save: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CommercialService,
                {
                    provide: getModelToken(CommercialRegistration),
                    useValue: {
                        findAll: jest.fn(),
                        findOne: jest.fn(),
                        findByPk: jest.fn(),
                        create: jest.fn(),
                        count: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Vehicle),
                    useValue: {
                        findAll: jest.fn(),
                        findByPk: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        bulkCreate: jest.fn(),
                        count: jest.fn(),
                        sum: jest.fn(),
                        destroy: jest.fn(),
                        update: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Client),
                    useValue: {
                        findAll: jest.fn(),
                        findByPk: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        bulkCreate: jest.fn(),
                        count: jest.fn(),
                        sum: jest.fn(),
                        destroy: jest.fn(),
                        update: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Station),
                    useValue: {
                        findAll: jest.fn(),
                        findByPk: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        bulkCreate: jest.fn(),
                        count: jest.fn(),
                        sum: jest.fn(),
                        destroy: jest.fn(),
                        update: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(User),
                    useValue: {
                        findAll: jest.fn(),
                        findByPk: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        bulkCreate: jest.fn(),
                        count: jest.fn(),
                        sum: jest.fn(),
                        destroy: jest.fn(),
                        update: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Coupon),
                    useValue: {
                        findAll: jest.fn(),
                        findByPk: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        bulkCreate: jest.fn(),
                        count: jest.fn(),
                        sum: jest.fn(),
                        destroy: jest.fn(),
                        update: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(FichePiste),
                    useValue: {
                        findAll: jest.fn(),
                        findByPk: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        bulkCreate: jest.fn(),
                        count: jest.fn(),
                        sum: jest.fn(),
                        destroy: jest.fn(),
                        update: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(ServiceSpecial),
                    useValue: {
                        findAll: jest.fn(),
                        findByPk: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        bulkCreate: jest.fn(),
                        count: jest.fn(),
                        sum: jest.fn(),
                        destroy: jest.fn(),
                        update: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Performance),
                    useValue: {
                        findAll: jest.fn(),
                        findByPk: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        bulkCreate: jest.fn(),
                        count: jest.fn(),
                        sum: jest.fn(),
                        destroy: jest.fn(),
                        update: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<CommercialService>(CommercialService);
        registrationModel = module.get(getModelToken(CommercialRegistration));
        vehicleModel = module.get(getModelToken(Vehicle));
        stationModel = module.get(getModelToken(Station));
        userModel = module.get(getModelToken(User));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ─── registerVehicle ──────────────────────────────────────────────
    describe('registerVehicle', () => {
        it('should create a registration', async () => {
            registrationModel.findOne.mockResolvedValue(null); // no duplicate
            registrationModel.create.mockResolvedValue(mockRegistration);
            registrationModel.findByPk.mockResolvedValue(mockRegistration);

            const result = await service.registerVehicle(1, 1, {
                immatriculation: 'LT-5678-CD',
                prospectNom: 'Jane Doe',
                prospectTelephone: '+237611111111',
            });

            expect(registrationModel.create).toHaveBeenCalled();
        });

        it('should throw ConflictException for duplicate pending plate', async () => {
            registrationModel.findOne.mockResolvedValue(mockRegistration);

            await expect(
                service.registerVehicle(1, 1, {
                    immatriculation: 'LT-1234-AB',
                    prospectNom: 'Jane Doe',
                    prospectTelephone: '+237611111111',
                }),
            ).rejects.toThrow(ConflictException);
        });
    });

    // ─── getTodayRegistrations ────────────────────────────────────────
    describe('getTodayRegistrations', () => {
        it('should return today registrations for commercial', async () => {
            registrationModel.findAll.mockResolvedValue([mockRegistration]);

            const result = await service.getTodayRegistrations(1, 1);

            expect(result).toHaveLength(1);
        });
    });

    // ─── getStats ─────────────────────────────────────────────────────
    describe('getStats', () => {
        it('should return stats with dailyGoal', async () => {
            userModel.findByPk.mockResolvedValue({ objectifJournalier: 15 });
            stationModel.findByPk.mockResolvedValue({ objectifCommercialJournalier: 10 });
            registrationModel.count
                .mockResolvedValueOnce(5) // todayTotal
                .mockResolvedValueOnce(3) // todayConfirmed
                .mockResolvedValueOnce(50) // allTimeTotal
                .mockResolvedValueOnce(30); // allTimeConfirmed

            const result = await service.getStats(1, 1);

            expect(result).toEqual({
                todayTotal: 5,
                todayConfirmed: 3,
                allTimeTotal: 50,
                allTimeConfirmed: 30,
                dailyGoal: 15,
            });
        });

        it('should fallback to station goal if user has no objective', async () => {
            userModel.findByPk.mockResolvedValue({ objectifJournalier: null });
            stationModel.findByPk.mockResolvedValue({ objectifCommercialJournalier: 12 });
            registrationModel.count.mockResolvedValue(0);

            const result = await service.getStats(1, 1);

            expect(result.dailyGoal).toBe(12);
        });
    });

    // ─── getHistory ───────────────────────────────────────────────────
    describe('getHistory', () => {
        it('should return all registrations without filters', async () => {
            registrationModel.findAll.mockResolvedValue([mockRegistration]);

            const result = await service.getHistory(1, 1);

            expect(result).toHaveLength(1);
        });

        it('should apply status filter', async () => {
            registrationModel.findAll.mockResolvedValue([]);

            await service.getHistory(1, 1, { status: 'confirmed' });

            expect(registrationModel.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ confirmed: true }),
                }),
            );
        });

        it('should apply date range filter', async () => {
            registrationModel.findAll.mockResolvedValue([]);

            await service.getHistory(1, 1, { from: '2026-01-01', to: '2026-03-01' });

            expect(registrationModel.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        date: expect.any(Object),
                    }),
                }),
            );
        });
    });

    // ─── confirmRegistrationByPlate ───────────────────────────────────
    describe('confirmRegistrationByPlate', () => {
        it('should confirm a pending registration', async () => {
            registrationModel.findOne.mockResolvedValue(mockRegistration);

            const result = await service.confirmRegistrationByPlate('LT-1234-AB', 1, 1);

            expect(mockRegistration.confirmed).toBe(true);
            expect(mockRegistration.vehicleId).toBe(1);
            expect(mockRegistration.save).toHaveBeenCalled();
        });

        it('should return null if no pending registration matches', async () => {
            registrationModel.findOne.mockResolvedValue(null);

            const result = await service.confirmRegistrationByPlate('UNKNOWN', 1);

            expect(result).toBeNull();
        });
    });
});
