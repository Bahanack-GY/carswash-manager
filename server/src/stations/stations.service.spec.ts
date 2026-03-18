import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { StationsService } from './stations.service';
import { Station } from './models/station.model';
import { Affectation } from '../users/models/affectation.model';
import { DefaultServicesService } from '../wash-operations/default-services.service';

describe('StationsService', () => {
    let service: StationsService;
    let stationModel: any;
    let affectationModel: any;

    const mockStation = {
        id: 1,
        nom: 'Station Douala',
        adresse: '123 Main St',
        town: 'Douala',
        contact: '+237600000000',
        update: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StationsService,
                {
                    provide: getModelToken(Station),
                    useValue: {
                        findAll: jest.fn(),
                        findByPk: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Affectation),
                    useValue: {
                        findAll: jest.fn(),
                    },
                },
                {
                    provide: DefaultServicesService,
                    useValue: {
                        seedGlobalDefaults: jest.fn().mockResolvedValue(undefined),
                    },
                },
            ],
        }).compile();

        service = module.get<StationsService>(StationsService);
        stationModel = module.get(getModelToken(Station));
        affectationModel = module.get(getModelToken(Affectation));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ─── findAll ──────────────────────────────────────────────────────
    describe('findAll', () => {
        it('should return all stations', async () => {
            stationModel.findAll.mockResolvedValue([mockStation]);

            const result = await service.findAll();

            expect(result).toHaveLength(1);
            expect(stationModel.findAll).toHaveBeenCalledWith(
                expect.objectContaining({ where: {} }),
            );
        });

        it('should filter by userStationIds', async () => {
            stationModel.findAll.mockResolvedValue([mockStation]);

            await service.findAll([1, 2]);

            expect(stationModel.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: [1, 2] },
                }),
            );
        });
    });

    // ─── findOne ──────────────────────────────────────────────────────
    describe('findOne', () => {
        it('should return a station by id', async () => {
            stationModel.findByPk.mockResolvedValue(mockStation);

            const result = await service.findOne(1);

            expect(result).toEqual(mockStation);
        });

        it('should throw NotFoundException if station not found', async () => {
            stationModel.findByPk.mockResolvedValue(null);

            await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
        });
    });

    // ─── create ───────────────────────────────────────────────────────
    describe('create', () => {
        it('should create a new station', async () => {
            const dto = { nom: 'New Station', adresse: '456 Blvd', town: 'Yaounde', contact: '+237611111111' };
            stationModel.create.mockResolvedValue({ id: 2, ...dto });

            const result = await service.create(dto as any);

            expect(result).toHaveProperty('id', 2);
            expect(stationModel.create).toHaveBeenCalledWith(dto);
        });
    });

    // ─── update ───────────────────────────────────────────────────────
    describe('update', () => {
        it('should update an existing station', async () => {
            const dto = { nom: 'Updated Station' };
            stationModel.findByPk.mockResolvedValue(mockStation);
            mockStation.update.mockResolvedValue({ ...mockStation, ...dto });

            const result = await service.update(1, dto as any);

            expect(mockStation.update).toHaveBeenCalledWith(dto);
        });

        it('should throw NotFoundException if station to update not found', async () => {
            stationModel.findByPk.mockResolvedValue(null);

            await expect(service.update(999, { nom: 'X' } as any)).rejects.toThrow(
                NotFoundException,
            );
        });
    });
});
