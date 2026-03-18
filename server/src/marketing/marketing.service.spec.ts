import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { MarketingService } from './marketing.service';
import { Client } from '../clients/models/client.model';
import { Vehicle } from '../clients/models/vehicle.model';
import { Subscription } from '../clients/models/subscription.model';
import { FichePiste } from '../wash-operations/models/fiche-piste.model';
import { Paiement } from '../billing/models/paiement.model';
import { SmsTemplate } from './models/sms-template.model';
import { Campaign } from './models/campaign.model';
import { CampaignRecipient } from './models/campaign-recipient.model';
import { CommercialRegistration } from '../commercial/models/commercial-registration.model';
import { Station } from '../stations/models/station.model';
import { MarketingPromotion } from './models/promotion.model';
import { PromotionWashType } from './models/promotion-wash-type.model';
import { TypeLavage } from '../wash-operations/models/type-lavage.model';
import { ServiceSpecial } from '../wash-operations/models/service-special.model';
import { Facture } from '../billing/models/facture.model';
import { SmsService } from './sms.service';

describe('MarketingService', () => {
    let service: MarketingService;
    let clientModel: any;
    let vehicleModel: any;
    let subscriptionModel: any;
    let fichePisteModel: any;
    let paiementModel: any;
    let templateModel: any;
    let campaignModel: any;
    let recipientModel: any;
    let registrationModel: any;
    let stationModel: any;
    let smsService: any;

    const mockTemplate = {
        id: 1,
        nom: 'Welcome',
        contenu: 'Bienvenue chez LIS!',
        update: jest.fn(),
        destroy: jest.fn(),
        save: jest.fn(),
    };

    const mockCampaign = {
        id: 1,
        nom: 'Q1 Campaign',
        statut: 'draft',
        totalRecipients: 10,
        sentCount: 0,
        failedCount: 0,
        update: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MarketingService,
                {
                    provide: getModelToken(Client),
                    useValue: {
                        findAndCountAll: jest.fn(),
                        findAll: jest.fn(),
                        count: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Vehicle),
                    useValue: { count: jest.fn() },
                },
                {
                    provide: getModelToken(Subscription),
                    useValue: { count: jest.fn() },
                },
                {
                    provide: getModelToken(FichePiste),
                    useValue: {
                        count: jest.fn(),
                        findAll: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Paiement),
                    useValue: {
                        sum: jest.fn(),
                        findAll: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(SmsTemplate),
                    useValue: {
                        findAll: jest.fn(),
                        findByPk: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Campaign),
                    useValue: {
                        findAndCountAll: jest.fn(),
                        findByPk: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(CampaignRecipient),
                    useValue: {
                        bulkCreate: jest.fn(),
                        findAll: jest.fn(),
                        update: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(CommercialRegistration),
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
                        findByPk: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(MarketingPromotion),
                    useValue: {
                        findAll: jest.fn(),
                        findAndCountAll: jest.fn(),
                        findByPk: jest.fn(),
                        create: jest.fn(),
                        update: jest.fn(),
                        count: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(PromotionWashType),
                    useValue: {
                        bulkCreate: jest.fn(),
                        destroy: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(TypeLavage),
                    useValue: {
                        findAll: jest.fn(),
                        findByPk: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(ServiceSpecial),
                    useValue: {
                        findAll: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Facture),
                    useValue: {
                        findAll: jest.fn(),
                        sum: jest.fn(),
                    },
                },
                {
                    provide: SmsService,
                    useValue: {
                        send: jest.fn().mockResolvedValue({ success: true }),
                        sendSms: jest.fn().mockResolvedValue(true),
                    },
                },
            ],
        }).compile();

        service = module.get<MarketingService>(MarketingService);
        clientModel = module.get(getModelToken(Client));
        vehicleModel = module.get(getModelToken(Vehicle));
        subscriptionModel = module.get(getModelToken(Subscription));
        fichePisteModel = module.get(getModelToken(FichePiste));
        paiementModel = module.get(getModelToken(Paiement));
        templateModel = module.get(getModelToken(SmsTemplate));
        campaignModel = module.get(getModelToken(Campaign));
        recipientModel = module.get(getModelToken(CampaignRecipient));
        registrationModel = module.get(getModelToken(CommercialRegistration));
        stationModel = module.get(getModelToken(Station));
        smsService = module.get<SmsService>(SmsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ─── getInsights ──────────────────────────────────────────────────
    describe('getInsights', () => {
        it('should return aggregate marketing insights', async () => {
            clientModel.count.mockResolvedValue(100);
            fichePisteModel.count.mockResolvedValue(200);
            paiementModel.sum.mockResolvedValue(500000);
            subscriptionModel.count.mockResolvedValue(10);

            const result = await service.getInsights(1);

            expect(result).toBeDefined();
            expect(clientModel.count).toHaveBeenCalled();
        });
    });

    // ─── getSegments ──────────────────────────────────────────────────
    describe('getSegments', () => {
        it('should return segment counts', async () => {
            clientModel.count.mockResolvedValue(5);

            const result = await service.getSegments(1);

            expect(result).toBeDefined();
        });
    });

    // ─── getClients ───────────────────────────────────────────────────
    describe('getClients', () => {
        it('should return paginated clients for marketing', async () => {
            clientModel.findAndCountAll.mockResolvedValue({
                rows: [{ id: 1, nom: 'Client A' }],
                count: 1,
            });

            const result = await service.getClients({ page: 1, limit: 20 });

            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(1);
        });
    });

    // ─── Templates ────────────────────────────────────────────────────
    describe('Templates', () => {
        it('getTemplates should return all templates', async () => {
            templateModel.findAll.mockResolvedValue([mockTemplate]);

            const result = await service.getTemplates();

            expect(result).toHaveLength(1);
        });

        it('createTemplate should create a template', async () => {
            templateModel.create.mockResolvedValue(mockTemplate);

            const result = await service.createTemplate(
                { nom: 'Welcome', contenu: 'Bienvenue!' },
                1,
                1,
            );

            expect(templateModel.create).toHaveBeenCalled();
        });

        it('updateTemplate should update a template', async () => {
            templateModel.findByPk.mockResolvedValue(mockTemplate);
            mockTemplate.save.mockResolvedValue(mockTemplate);

            await service.updateTemplate(1, { nom: 'Updated' });

            expect(mockTemplate.save).toHaveBeenCalled();
        });

        it('updateTemplate should throw NotFoundException', async () => {
            templateModel.findByPk.mockResolvedValue(null);

            await expect(
                service.updateTemplate(999, { nom: 'X' }),
            ).rejects.toThrow(NotFoundException);
        });

        it('deleteTemplate should delete a template', async () => {
            templateModel.findByPk.mockResolvedValue(mockTemplate);

            await service.deleteTemplate(1);

            expect(mockTemplate.destroy).toHaveBeenCalled();
        });
    });

    // ─── Campaigns ────────────────────────────────────────────────────
    describe('Campaigns', () => {
        it('getCampaigns should return paginated campaigns', async () => {
            campaignModel.findAndCountAll.mockResolvedValue({
                rows: [mockCampaign],
                count: 1,
            });

            const result = await service.getCampaigns(1);

            expect(result.data).toHaveLength(1);
        });

        it('getCampaign should return a campaign', async () => {
            campaignModel.findByPk.mockResolvedValue(mockCampaign);

            const result = await service.getCampaign(1);

            expect(result).toEqual(mockCampaign);
        });

        it('getCampaign should throw NotFoundException', async () => {
            campaignModel.findByPk.mockResolvedValue(null);

            await expect(service.getCampaign(999)).rejects.toThrow(NotFoundException);
        });
    });

    // ─── getProspects ─────────────────────────────────────────────────
    describe('getProspects', () => {
        it('should return prospect registrations', async () => {
            registrationModel.findAll.mockResolvedValue([
                { id: 1, prospectNom: 'Prospect A', confirmed: false },
            ]);
            registrationModel.count.mockResolvedValue(1);

            const result = await service.getProspects(1);

            expect(result.recent).toHaveLength(1);
        });
    });
});
