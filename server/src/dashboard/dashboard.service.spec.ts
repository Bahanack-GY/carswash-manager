import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { DashboardService } from './dashboard.service';
import { Paiement } from '../billing/models/paiement.model';
import { FichePiste } from '../wash-operations/models/fiche-piste.model';
import { Coupon } from '../wash-operations/models/coupon.model';
import { TypeLavage } from '../wash-operations/models/type-lavage.model';
import { Reservation } from '../reservations/models/reservation.model';
import { Performance } from '../users/models/performance.model';
import { Station } from '../stations/models/station.model';
import { Incident } from '../incidents/models/incident.model';

describe('DashboardService', () => {
    let service: DashboardService;
    let paiementModel: any;
    let fichePisteModel: any;
    let couponModel: any;
    let typeLavageModel: any;
    let performanceModel: any;
    let stationModel: any;
    let incidentModel: any;

    const mockRange = {
        start: new Date('2026-03-01T00:00:00'),
        end: new Date('2026-03-01T23:59:59'),
        startStr: '2026-03-01',
        endStr: '2026-03-01',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DashboardService,
                {
                    provide: getModelToken(Paiement),
                    useValue: {
                        sum: jest.fn(),
                        count: jest.fn(),
                        findAll: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(FichePiste),
                    useValue: {
                        count: jest.fn(),
                        findAll: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Coupon),
                    useValue: {
                        count: jest.fn(),
                        findAll: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Reservation),
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
                    provide: getModelToken(TypeLavage),
                    useValue: {
                        findAll: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Performance),
                    useValue: {
                        findAll: jest.fn(),
                        sum: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Station),
                    useValue: {
                        findAll: jest.fn(),
                        count: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Incident),
                    useValue: {
                        count: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<DashboardService>(DashboardService);
        paiementModel = module.get(getModelToken(Paiement));
        fichePisteModel = module.get(getModelToken(FichePiste));
        couponModel = module.get(getModelToken(Coupon));
        typeLavageModel = module.get(getModelToken(TypeLavage));
        performanceModel = module.get(getModelToken(Performance));
        stationModel = module.get(getModelToken(Station));
        incidentModel = module.get(getModelToken(Incident));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ─── getStats ─────────────────────────────────────────────────────
    describe('getStats', () => {
        it('should return aggregated station metrics', async () => {
            paiementModel.sum.mockResolvedValue(100000);
            fichePisteModel.count.mockResolvedValue(25);
            couponModel.count
                .mockResolvedValueOnce(20) // completed
                .mockResolvedValueOnce(5); // active
            incidentModel.count.mockResolvedValue(2);

            const result = await service.getStats(1, mockRange);

            expect(result).toBeDefined();
            expect(result.revenue).toBe(100000);
            expect(result.vehicules).toBe(25);
        });

        it('should handle null sum (zero revenue)', async () => {
            paiementModel.sum.mockResolvedValue(null);
            fichePisteModel.count.mockResolvedValue(0);
            couponModel.count.mockResolvedValue(0);
            incidentModel.count.mockResolvedValue(0);

            const result = await service.getStats(1, mockRange);

            expect(result.revenue).toBe(0);
        });
    });

    // ─── getRevenue ───────────────────────────────────────────────────
    describe('getRevenue', () => {
        it('should delegate to getRevenueRange', async () => {
            paiementModel.findAll.mockResolvedValue([]);

            const result = await service.getRevenue(1, mockRange);

            expect(result).toBeDefined();
        });
    });

    // ─── getActivity ──────────────────────────────────────────────────
    describe('getActivity', () => {
        it('should return daily fiche/coupon breakdown', async () => {
            fichePisteModel.findAll.mockResolvedValue([]);
            couponModel.findAll.mockResolvedValue([]);

            const result = await service.getActivity(1, {
                startStr: '2026-03-01',
                endStr: '2026-03-01',
            });

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });
    });

    // ─── getTopPerformers ─────────────────────────────────────────────
    describe('getTopPerformers', () => {
        it('should return ranked washers', async () => {
            performanceModel.findAll.mockResolvedValue([]);

            const result = await service.getTopPerformers(1, {
                startStr: '2026-03-01',
                endStr: '2026-03-01',
            });

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });
    });

    // ─── getWashTypeDistribution ──────────────────────────────────────
    describe('getWashTypeDistribution', () => {
        it('should return wash type counts', async () => {
            fichePisteModel.findAll.mockResolvedValue([]);

            const result = await service.getWashTypeDistribution(1, {
                startStr: '2026-03-01',
                endStr: '2026-03-01',
            });

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });
    });

    // ─── Global Dashboard ─────────────────────────────────────────────
    describe('Global Dashboard', () => {
        it('getGlobalStats should return aggregated global metrics', async () => {
            paiementModel.sum.mockResolvedValue(500000);
            fichePisteModel.count.mockResolvedValue(100);
            couponModel.count.mockResolvedValue(80);
            stationModel.findAll.mockResolvedValue([
                { id: 1, nom: 'Station A' },
                { id: 2, nom: 'Station B' },
            ]);
            incidentModel.count.mockResolvedValue(3);

            const result = await service.getGlobalStats(mockRange);

            expect(result).toBeDefined();
        });

        it('getRevenueByStation should return per-station revenue', async () => {
            stationModel.findAll.mockResolvedValue([
                { id: 1, nom: 'Station A' },
            ]);
            paiementModel.findAll.mockResolvedValue([]);

            const result = await service.getRevenueByStation(mockRange);

            expect(result).toBeDefined();
        });

        it('getStationRanking should return station rankings', async () => {
            stationModel.findAll.mockResolvedValue([
                { id: 1, nom: 'Station A' },
            ]);
            paiementModel.sum.mockResolvedValue(100000);
            fichePisteModel.count.mockResolvedValue(50);

            const result = await service.getStationRanking(mockRange);

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });

        it('getGlobalTopPerformers should return top performers across all stations', async () => {
            performanceModel.findAll.mockResolvedValue([]);

            const result = await service.getGlobalTopPerformers({
                startStr: '2026-03-01',
                endStr: '2026-03-01',
            });

            expect(result).toBeDefined();
        });

        it('getGlobalWashTypeDistribution should return type distribution', async () => {
            fichePisteModel.findAll.mockResolvedValue([]);

            const result = await service.getGlobalWashTypeDistribution({
                startStr: '2026-03-01',
                endStr: '2026-03-01',
            });

            expect(result).toBeDefined();
        });
    });

    // ─── parseDateRange ───────────────────────────────────────────────
    describe('parseDateRange', () => {
        it('should default to today when no dates provided', () => {
            const result = service.parseDateRange();

            expect(result).toHaveProperty('start');
            expect(result).toHaveProperty('end');
            expect(result).toHaveProperty('startStr');
            expect(result).toHaveProperty('endStr');
        });

        it('should parse provided date strings', () => {
            const result = service.parseDateRange('2026-01-01', '2026-01-31');

            expect(result.startStr).toBe('2026-01-01');
            expect(result.endStr).toBe('2026-01-31');
        });
    });
});
