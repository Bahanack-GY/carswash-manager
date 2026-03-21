import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Transaction } from 'sequelize';
import { WashOperationsService } from './wash-operations.service';
import { TypeLavage } from './models/type-lavage.model';
import { ServiceSpecial } from './models/service-special.model';
import { FichePiste } from './models/fiche-piste.model';
import { FicheExtras } from './models/fiche-extras.model';
import { Coupon } from './models/coupon.model';
import { CouponWashers } from './models/coupon-washers.model';
import { User } from '../users/models/user.model';
import { Vehicle } from '../clients/models/vehicle.model';
import { Client } from '../clients/models/client.model';
import { Station } from '../stations/models/station.model';
import { Performance } from '../users/models/performance.model';
import { CommercialService } from '../commercial/commercial.service';
import { MarketingPromotion } from '../marketing/models/promotion.model';
import { BonLavage } from '../bonds/models/bon-lavage.model';
import { Affectation } from '../users/models/affectation.model';
import { CouponStatus, FichePisteStatus } from '../common/constants/status.enum';

describe('WashOperationsService', () => {
    let service: WashOperationsService;
    let typeLavageModel: any;
    let serviceSpecialModel: any;
    let fichePisteModel: any;
    let ficheExtrasModel: any;
    let couponModel: any;
    let couponWashersModel: any;
    let userModel: any;
    let vehicleModel: any;
    let clientModel: any;
    let stationModel: any;
    let performanceModel: any;
    let bonLavageModel: any;
    let commercialService: any;
    let sequelize: any;

    const mockTypeLavage = {
        id: 1,
        nom: 'Lavage Complet',
        prixBase: 5000,
        update: jest.fn(),
    };

    const mockExtra = {
        id: 1,
        nom: 'Cirage',
        prix: 2000,
        update: jest.fn(),
    };

    const mockFiche = {
        id: 1,
        numero: 'FDP-0001',
        stationId: 1,
        vehicleId: 1,
        clientId: 1,
        typeLavageId: 1,
        date: '2026-03-01',
        statut: FichePisteStatus.Open,
        update: jest.fn(),
        $set: jest.fn(),
    };

    const mockCoupon = {
        id: 1,
        numero: 'CPN-0001',
        fichePisteId: 1,
        stationId: 1,
        statut: CouponStatus.Pending,
        update: jest.fn(),
        $set: jest.fn(),
        washers: [],
    };

    const mockTxn = {
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn().mockResolvedValue(undefined),
    };

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WashOperationsService,
                {
                    provide: Sequelize,
                    useValue: {
                        transaction: jest.fn().mockImplementation((...args: any[]) => {
                            const fn = args.find((a) => typeof a === 'function');
                            if (fn) return fn(mockTxn);
                            return Promise.resolve(mockTxn); // manual transaction
                        }),
                    },
                },
                {
                    provide: getModelToken(TypeLavage),
                    useValue: {
                        findAll: jest.fn(),
                        findByPk: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(ServiceSpecial),
                    useValue: {
                        findAll: jest.fn(),
                        findByPk: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(FichePiste),
                    useValue: {
                        findAndCountAll: jest.fn(),
                        findByPk: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(FicheExtras),
                    useValue: {
                        bulkCreate: jest.fn(),
                        destroy: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Coupon),
                    useValue: {
                        findAndCountAll: jest.fn(),
                        findByPk: jest.fn(),
                        findAll: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(CouponWashers),
                    useValue: {
                        findAll: jest.fn(),
                        bulkCreate: jest.fn(),
                        destroy: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(User),
                    useValue: {
                        findByPk: jest.fn(),
                        findAll: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Vehicle),
                    useValue: {
                        findByPk: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Client),
                    useValue: {
                        findByPk: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        update: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Station),
                    useValue: {
                        findByPk: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Performance),
                    useValue: {
                        create: jest.fn(),
                        findOne: jest.fn(),
                        findOrCreate: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(MarketingPromotion),
                    useValue: {
                        findByPk: jest.fn(),
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(BonLavage),
                    useValue: {
                        findByPk: jest.fn(),
                        findOne: jest.fn(),
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
                    provide: CommercialService,
                    useValue: {
                        confirmRegistrationByPlate: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<WashOperationsService>(WashOperationsService);
        typeLavageModel = module.get(getModelToken(TypeLavage));
        serviceSpecialModel = module.get(getModelToken(ServiceSpecial));
        fichePisteModel = module.get(getModelToken(FichePiste));
        ficheExtrasModel = module.get(getModelToken(FicheExtras));
        couponModel = module.get(getModelToken(Coupon));
        couponWashersModel = module.get(getModelToken(CouponWashers));
        userModel = module.get(getModelToken(User));
        vehicleModel = module.get(getModelToken(Vehicle));
        clientModel = module.get(getModelToken(Client));
        stationModel = module.get(getModelToken(Station));
        performanceModel = module.get(getModelToken(Performance));
        bonLavageModel = module.get(getModelToken(BonLavage));
        commercialService = module.get<CommercialService>(CommercialService);
        sequelize = module.get<Sequelize>(Sequelize);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ─── TypeLavage ───────────────────────────────────────────────────
    describe('TypeLavage', () => {
        it('findAllTypes should return wash types', async () => {
            typeLavageModel.findAll.mockResolvedValue([mockTypeLavage]);

            const result = await service.findAllTypes();

            expect(result).toHaveLength(1);
        });

        it('createType should create a wash type', async () => {
            typeLavageModel.create.mockResolvedValue(mockTypeLavage);

            const result = await service.createType({
                nom: 'Lavage Complet',
                prixBase: 5000,
            } as any);

            expect(result).toEqual(mockTypeLavage);
        });

        it('updateType should update a wash type', async () => {
            typeLavageModel.findByPk.mockResolvedValue(mockTypeLavage);
            mockTypeLavage.update.mockResolvedValue({ ...mockTypeLavage, nom: 'Updated' });

            await service.updateType(1, { nom: 'Updated' } as any);

            expect(mockTypeLavage.update).toHaveBeenCalled();
        });

        it('updateType should throw NotFoundException', async () => {
            typeLavageModel.findByPk.mockResolvedValue(null);

            await expect(service.updateType(999, {} as any)).rejects.toThrow(NotFoundException);
        });
    });

    // ─── ServiceSpecial ───────────────────────────────────────────
    describe('ServiceSpecial', () => {
        it('findAllExtras should return extra services', async () => {
            serviceSpecialModel.findAll.mockResolvedValue([mockExtra]);

            const result = await service.findAllExtras();

            expect(result).toHaveLength(1);
        });

        it('createExtra should create an extra service', async () => {
            serviceSpecialModel.create.mockResolvedValue(mockExtra);

            const result = await service.createExtra({ nom: 'Cirage', prix: 2000 } as any);

            expect(result).toEqual(mockExtra);
        });
    });

    // ─── FichePiste ───────────────────────────────────────────────────
    describe('FichePiste', () => {
        it('findAllFiches should return paginated fiches', async () => {
            fichePisteModel.findAndCountAll.mockResolvedValue({
                rows: [mockFiche],
                count: 1,
            });

            const result = await service.findAllFiches({ page: 1, limit: 20 });

            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(1);
        });

        it('findOneFiche should return a fiche', async () => {
            fichePisteModel.findByPk.mockResolvedValue(mockFiche);

            const result = await service.findOneFiche(1);

            expect(result).toEqual(mockFiche);
        });

        it('findOneFiche should throw NotFoundException', async () => {
            fichePisteModel.findByPk.mockResolvedValue(null);

            await expect(service.findOneFiche(999)).rejects.toThrow(NotFoundException);
        });

        it('createFiche should create a fiche with auto-generated numero', async () => {
            fichePisteModel.findOne.mockResolvedValue(null); // no previous
            fichePisteModel.create.mockResolvedValue(mockFiche);
            fichePisteModel.findByPk.mockResolvedValue(mockFiche);

            const result = await service.createFiche({
                stationId: 1,
                vehicleId: 1,
                clientId: 1,
                typeLavageId: 1,
                date: '2026-03-01',
            } as any);

            expect(fichePisteModel.create).toHaveBeenCalled();
        });
    });

    // ─── Coupon ───────────────────────────────────────────────────────
    describe('Coupon', () => {
        it('findAllCoupons should return paginated coupons', async () => {
            couponModel.findAndCountAll.mockResolvedValue({
                rows: [mockCoupon],
                count: 1,
            });

            const result = await service.findAllCoupons({ page: 1, limit: 20 });

            expect(result.data).toHaveLength(1);
        });

        it('findOneCoupon should return a coupon', async () => {
            couponModel.findByPk.mockResolvedValue(mockCoupon);

            const result = await service.findOneCoupon(1);

            expect(result).toEqual(mockCoupon);
        });

        it('findOneCoupon should throw NotFoundException', async () => {
            couponModel.findByPk.mockResolvedValue(null);

            await expect(service.findOneCoupon(999)).rejects.toThrow(NotFoundException);
        });

        it('createCoupon should create a coupon and link to fiche', async () => {
            couponModel.findOne.mockResolvedValue(null); // no previous
            fichePisteModel.findByPk.mockResolvedValue(mockFiche);
            couponModel.create.mockResolvedValue(mockCoupon);
            couponModel.findByPk.mockResolvedValue(mockCoupon);

            const result = await service.createCoupon({
                fichePisteId: 1,
                stationId: 1,
            } as any);

            expect(couponModel.create).toHaveBeenCalled();
        });

        it('assignWashers should assign washers to a coupon', async () => {
            couponModel.findByPk.mockResolvedValue(mockCoupon);
            couponWashersModel.destroy.mockResolvedValue(undefined);
            couponWashersModel.bulkCreate.mockResolvedValue(undefined);

            await service.assignWashers(1, { washerIds: [1, 2] });

            expect(couponWashersModel.bulkCreate).toHaveBeenCalled();
        });

        it('findMyAssigned should return coupons assigned to user', async () => {
            couponWashersModel.findAll.mockResolvedValue([{ couponId: 1 }]);
            couponModel.findAll.mockResolvedValue([mockCoupon]);

            const result = await service.findMyAssigned(1);

            expect(result).toHaveLength(1);
        });
    });

    // ─── Atomicity & Isolation ─────────────────────────────────────────
    describe('createFiche — atomicity & isolation', () => {
        beforeEach(() => {
            fichePisteModel.findOne.mockResolvedValue(null);
            fichePisteModel.create.mockResolvedValue(mockFiche);
            fichePisteModel.findByPk.mockResolvedValue(mockFiche);
            ficheExtrasModel.bulkCreate.mockResolvedValue([]);
        });

        it('uses REPEATABLE READ isolation', async () => {
            await service.createFiche({ stationId: 1, vehicleId: 1, date: '2026-03-01' } as any);

            expect(sequelize.transaction).toHaveBeenCalledWith(
                expect.objectContaining({ isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ }),
                expect.any(Function),
            );
        });

        it('locks last fiche row during numero generation', async () => {
            await service.createFiche({ stationId: 1, vehicleId: 1, date: '2026-03-01' } as any);

            expect(fichePisteModel.findOne).toHaveBeenCalledWith(
                expect.objectContaining({ lock: Transaction.LOCK.UPDATE }),
            );
        });

        it('passes the same transaction to fiche create and extras bulkCreate', async () => {
            await service.createFiche({ stationId: 1, vehicleId: 1, date: '2026-03-01', extrasIds: [1, 2] } as any);

            const createTxn = fichePisteModel.create.mock.calls[0][1]?.transaction;
            const bulkTxn = ficheExtrasModel.bulkCreate.mock.calls[0][1]?.transaction;
            expect(createTxn).toBeDefined();
            expect(createTxn).toBe(bulkTxn);
        });
    });

    describe('assignWashers — atomicity', () => {
        beforeEach(() => {
            couponModel.findByPk.mockResolvedValue(mockCoupon);
            couponWashersModel.destroy.mockResolvedValue(1);
            couponWashersModel.bulkCreate.mockResolvedValue([]);
            couponModel.findByPk.mockResolvedValue(mockCoupon);
        });

        it('uses REPEATABLE READ isolation', async () => {
            await service.assignWashers(1, { washerIds: [1] });

            expect(sequelize.transaction).toHaveBeenCalledWith(
                expect.objectContaining({ isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ }),
                expect.any(Function),
            );
        });

        it('destroy and bulkCreate happen in same transaction', async () => {
            await service.assignWashers(1, { washerIds: [2, 3] });

            const destroyTxn = couponWashersModel.destroy.mock.calls[0][0]?.transaction;
            const bulkTxn = couponWashersModel.bulkCreate.mock.calls[0][1]?.transaction;
            expect(destroyTxn).toBeDefined();
            expect(destroyTxn).toBe(bulkTxn);
        });
    });

    describe('updateCouponStatus — Done (performance tracking)', () => {
        const mockPerf = {
            vehiculesLaves: 2,
            bonusEstime: 300,
            increment: jest.fn().mockResolvedValue(undefined),
            update: jest.fn(),
        };
        const mockWasher = { id: 10, bonusParLavage: 150 };
        const mockDoneCoupon = {
            id: 1,
            statut: CouponStatus.Washing,
            fichePiste: { stationId: 1, typeLavage: { fraisService: 200 }, extras: [] },
            washers: [mockWasher],
            update: jest.fn().mockResolvedValue(undefined),
        };

        beforeEach(() => {
            couponModel.findByPk.mockResolvedValue(mockDoneCoupon);
            performanceModel.findOrCreate.mockResolvedValue([mockPerf, false]);
            couponModel.findByPk.mockResolvedValueOnce(mockDoneCoupon).mockResolvedValueOnce(mockDoneCoupon);
        });

        it('uses SERIALIZABLE isolation', async () => {
            await service.updateCouponStatus(1, { statut: CouponStatus.Done });

            expect(sequelize.transaction).toHaveBeenCalledWith(
                expect.objectContaining({ isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE }),
                expect.any(Function),
            );
        });

        it('uses atomic increment — not read-modify-write — for performance counters', async () => {
            await service.updateCouponStatus(1, { statut: CouponStatus.Done });

            expect(mockPerf.increment).toHaveBeenCalledWith(
                expect.objectContaining({ vehiculesLaves: 1 }),
                expect.any(Object),
            );
            expect(mockPerf.update).not.toHaveBeenCalled();
        });
    });

    describe('updateCouponStatus — Paid (loyalty points)', () => {
        const mockClient = {
            id: 5,
            pointsFidelite: 9,
            increment: jest.fn().mockResolvedValue(undefined),
            update: jest.fn(),
        };
        const mockPaidCoupon = {
            id: 1,
            statut: CouponStatus.Done,
            fichePiste: { stationId: 1, clientId: 5, vehicleId: 1, controleurId: 1, typeLavage: null, extras: [] },
            washers: [],
            update: jest.fn().mockResolvedValue(undefined),
        };

        beforeEach(() => {
            couponModel.findByPk
                .mockResolvedValueOnce(mockPaidCoupon)
                .mockResolvedValueOnce(mockPaidCoupon);
            clientModel.findByPk.mockResolvedValue(mockClient);
            bonLavageModel.findOne.mockResolvedValue(null);
            bonLavageModel.create.mockResolvedValue({});
        });

        it('uses atomic increment for loyalty points — not read-modify-write', async () => {
            await service.updateCouponStatus(1, { statut: CouponStatus.Paid });

            expect(mockClient.increment).toHaveBeenCalledWith('pointsFidelite', expect.objectContaining({ by: 1 }));
            expect(mockClient.update).not.toHaveBeenCalled();
        });

        it('locks the client row with SELECT FOR UPDATE', async () => {
            await service.updateCouponStatus(1, { statut: CouponStatus.Paid });

            expect(clientModel.findByPk).toHaveBeenCalledWith(
                5,
                expect.objectContaining({ lock: Transaction.LOCK.UPDATE }),
            );
        });

        it('uses SERIALIZABLE isolation', async () => {
            await service.updateCouponStatus(1, { statut: CouponStatus.Paid });

            expect(sequelize.transaction).toHaveBeenCalledWith(
                expect.objectContaining({ isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE }),
                expect.any(Function),
            );
        });
    });

    describe('createNouveauLavage — atomicity & isolation', () => {
        beforeEach(() => {
            fichePisteModel.findOne.mockResolvedValue(null);
            couponModel.findOne.mockResolvedValue(null);
            fichePisteModel.create.mockResolvedValue({ id: 10 });
            couponModel.create.mockResolvedValue({ id: 20 });
            typeLavageModel.findAll.mockResolvedValue([]);
            serviceSpecialModel.findAll.mockResolvedValue([]);
            ficheExtrasModel.bulkCreate.mockResolvedValue([]);
            couponWashersModel.bulkCreate.mockResolvedValue([]);
            couponModel.findByPk.mockResolvedValue(mockCoupon);
        });

        it('uses SERIALIZABLE isolation', async () => {
            await service.createNouveauLavage({
                stationId: 1, vehicleId: 1, clientId: 1, date: '2026-03-01',
            } as any);

            expect(sequelize.transaction).toHaveBeenCalledWith(
                expect.objectContaining({ isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE }),
            );
        });

        it('commits on success', async () => {
            await service.createNouveauLavage({
                stationId: 1, vehicleId: 1, clientId: 1, date: '2026-03-01',
            } as any);

            expect(mockTxn.commit).toHaveBeenCalled();
            expect(mockTxn.rollback).not.toHaveBeenCalled();
        });

        it('rolls back and rethrows on error', async () => {
            fichePisteModel.create.mockRejectedValue(new Error('FK violation'));

            await expect(service.createNouveauLavage({
                stationId: 1, vehicleId: 1, clientId: 1, date: '2026-03-01',
            } as any)).rejects.toThrow('FK violation');

            expect(mockTxn.rollback).toHaveBeenCalled();
        });
    });
});
