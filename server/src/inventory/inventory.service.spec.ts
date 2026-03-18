import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { InventoryService } from './inventory.service';
import { Produit } from './models/produit.model';
import { MouvementStock } from './models/mouvement-stock.model';
import { Fournisseur } from './models/fournisseur.model';
import { CommandeAchat } from './models/commande-achat.model';
import { Paiement } from '../billing/models/paiement.model';

describe('InventoryService', () => {
    let service: InventoryService;
    let produitModel: any;
    let mouvementStockModel: any;
    let fournisseurModel: any;
    let commandeAchatModel: any;

    const mockProduit = {
        id: 1,
        nom: 'Shampooing Auto',
        categorie: 'chimique',
        quantiteStock: 50,
        quantiteAlerte: 10,
        stationId: 1,
        prixRevient: 0,
        update: jest.fn(),
        increment: jest.fn(),
        decrement: jest.fn(),
    };

    const mockMouvement = {
        id: 1,
        produitId: 1,
        typeMouvement: 'entree',
        quantite: 20,
        motif: 'Réapprovisionnement',
    };

    const mockFournisseur = {
        id: 1,
        nom: 'Fournisseur A',
        contact: '+237600000000',
        update: jest.fn(),
    };

    const mockCommande = {
        id: 1,
        numero: 'CMD-0001',
        fournisseurId: 1,
        stationId: 1,
        statut: 'pending',
        update: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InventoryService,
                {
                    provide: getModelToken(Produit),
                    useValue: {
                        findAndCountAll: jest.fn(),
                        findByPk: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(MouvementStock),
                    useValue: {
                        findAndCountAll: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Fournisseur),
                    useValue: {
                        findAndCountAll: jest.fn(),
                        findByPk: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(CommandeAchat),
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

        service = module.get<InventoryService>(InventoryService);
        produitModel = module.get(getModelToken(Produit));
        mouvementStockModel = module.get(getModelToken(MouvementStock));
        fournisseurModel = module.get(getModelToken(Fournisseur));
        commandeAchatModel = module.get(getModelToken(CommandeAchat));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ─── Produits ─────────────────────────────────────────────────────
    describe('Produits', () => {
        it('findAllProduits should return paginated products', async () => {
            produitModel.findAndCountAll.mockResolvedValue({
                rows: [mockProduit],
                count: 1,
            });

            const result = await service.findAllProduits({ page: 1, limit: 20 });

            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(1);
        });

        it('findAllProduits should filter by stationId', async () => {
            produitModel.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

            await service.findAllProduits({ stationId: 1 });

            expect(produitModel.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ stationId: 1 }),
                }),
            );
        });

        it('findAllProduits should filter by categorie', async () => {
            produitModel.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

            await service.findAllProduits({ categorie: 'chimique' });

            expect(produitModel.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ categorie: 'chimique' }),
                }),
            );
        });

        it('findOneProduit should return a product', async () => {
            produitModel.findByPk.mockResolvedValue(mockProduit);

            const result = await service.findOneProduit(1);

            expect(result).toEqual(mockProduit);
        });

        it('findOneProduit should throw NotFoundException', async () => {
            produitModel.findByPk.mockResolvedValue(null);

            await expect(service.findOneProduit(999)).rejects.toThrow(NotFoundException);
        });

        it('createProduit should create a product', async () => {
            produitModel.create.mockResolvedValue(mockProduit);

            const result = await service.createProduit({
                nom: 'Shampooing Auto',
                categorie: 'chimique',
                quantiteStock: 50,
                quantiteAlerte: 10,
            } as any);

            expect(result).toEqual(mockProduit);
        });

        it('updateProduit should update a product', async () => {
            produitModel.findByPk.mockResolvedValue(mockProduit);
            mockProduit.update.mockResolvedValue({ ...mockProduit, nom: 'Updated' });

            await service.updateProduit(1, { nom: 'Updated' } as any);

            expect(mockProduit.update).toHaveBeenCalled();
        });
    });

    // ─── MouvementsStock ──────────────────────────────────────────────
    describe('MouvementsStock', () => {
        it('findAllMouvements should return paginated movements', async () => {
            mouvementStockModel.findAndCountAll.mockResolvedValue({
                rows: [mockMouvement],
                count: 1,
            });

            const result = await service.findAllMouvements({ page: 1, limit: 20 });

            expect(result.data).toHaveLength(1);
        });

        it('createMouvement should create a movement and update stock', async () => {
            produitModel.findByPk.mockResolvedValue(mockProduit);
            mouvementStockModel.create.mockResolvedValue(mockMouvement);
            mockProduit.update.mockResolvedValue(mockProduit);

            const result = await service.createMouvement(
                {
                    produitId: 1,
                    typeMouvement: 'entree',
                    quantite: 20,
                    motif: 'Réapprovisionnement',
                } as any,
                1,
            );

            expect(mouvementStockModel.create).toHaveBeenCalled();
        });
    });

    // ─── Fournisseurs ─────────────────────────────────────────────────
    describe('Fournisseurs', () => {
        it('findAllFournisseurs should return paginated suppliers', async () => {
            fournisseurModel.findAndCountAll.mockResolvedValue({
                rows: [mockFournisseur],
                count: 1,
            });

            const result = await service.findAllFournisseurs({ page: 1, limit: 20 });

            expect(result.data).toHaveLength(1);
        });

        it('findOneFournisseur should return a supplier', async () => {
            fournisseurModel.findByPk.mockResolvedValue(mockFournisseur);

            const result = await service.findOneFournisseur(1);

            expect(result).toEqual(mockFournisseur);
        });

        it('findOneFournisseur should throw NotFoundException', async () => {
            fournisseurModel.findByPk.mockResolvedValue(null);

            await expect(service.findOneFournisseur(999)).rejects.toThrow(NotFoundException);
        });

        it('createFournisseur should create a supplier', async () => {
            fournisseurModel.create.mockResolvedValue(mockFournisseur);

            const result = await service.createFournisseur({
                nom: 'Fournisseur A',
                contact: '+237600000000',
            } as any);

            expect(result).toEqual(mockFournisseur);
        });

        it('updateFournisseur should update a supplier', async () => {
            fournisseurModel.findByPk.mockResolvedValue(mockFournisseur);
            mockFournisseur.update.mockResolvedValue({ ...mockFournisseur, nom: 'Updated' });

            await service.updateFournisseur(1, { nom: 'Updated' } as any);

            expect(mockFournisseur.update).toHaveBeenCalled();
        });
    });

    // ─── CommandesAchat ───────────────────────────────────────────────
    describe('CommandesAchat', () => {
        it('findAllCommandes should return paginated orders', async () => {
            commandeAchatModel.findAndCountAll.mockResolvedValue({
                rows: [mockCommande],
                count: 1,
            });

            const result = await service.findAllCommandes({ page: 1, limit: 20 });

            expect(result.data).toHaveLength(1);
        });

        it('createCommande should create a purchase order with auto-numero', async () => {
            commandeAchatModel.findOne.mockResolvedValue(null);
            commandeAchatModel.create.mockResolvedValue(mockCommande);

            const result = await service.createCommande({
                fournisseurId: 1,
                stationId: 1,
            } as any);

            expect(commandeAchatModel.create).toHaveBeenCalled();
        });

        it('updateCommande should update a purchase order', async () => {
            commandeAchatModel.findByPk.mockResolvedValue(mockCommande);
            mockCommande.update.mockResolvedValue({ ...mockCommande, statut: 'delivered' });

            await service.updateCommande(1, { statut: 'delivered' } as any);

            expect(mockCommande.update).toHaveBeenCalled();
        });

        it('updateCommande should throw NotFoundException', async () => {
            commandeAchatModel.findByPk.mockResolvedValue(null);

            await expect(service.updateCommande(999, {} as any)).rejects.toThrow(
                NotFoundException,
            );
        });
    });
});
