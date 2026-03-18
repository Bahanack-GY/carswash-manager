import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { IncidentsService } from './incidents.service';
import { Incident } from './models/incident.model';
import { IncidentStatus } from '../common/constants/status.enum';

describe('IncidentsService', () => {
    let service: IncidentsService;
    let incidentModel: any;

    const mockIncident = {
        id: 1,
        description: 'Rayure sur véhicule',
        statut: IncidentStatus.Open,
        severity: 'medium',
        stopsActivity: false,
        stationId: 1,
        declarantId: 1,
        dateDeclaration: '2026-03-01',
        update: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                IncidentsService,
                {
                    provide: getModelToken(Incident),
                    useValue: {
                        findAndCountAll: jest.fn(),
                        findByPk: jest.fn(),
                        findAll: jest.fn(),
                        create: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<IncidentsService>(IncidentsService);
        incidentModel = module.get(getModelToken(Incident));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ─── findAll ──────────────────────────────────────────────────────
    describe('findAll', () => {
        it('should return paginated incidents', async () => {
            incidentModel.findAndCountAll.mockResolvedValue({
                rows: [mockIncident],
                count: 1,
            });

            const result = await service.findAll({ page: 1, limit: 20 });

            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(1);
        });

        it('should filter by stationId', async () => {
            incidentModel.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

            await service.findAll({ stationId: 1 });

            expect(incidentModel.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ stationId: 1 }),
                }),
            );
        });

        it('should filter by statut', async () => {
            incidentModel.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

            await service.findAll({ statut: IncidentStatus.Open });

            expect(incidentModel.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ statut: IncidentStatus.Open }),
                }),
            );
        });

        it('should filter by stopsActivity', async () => {
            incidentModel.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

            await service.findAll({ stopsActivity: true });

            expect(incidentModel.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ stopsActivity: true }),
                }),
            );
        });
    });

    // ─── findOne ──────────────────────────────────────────────────────
    describe('findOne', () => {
        it('should return an incident', async () => {
            incidentModel.findByPk.mockResolvedValue(mockIncident);

            const result = await service.findOne(1);

            expect(result).toEqual(mockIncident);
        });

        it('should throw NotFoundException if incident not found', async () => {
            incidentModel.findByPk.mockResolvedValue(null);

            await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
        });
    });

    // ─── create ───────────────────────────────────────────────────────
    describe('create', () => {
        it('should create an incident with declarantId', async () => {
            incidentModel.create.mockResolvedValue(mockIncident);

            const result = await service.create(
                {
                    description: 'Rayure sur véhicule',
                    stationId: 1,
                    severity: 'medium',
                } as any,
                1,
            );

            expect(incidentModel.create).toHaveBeenCalledWith(
                expect.objectContaining({ declarantId: 1 }),
            );
        });
    });

    // ─── update ───────────────────────────────────────────────────────
    describe('update', () => {
        it('should update an incident', async () => {
            incidentModel.findByPk.mockResolvedValue(mockIncident);
            mockIncident.update.mockResolvedValue({
                ...mockIncident,
                statut: IncidentStatus.InProgress,
            });

            await service.update(1, { statut: IncidentStatus.InProgress } as any);

            expect(mockIncident.update).toHaveBeenCalled();
        });

        it('should auto-set resolvedAt when status becomes Resolved', async () => {
            incidentModel.findByPk.mockResolvedValue(mockIncident);
            mockIncident.update.mockResolvedValue({
                ...mockIncident,
                statut: IncidentStatus.Resolved,
            });

            const dto: any = { statut: IncidentStatus.Resolved };
            await service.update(1, dto);

            expect(dto.resolvedAt).toBeDefined();
        });

        it('should throw NotFoundException if incident to update not found', async () => {
            incidentModel.findByPk.mockResolvedValue(null);

            await expect(
                service.update(999, { statut: IncidentStatus.Resolved } as any),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ─── getActiveByStation ───────────────────────────────────────────
    describe('getActiveByStation', () => {
        it('should aggregate stopping/non-stopping incidents per station', async () => {
            incidentModel.findAll.mockResolvedValue([
                { stationId: 1, stopsActivity: true },
                { stationId: 1, stopsActivity: false },
                { stationId: 2, stopsActivity: false },
            ]);

            const result = await service.getActiveByStation();

            expect(result[1]).toEqual({
                hasStoppingIncident: true,
                hasNonStoppingIncident: true,
            });
            expect(result[2]).toEqual({
                hasStoppingIncident: false,
                hasNonStoppingIncident: true,
            });
        });

        it('should return empty object when no active incidents', async () => {
            incidentModel.findAll.mockResolvedValue([]);

            const result = await service.getActiveByStation();

            expect(result).toEqual({});
        });
    });
});
