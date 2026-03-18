import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { ClientsService } from './clients.service';
import { Client } from './models/client.model';
import { Vehicle } from './models/vehicle.model';
import { Subscription } from './models/subscription.model';

describe('ClientsService', () => {
    let service: ClientsService;
    let clientModel: any;
    let vehicleModel: any;
    let subscriptionModel: any;

    const mockClient = {
        id: 1,
        nom: 'Client Test',
        contact: '+237600000000',
        email: 'client@test.com',
        pointsFidelite: 0,
        update: jest.fn(),
    };

    const mockVehicle = {
        id: 1,
        immatriculation: 'LT-1234-AB',
        modele: 'Toyota',
        color: 'White',
        clientId: 1,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ClientsService,
                {
                    provide: getModelToken(Client),
                    useValue: {
                        findAndCountAll: jest.fn(),
                        findByPk: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Vehicle),
                    useValue: {
                        findAll: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Subscription),
                    useValue: {
                        create: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<ClientsService>(ClientsService);
        clientModel = module.get(getModelToken(Client));
        vehicleModel = module.get(getModelToken(Vehicle));
        subscriptionModel = module.get(getModelToken(Subscription));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ─── findAll ──────────────────────────────────────────────────────
    describe('findAll', () => {
        it('should return paginated clients', async () => {
            clientModel.findAndCountAll.mockResolvedValue({
                rows: [mockClient],
                count: 1,
            });

            const result = await service.findAll({ page: 1, limit: 10 });

            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(result.totalPages).toBe(1);
        });

        it('should apply search filter', async () => {
            clientModel.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

            await service.findAll({ search: 'Test' });

            expect(clientModel.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.any(Object),
                }),
            );
        });

        it('should apply stationId filter', async () => {
            clientModel.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

            await service.findAll({ stationId: 1 });

            expect(clientModel.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ stationId: 1 }),
                }),
            );
        });
    });

    // ─── findOne ──────────────────────────────────────────────────────
    describe('findOne', () => {
        it('should return a client with vehicles and subscriptions', async () => {
            clientModel.findByPk.mockResolvedValue(mockClient);

            const result = await service.findOne(1);

            expect(result).toEqual(mockClient);
        });

        it('should throw NotFoundException if client not found', async () => {
            clientModel.findByPk.mockResolvedValue(null);

            await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
        });
    });

    // ─── create ───────────────────────────────────────────────────────
    describe('create', () => {
        it('should create a new client', async () => {
            const dto = { nom: 'New Client', contact: '+237611111111' };
            clientModel.findOne.mockResolvedValue(null);
            clientModel.create.mockResolvedValue({ id: 2, ...dto });

            const result = await service.create(dto as any);

            expect(result).toHaveProperty('id', 2);
        });

        it('should throw ConflictException for duplicate contact', async () => {
            clientModel.findOne.mockResolvedValue(mockClient);

            await expect(
                service.create({ nom: 'X', contact: '+237600000000' } as any),
            ).rejects.toThrow(ConflictException);
        });
    });

    // ─── update ───────────────────────────────────────────────────────
    describe('update', () => {
        it('should update an existing client', async () => {
            const dto = { nom: 'Updated Name' };
            clientModel.findByPk.mockResolvedValue(mockClient);
            clientModel.findOne.mockResolvedValue(null);
            mockClient.update.mockResolvedValue({ ...mockClient, ...dto });

            await service.update(1, dto as any);

            expect(mockClient.update).toHaveBeenCalledWith(dto);
        });
    });

    // ─── findVehicleByPlate ───────────────────────────────────────────
    describe('findVehicleByPlate', () => {
        it('should return a vehicle by plate (case-insensitive)', async () => {
            vehicleModel.findOne.mockResolvedValue(mockVehicle);

            const result = await service.findVehicleByPlate('lt-1234-ab');

            expect(result).toEqual(mockVehicle);
        });

        it('should return null if plate not found', async () => {
            vehicleModel.findOne.mockResolvedValue(null);

            const result = await service.findVehicleByPlate('UNKNOWN');

            expect(result).toBeNull();
        });
    });

    // ─── getVehicles ──────────────────────────────────────────────────
    describe('getVehicles', () => {
        it('should return vehicles for a client', async () => {
            clientModel.findByPk.mockResolvedValue(mockClient);
            vehicleModel.findAll.mockResolvedValue([mockVehicle]);

            const result = await service.getVehicles(1);

            expect(result).toHaveLength(1);
        });

        it('should throw NotFoundException if client not found', async () => {
            clientModel.findByPk.mockResolvedValue(null);

            await expect(service.getVehicles(999)).rejects.toThrow(NotFoundException);
        });
    });

    // ─── createVehicle ────────────────────────────────────────────────
    describe('createVehicle', () => {
        it('should create a vehicle for a client', async () => {
            clientModel.findByPk.mockResolvedValue(mockClient);
            vehicleModel.findOne.mockResolvedValue(null);
            vehicleModel.create.mockResolvedValue({ id: 2, ...mockVehicle, clientId: 1 });

            const result = await service.createVehicle(1, {
                immatriculation: 'LT-5678-CD',
                modele: 'Honda',
            } as any);

            expect(vehicleModel.create).toHaveBeenCalled();
        });

        it('should throw ConflictException for duplicate plate', async () => {
            clientModel.findByPk.mockResolvedValue(mockClient);
            vehicleModel.findOne.mockResolvedValue(mockVehicle);

            await expect(
                service.createVehicle(1, { immatriculation: 'LT-1234-AB' } as any),
            ).rejects.toThrow(ConflictException);
        });
    });

    // ─── createSubscription ───────────────────────────────────────────
    describe('createSubscription', () => {
        it('should create a subscription for a client', async () => {
            clientModel.findByPk.mockResolvedValue(mockClient);
            subscriptionModel.create.mockResolvedValue({
                id: 1,
                clientId: 1,
                type: 'mensuel',
                actif: true,
            });

            const result = await service.createSubscription(1, {
                type: 'mensuel',
                dateDebut: '2026-01-01',
                dateFin: '2026-02-01',
            } as any);

            expect(subscriptionModel.create).toHaveBeenCalled();
        });
    });
});
