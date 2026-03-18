import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { BillingService } from './billing.service';
import { Facture } from './models/facture.model';
import { Paiement } from './models/paiement.model';
import { LigneVente } from './models/ligne-vente.model';

describe('BillingService', () => {
    let service: BillingService;
    let factureModel: any;
    let paiementModel: any;
    let ligneVenteModel: any;

    const mockFacture = {
        id: 1,
        numero: 'FAC-0001',
        montantTotal: 10000,
        tva: 0,
        date: '2026-03-01',
        stationId: 1,
        clientId: 1,
        couponId: 1,
    };

    const mockPaiement = {
        id: 1,
        methode: 'cash',
        montant: 10000,
        factureId: 1,
        stationId: 1,
        type: 'income',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BillingService,
                {
                    provide: getModelToken(Facture),
                    useValue: {
                        findAndCountAll: jest.fn(),
                        findByPk: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Paiement),
                    useValue: {
                        findAndCountAll: jest.fn(),
                        create: jest.fn(),
                        sum: jest.fn(),
                        count: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(LigneVente),
                    useValue: {
                        bulkCreate: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<BillingService>(BillingService);
        factureModel = module.get(getModelToken(Facture));
        paiementModel = module.get(getModelToken(Paiement));
        ligneVenteModel = module.get(getModelToken(LigneVente));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ─── findAllFactures ──────────────────────────────────────────────
    describe('findAllFactures', () => {
        it('should return paginated factures', async () => {
            factureModel.findAndCountAll.mockResolvedValue({
                rows: [mockFacture],
                count: 1,
            });

            const result = await service.findAllFactures({ page: 1, limit: 20 });

            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(1);
        });

        it('should filter by stationId', async () => {
            factureModel.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

            await service.findAllFactures({ stationId: 1 });

            expect(factureModel.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ stationId: 1 }),
                }),
            );
        });
    });

    // ─── findOneFacture ───────────────────────────────────────────────
    describe('findOneFacture', () => {
        it('should return a facture with includes', async () => {
            factureModel.findByPk.mockResolvedValue(mockFacture);

            const result = await service.findOneFacture(1);

            expect(result).toEqual(mockFacture);
        });

        it('should throw NotFoundException if facture not found', async () => {
            factureModel.findByPk.mockResolvedValue(null);

            await expect(service.findOneFacture(999)).rejects.toThrow(NotFoundException);
        });
    });

    // ─── createFacture ────────────────────────────────────────────────
    describe('createFacture', () => {
        it('should create a facture with auto-generated numero', async () => {
            factureModel.findOne.mockResolvedValue(null); // no previous
            factureModel.create.mockResolvedValue({ id: 1, numero: 'FAC-0001' });
            factureModel.findByPk.mockResolvedValue(mockFacture);

            const result = await service.createFacture({
                stationId: 1,
                clientId: 1,
                couponId: 1,
                montantTotal: 10000,
                date: '2026-03-01',
                lignes: [],
            } as any);

            expect(factureModel.create).toHaveBeenCalled();
        });

        it('should create LigneVente records when provided', async () => {
            factureModel.findOne.mockResolvedValue(null);
            factureModel.create.mockResolvedValue({ id: 1, numero: 'FAC-0001' });
            factureModel.findByPk.mockResolvedValue(mockFacture);

            await service.createFacture({
                stationId: 1,
                clientId: 1,
                montantTotal: 10000,
                date: '2026-03-01',
                lignes: [
                    { produitId: 1, quantite: 2, prixUnitaire: 5000 },
                ],
            } as any);

            expect(ligneVenteModel.bulkCreate).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        factureId: 1,
                        produitId: 1,
                        quantite: 2,
                        prixUnitaire: 5000,
                        sousTotal: 10000,
                    }),
                ]),
            );
        });

        it('should increment numero from last facture', async () => {
            factureModel.findOne.mockResolvedValue({ numero: 'FAC-0042' });
            factureModel.create.mockImplementation((data: any) => ({
                id: 2,
                ...data,
            }));
            factureModel.findByPk.mockResolvedValue({ ...mockFacture, numero: 'FAC-0043' });

            const result = await service.createFacture({
                stationId: 1,
                clientId: 1,
                montantTotal: 5000,
                date: '2026-03-01',
                lignes: [],
            } as any);

            expect(factureModel.create).toHaveBeenCalledWith(
                expect.objectContaining({ numero: 'FAC-0043' }),
            );
        });
    });

    // ─── createPaiement ───────────────────────────────────────────────
    describe('createPaiement', () => {
        it('should create a payment', async () => {
            paiementModel.create.mockResolvedValue(mockPaiement);

            const result = await service.createPaiement(
                { factureId: 1, methode: 'cash', montant: 10000, stationId: 1 } as any,
                1,
            );

            expect(paiementModel.create).toHaveBeenCalled();
        });
    });

    // ─── getCaisseSummary ─────────────────────────────────────────────
    describe('getCaisseSummary', () => {
        it('should return income, expenses, and balance', async () => {
            paiementModel.sum
                .mockResolvedValueOnce(50000) // income
                .mockResolvedValueOnce(10000); // expenses
            paiementModel.count.mockResolvedValue(5);

            const result = await service.getCaisseSummary(1, '2026-03-01');

            expect(result).toEqual(
                expect.objectContaining({
                    totalRecettes: 50000,
                    totalDepenses: 10000,
                    solde: 40000,
                    nombreTransactions: 5,
                    stationId: 1,
                }),
            );
        });

        it('should handle null sums (no transactions)', async () => {
            paiementModel.sum.mockResolvedValue(null);
            paiementModel.count.mockResolvedValue(0);

            const result = await service.getCaisseSummary(1);

            expect(result.totalRecettes).toBe(0);
            expect(result.totalDepenses).toBe(0);
            expect(result.solde).toBe(0);
        });
    });

    // ─── getCaisseTransactions ────────────────────────────────────────
    describe('getCaisseTransactions', () => {
        it('should return paginated transactions', async () => {
            paiementModel.findAndCountAll.mockResolvedValue({
                rows: [mockPaiement],
                count: 1,
            });

            const result = await service.getCaisseTransactions({
                stationId: 1,
                page: 1,
                limit: 20,
            });

            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(1);
        });

        it('should filter by type', async () => {
            paiementModel.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

            await service.getCaisseTransactions({
                stationId: 1,
                type: 'income' as any,
            });

            expect(paiementModel.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        stationId: 1,
                        type: 'income',
                    }),
                }),
            );
        });

        it('should filter by date', async () => {
            paiementModel.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

            await service.getCaisseTransactions({
                stationId: 1,
                date: '2026-03-01',
            });

            expect(paiementModel.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        stationId: 1,
                        createdAt: expect.any(Object),
                    }),
                }),
            );
        });
    });
});
