import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
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

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WashOperationsService,
                {
                    provide: Sequelize,
                    useValue: {
                        transaction: jest.fn().mockImplementation((fn: any) =>
                            fn({
                                commit: jest.fn(),
                                rollback: jest.fn(),
                            }),
                        ),
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
                        findOne: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Client),
                    useValue: {
                        findOne: jest.fn(),
                        create: jest.fn(),
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
});
