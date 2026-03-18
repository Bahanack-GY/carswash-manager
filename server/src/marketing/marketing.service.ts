import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, literal, fn, col } from 'sequelize';
import { Client } from '../clients/models/client.model.js';
import { Vehicle } from '../clients/models/vehicle.model.js';
import { Subscription } from '../clients/models/subscription.model.js';
import { FichePiste } from '../wash-operations/models/fiche-piste.model.js';
import { Facture } from '../billing/models/facture.model.js';
import { CommercialRegistration } from '../commercial/models/commercial-registration.model.js';
import { SmsTemplate } from './models/sms-template.model.js';
import { Campaign, CampaignStatus } from './models/campaign.model.js';
import { CampaignRecipient, RecipientStatus } from './models/campaign-recipient.model.js';
import { MarketingPromotion, PromotionType, DiscountType } from './models/promotion.model.js';
import { PromotionWashType } from './models/promotion-wash-type.model.js';
import { TypeLavage } from '../wash-operations/models/type-lavage.model.js';
import { ServiceSpecial } from '../wash-operations/models/service-special.model.js';
import { SmsService } from './sms.service.js';
import { Station } from '../stations/models/station.model.js';
import { User } from '../users/models/user.model.js';
import { CreatePromotionDto, UpdatePromotionDto } from './dto/promotion.dto.js';

@Injectable()
export class MarketingService {
  constructor(
    @InjectModel(Client)
    private readonly clientModel: typeof Client,
    @InjectModel(Vehicle)
    private readonly vehicleModel: typeof Vehicle,
    @InjectModel(Subscription)
    private readonly subscriptionModel: typeof Subscription,
    @InjectModel(FichePiste)
    private readonly fichePisteModel: typeof FichePiste,
    @InjectModel(Facture)
    private readonly factureModel: typeof Facture,
    @InjectModel(CommercialRegistration)
    private readonly registrationModel: typeof CommercialRegistration,
    @InjectModel(SmsTemplate)
    private readonly templateModel: typeof SmsTemplate,
    @InjectModel(Campaign)
    private readonly campaignModel: typeof Campaign,
    @InjectModel(CampaignRecipient)
    private readonly recipientModel: typeof CampaignRecipient,
    @InjectModel(Station)
    private readonly stationModel: typeof Station,
    @InjectModel(MarketingPromotion)
    private readonly promotionModel: typeof MarketingPromotion,
    @InjectModel(PromotionWashType)
    private readonly promotionWashTypeModel: typeof PromotionWashType,
    @InjectModel(TypeLavage)
    private readonly typeLavageModel: typeof TypeLavage,
    @InjectModel(ServiceSpecial)
    private readonly serviceSpecialModel: typeof ServiceSpecial,
    private readonly smsService: SmsService,
  ) {}

  private daysAgo(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }

  private todayStr(): string {
    return new Date().toISOString().slice(0, 10);
  }

  // ─── KPI Insights ─────────────────────────────────────────────────

  async getInsights(stationId?: number) {
    const thirtyDaysAgo = this.daysAgo(30);
    const stationWhere: any = stationId ? { stationId } : {};

    const [totalClients, activeClients, totalRevenue, subscriptionCount, totalRegistrations, confirmedRegistrations] =
      await Promise.all([
        this.clientModel.count({ where: stationWhere }),

        this.clientModel.count({
          where: {
            ...stationWhere,
            id: {
              [Op.in]: literal(
                `(SELECT DISTINCT "clientId" FROM fiches_piste WHERE "clientId" IS NOT NULL AND date >= '${thirtyDaysAgo}'${stationId ? ` AND "stationId" = ${stationId}` : ''})`,
              ),
            },
          },
        }),

        this.factureModel.sum('montantTotal', {
          where: {
            ...stationWhere,
            date: { [Op.gte]: thirtyDaysAgo },
          },
        }),

        this.subscriptionModel.count({
          where: { actif: true },
          include: stationId
            ? [{ model: Client, where: { stationId }, attributes: [] }]
            : [],
        }),

        this.registrationModel.count({ where: stationWhere }),

        this.registrationModel.count({
          where: { ...stationWhere, confirmed: true },
        }),
      ]);

    const revenue = totalRevenue ?? 0;
    const avgRevenuePerClient = activeClients > 0 ? Math.round(revenue / activeClients) : 0;
    const conversionRate = totalRegistrations > 0
      ? Math.round((confirmedRegistrations / totalRegistrations) * 100)
      : 0;

    return {
      totalClients,
      activeClients,
      totalRevenue: revenue,
      avgRevenuePerClient,
      subscriptionCount,
      conversionRate,
    };
  }

  // ─── Smart Segments ───────────────────────────────────────────────

  async getSegments(stationId?: number) {
    const thirtyDaysAgo = this.daysAgo(30);
    const sixtyDaysAgo = this.daysAgo(60);
    const stationFilter = stationId ? ` AND "stationId" = ${stationId}` : '';
    const clientStationWhere: any = stationId ? { stationId } : {};

    const [vipCount, fidelesCount, reguliersCount, aRisqueCount, nouveauxCount, prospectsCount] =
      await Promise.all([
        // VIP: 5+ visits and total spend in top 20%
        this.clientModel.count({
          where: {
            ...clientStationWhere,
            [Op.and]: [
              literal(`(SELECT COUNT(*) FROM fiches_piste WHERE fiches_piste."clientId" = "Client"."id"${stationFilter}) >= 5`),
              literal(`(SELECT COALESCE(SUM("montantTotal"), 0) FROM factures WHERE factures."clientId" = "Client"."id"${stationFilter}) >= COALESCE((SELECT PERCENTILE_CONT(0.8) WITHIN GROUP (ORDER BY sub.total) FROM (SELECT SUM("montantTotal") AS total FROM factures${stationId ? ` WHERE "stationId" = ${stationId}` : ''} GROUP BY "clientId") sub), 0)`),
            ],
          },
        }),

        // Fideles: has active subscription
        this.clientModel.count({
          where: {
            ...clientStationWhere,
            id: {
              [Op.in]: literal(
                `(SELECT DISTINCT "clientId" FROM subscriptions WHERE actif = true)`,
              ),
            },
          },
        }),

        // Reguliers: 3+ visits in last 60 days
        this.clientModel.count({
          where: {
            ...clientStationWhere,
            id: {
              [Op.in]: literal(
                `(SELECT "clientId" FROM fiches_piste WHERE "clientId" IS NOT NULL AND date >= '${sixtyDaysAgo}'${stationFilter} GROUP BY "clientId" HAVING COUNT(*) >= 3)`,
              ),
            },
          },
        }),

        // A risque: 2+ visits total, 0 in last 30 days
        this.clientModel.count({
          where: {
            ...clientStationWhere,
            [Op.and]: [
              literal(`(SELECT COUNT(*) FROM fiches_piste WHERE fiches_piste."clientId" = "Client"."id"${stationFilter}) >= 2`),
              literal(`(SELECT COUNT(*) FROM fiches_piste WHERE fiches_piste."clientId" = "Client"."id" AND date >= '${thirtyDaysAgo}'${stationFilter}) = 0`),
            ],
          },
        }),

        // Nouveaux: created in last 30 days
        this.clientModel.count({
          where: {
            ...clientStationWhere,
            createdAt: { [Op.gte]: new Date(thirtyDaysAgo) },
          },
        }),

        // Prospects: unconfirmed commercial registrations
        this.registrationModel.count({
          where: {
            confirmed: false,
            ...(stationId ? { stationId } : {}),
          },
        }),
      ]);

    return [
      { key: 'vip', label: 'VIP', count: vipCount, color: '#f59e0b' },
      { key: 'fideles', label: 'Fid\u00e8les', count: fidelesCount, color: '#10b981' },
      { key: 'reguliers', label: 'R\u00e9guliers', count: reguliersCount, color: '#3b82f6' },
      { key: 'a_risque', label: '\u00c0 Risque', count: aRisqueCount, color: '#ef4444' },
      { key: 'nouveaux', label: 'Nouveaux', count: nouveauxCount, color: '#8b5cf6' },
      { key: 'prospects', label: 'Prospects', count: prospectsCount, color: '#f97316' },
    ];
  }

  // ─── Enriched Client List ─────────────────────────────────────────

  async getClients(filters: {
    search?: string;
    segment?: string;
    stationId?: number;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;
    const stationFilter = filters.stationId
      ? ` AND "stationId" = ${filters.stationId}`
      : '';
    const clientStationWhere: any = filters.stationId
      ? { stationId: filters.stationId }
      : {};

    const where: any = { ...clientStationWhere };

    // Search
    if (filters.search) {
      const term = `%${filters.search.trim()}%`;
      where[Op.or as any] = [
        { nom: { [Op.iLike]: term } },
        { contact: { [Op.iLike]: term } },
        { email: { [Op.iLike]: term } },
      ];
    }

    // Segment filtering
    const thirtyDaysAgo = this.daysAgo(30);
    const sixtyDaysAgo = this.daysAgo(60);

    if (filters.segment) {
      switch (filters.segment) {
        case 'vip':
          where[Op.and as any] = [
            ...(where[Op.and as any] || []),
            literal(`(SELECT COUNT(*) FROM fiches_piste WHERE fiches_piste."clientId" = "Client"."id"${stationFilter}) >= 5`),
            literal(`(SELECT COALESCE(SUM("montantTotal"), 0) FROM factures WHERE factures."clientId" = "Client"."id"${stationFilter}) >= COALESCE((SELECT PERCENTILE_CONT(0.8) WITHIN GROUP (ORDER BY sub.total) FROM (SELECT SUM("montantTotal") AS total FROM factures${filters.stationId ? ` WHERE "stationId" = ${filters.stationId}` : ''} GROUP BY "clientId") sub), 0)`),
          ];
          break;
        case 'fideles':
          where.id = {
            [Op.in]: literal(
              `(SELECT DISTINCT "clientId" FROM subscriptions WHERE actif = true)`,
            ),
          };
          break;
        case 'reguliers':
          where.id = {
            ...(where.id || {}),
            [Op.in]: literal(
              `(SELECT "clientId" FROM fiches_piste WHERE "clientId" IS NOT NULL AND date >= '${sixtyDaysAgo}'${stationFilter} GROUP BY "clientId" HAVING COUNT(*) >= 3)`,
            ),
          };
          break;
        case 'a_risque':
          where[Op.and as any] = [
            ...(where[Op.and as any] || []),
            literal(`(SELECT COUNT(*) FROM fiches_piste WHERE fiches_piste."clientId" = "Client"."id"${stationFilter}) >= 2`),
            literal(`(SELECT COUNT(*) FROM fiches_piste WHERE fiches_piste."clientId" = "Client"."id" AND date >= '${thirtyDaysAgo}'${stationFilter}) = 0`),
          ];
          break;
        case 'nouveaux':
          where.createdAt = { [Op.gte]: new Date(thirtyDaysAgo) };
          break;
      }
    }

    // Computed attributes via literal subqueries
    const attributes: any = {
      include: [
        [
          literal(`(SELECT COUNT(*) FROM vehicles WHERE vehicles."clientId" = "Client"."id")`),
          'vehicleCount',
        ],
        [
          literal(`(SELECT COUNT(*) FROM fiches_piste WHERE fiches_piste."clientId" = "Client"."id"${stationFilter})`),
          'totalVisits',
        ],
        [
          literal(`(SELECT COALESCE(SUM("montantTotal"), 0) FROM factures WHERE factures."clientId" = "Client"."id"${stationFilter})`),
          'totalSpent',
        ],
        [
          literal(`(SELECT MAX(date) FROM fiches_piste WHERE fiches_piste."clientId" = "Client"."id"${stationFilter})`),
          'lastVisitDate',
        ],
        [
          literal(`(SELECT COUNT(*) > 0 FROM subscriptions WHERE subscriptions."clientId" = "Client"."id" AND subscriptions.actif = true)`),
          'hasSubscription',
        ],
      ],
    };

    // Sorting
    const sortMap: Record<string, any> = {
      nom: [['nom', filters.sortOrder || 'ASC']],
      visits: [[literal(`(SELECT COUNT(*) FROM fiches_piste WHERE fiches_piste."clientId" = "Client"."id"${stationFilter})`), filters.sortOrder || 'DESC']],
      revenue: [[literal(`(SELECT COALESCE(SUM("montantTotal"), 0) FROM factures WHERE factures."clientId" = "Client"."id"${stationFilter})`), filters.sortOrder || 'DESC']],
      lastVisit: [[literal(`(SELECT MAX(date) FROM fiches_piste WHERE fiches_piste."clientId" = "Client"."id"${stationFilter})`), filters.sortOrder || 'DESC']],
    };
    const order = sortMap[filters.sortBy || 'lastVisit'] || sortMap.lastVisit;

    const { rows: data, count: total } = await this.clientModel.findAndCountAll({
      where,
      attributes,
      order,
      limit,
      offset,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── CSV Export ───────────────────────────────────────────────────

  async exportClients(filters: {
    search?: string;
    segment?: string;
    stationId?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<string> {
    const result = await this.getClients({
      ...filters,
      page: 1,
      limit: 100000, // no practical limit
    });

    const header = 'Nom;Contact;Email;Points Fid\u00e9lit\u00e9;V\u00e9hicules;Visites;D\u00e9penses Totales;Derni\u00e8re Visite';
    const rows = result.data.map((c: any) => {
      const row = [
        c.nom || '',
        c.contact || '',
        c.email || '',
        c.pointsFidelite ?? 0,
        c.getDataValue('vehicleCount') ?? 0,
        c.getDataValue('totalVisits') ?? 0,
        c.getDataValue('totalSpent') ?? 0,
        c.getDataValue('lastVisitDate') || 'Jamais',
      ];
      return row.join(';');
    });

    return '\uFEFF' + [header, ...rows].join('\n');
  }

  // ─── Prospects Pipeline ───────────────────────────────────────────

  async getProspects(stationId?: number) {
    const stationWhere: any = stationId ? { stationId } : {};
    const today = this.todayStr();

    const [totalPending, confirmedToday, totalAll, recent] = await Promise.all([
      this.registrationModel.count({
        where: { ...stationWhere, confirmed: false },
      }),
      this.registrationModel.count({
        where: { ...stationWhere, confirmed: true, date: today },
      }),
      this.registrationModel.count({ where: stationWhere }),
      this.registrationModel.findAll({
        where: { ...stationWhere, confirmed: false },
        order: [['createdAt', 'DESC']],
        limit: 50,
        attributes: [
          'id',
          'immatriculation',
          'prospectNom',
          'prospectTelephone',
          'date',
          'confirmed',
        ],
      }),
    ]);

    const conversionRate =
      totalAll > 0
        ? Math.round(((totalAll - totalPending) / totalAll) * 100)
        : 0;

    return {
      totalPending,
      confirmedToday,
      conversionRate,
      recent,
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // SMS TEMPLATES
  // ═══════════════════════════════════════════════════════════════════

  async getTemplates(stationId?: number) {
    const where: any = {};
    if (stationId) where[Op.or as any] = [{ stationId }, { stationId: null }];
    return this.templateModel.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
  }

  async createTemplate(
    dto: { nom: string; contenu: string },
    userId: number,
    stationId?: number,
  ) {
    return this.templateModel.create({
      nom: dto.nom,
      contenu: dto.contenu,
      createdBy: userId,
      stationId: stationId ?? null,
    } as any);
  }

  async updateTemplate(id: number, dto: { nom?: string; contenu?: string }) {
    const template = await this.templateModel.findByPk(id);
    if (!template) throw new NotFoundException(`Template #${id} introuvable`);
    if (dto.nom !== undefined) template.nom = dto.nom;
    if (dto.contenu !== undefined) template.contenu = dto.contenu;
    await template.save();
    return template;
  }

  async deleteTemplate(id: number) {
    const template = await this.templateModel.findByPk(id);
    if (!template) throw new NotFoundException(`Template #${id} introuvable`);
    await template.destroy();
  }

  // ═══════════════════════════════════════════════════════════════════
  // CAMPAIGNS
  // ═══════════════════════════════════════════════════════════════════

  async getCampaigns(stationId?: number, page = 1, limit = 20) {
    const where: any = {};
    if (stationId) where.stationId = stationId;
    const offset = (page - 1) * limit;

    const { rows: data, count: total } =
      await this.campaignModel.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        include: [{ model: SmsTemplate, attributes: ['id', 'nom'] }],
      });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getCampaign(id: number) {
    const campaign = await this.campaignModel.findByPk(id, {
      include: [
        { model: SmsTemplate, attributes: ['id', 'nom'] },
        {
          model: CampaignRecipient,
          include: [{ model: Client, attributes: ['id', 'nom', 'contact'] }],
        },
      ],
    });
    if (!campaign) throw new NotFoundException(`Campagne #${id} introuvable`);
    return campaign;
  }

  async createCampaign(
    dto: {
      nom: string;
      templateId?: number;
      customMessage?: string;
      segment?: string;
      filters?: Record<string, any>;
    },
    userId: number,
    stationId?: number,
  ) {
    // Resolve message
    let message = dto.customMessage || '';
    if (dto.templateId) {
      const template = await this.templateModel.findByPk(dto.templateId);
      if (template) message = template.contenu;
    }
    if (!message) {
      throw new NotFoundException('Aucun message défini');
    }

    // Get targeted clients (with phone numbers)
    const result = await this.getClients({
      segment: dto.segment,
      stationId,
      page: 1,
      limit: 100000,
    });

    const clientsWithPhone = result.data.filter(
      (c: any) => c.contact && c.contact.trim(),
    );

    // Create campaign
    const campaign = await this.campaignModel.create({
      nom: dto.nom,
      message,
      templateId: dto.templateId ?? null,
      segment: dto.segment ?? null,
      filters: dto.filters ?? null,
      totalRecipients: clientsWithPhone.length,
      status: CampaignStatus.Draft,
      stationId: stationId ?? null,
      createdBy: userId,
    } as any);

    // Create recipients
    if (clientsWithPhone.length > 0) {
      await this.recipientModel.bulkCreate(
        clientsWithPhone.map((c: any) => ({
          campaignId: campaign.id,
          clientId: c.id,
          telephone: c.contact.trim(),
          status: RecipientStatus.Pending,
        })),
      );
    }

    return this.getCampaign(campaign.id);
  }

  async sendCampaign(id: number) {
    const campaign = await this.campaignModel.findByPk(id);
    if (!campaign) throw new NotFoundException(`Campagne #${id} introuvable`);

    campaign.status = CampaignStatus.Sending;
    await campaign.save();

    const recipients = await this.recipientModel.findAll({
      where: { campaignId: id, status: RecipientStatus.Pending },
      include: [{ model: Client, attributes: ['id', 'nom', 'pointsFidelite'] }],
    });

    // Get station name for variable substitution
    let stationName = '';
    if (campaign.stationId) {
      const station = await this.stationModel.findByPk(campaign.stationId);
      stationName = station?.nom ?? '';
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      // Substitute variables
      let personalizedMessage = campaign.message
        .replace(/\{nom\}/g, recipient.client?.nom ?? '')
        .replace(/\{points\}/g, String(recipient.client?.pointsFidelite ?? 0))
        .replace(/\{station\}/g, stationName);

      const result = await this.smsService.send(
        recipient.telephone,
        personalizedMessage,
      );

      if (result.success) {
        recipient.status = RecipientStatus.Sent;
        recipient.sentAt = new Date();
        sentCount++;
      } else {
        recipient.status = RecipientStatus.Failed;
        recipient.error = result.error ?? 'Erreur inconnue';
        failedCount++;
      }
      await recipient.save();
    }

    campaign.sentCount = sentCount;
    campaign.failedCount = failedCount;
    campaign.status =
      failedCount === recipients.length && recipients.length > 0
        ? CampaignStatus.Failed
        : CampaignStatus.Sent;
    await campaign.save();

    return this.getCampaign(id);
  }

  // ═══════════════════════════════════════════════════════════════════
  // PROMOTIONS
  // ═══════════════════════════════════════════════════════════════════

  async createPromotion(dto: CreatePromotionDto, userId: number, stationId?: number) {
    const { washTypeIds, ...promoData } = dto;

    const promotion = await this.promotionModel.create({
      ...promoData,
      stationId: dto.stationId ?? stationId ?? null,
      createdBy: userId,
    } as any);

    if (washTypeIds && washTypeIds.length > 0) {
      await this.promotionWashTypeModel.bulkCreate(
        washTypeIds.map((typeLavageId) => ({
          promotionId: promotion.id,
          typeLavageId,
        })),
      );
    }

    return this.getPromotion(promotion.id);
  }

  async getPromotions(stationId?: number, isActive?: boolean) {
    const where: any = {};
    if (stationId) {
      where[Op.or as any] = [{ stationId }, { stationId: null }];
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.promotionModel.findAll({
      where,
      include: [
        { model: TypeLavage, attributes: ['id', 'nom', 'prixBase'] },
        { model: ServiceSpecial, attributes: ['id', 'nom', 'prix'] },
        { model: Station, attributes: ['id', 'nom'] },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  async getPromotion(id: number) {
    const promotion = await this.promotionModel.findByPk(id, {
      include: [
        { model: TypeLavage, attributes: ['id', 'nom', 'prixBase'] },
        { model: ServiceSpecial, attributes: ['id', 'nom', 'prix'] },
        { model: Station, attributes: ['id', 'nom'] },
        { model: User, as: 'creator', attributes: ['id', 'nom', 'prenom'] },
      ],
    });
    if (!promotion) throw new NotFoundException(`Promotion #${id} introuvable`);
    return promotion;
  }

  async updatePromotion(id: number, dto: UpdatePromotionDto) {
    const promotion = await this.promotionModel.findByPk(id);
    if (!promotion) throw new NotFoundException(`Promotion #${id} introuvable`);

    const { washTypeIds, ...updateData } = dto;
    await promotion.update(updateData);

    if (washTypeIds !== undefined) {
      await this.promotionWashTypeModel.destroy({
        where: { promotionId: id },
      });
      if (washTypeIds.length > 0) {
        await this.promotionWashTypeModel.bulkCreate(
          washTypeIds.map((typeLavageId) => ({
            promotionId: id,
            typeLavageId,
          })),
        );
      }
    }

    return this.getPromotion(id);
  }

  async togglePromotion(id: number) {
    const promotion = await this.promotionModel.findByPk(id);
    if (!promotion) throw new NotFoundException(`Promotion #${id} introuvable`);
    await promotion.update({ isActive: !promotion.isActive });
    return this.getPromotion(id);
  }

  async getApplicablePromotions(
    clientId: number,
    typeLavageId: number,
    stationId: number,
    extrasIds?: number[],
  ) {
    const today = this.todayStr();

    // 1. Count client visits
    const visitCount = await this.fichePisteModel.count({
      where: { clientId },
    });

    // 2. Find active promotions matching date range, station, and min visits
    const where: any = {
      isActive: true,
      startDate: { [Op.lte]: today },
      endDate: { [Op.gte]: today },
      minVisits: { [Op.lte]: visitCount },
      [Op.or as any]: [{ stationId }, { stationId: null }],
    };

    const promotions = await this.promotionModel.findAll({
      where,
      include: [
        { model: TypeLavage, attributes: ['id', 'nom', 'prixBase'] },
        { model: ServiceSpecial, attributes: ['id', 'nom', 'prix'] },
      ],
    });

    // 3. Filter: promo must target the selected wash type, and usedCount < maxUses
    const typeLavage = await this.typeLavageModel.findByPk(typeLavageId);
    const prixBase = Number(typeLavage?.prixBase ?? 0);

    let extrasPrix = 0;
    if (extrasIds && extrasIds.length > 0) {
      const extras = await this.serviceSpecialModel.findAll({
        where: { id: { [Op.in]: extrasIds } },
      });
      extrasPrix = extras.reduce((sum, e) => sum + Number(e.prix), 0);
    }
    const totalPrice = prixBase + extrasPrix;

    const applicable: {
      promotion: MarketingPromotion;
      effectiveDiscount: number;
      visitCount: number;
    }[] = [];

    for (const promo of promotions) {
      // Check usage limit
      if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) continue;

      // Check wash type match
      const washTypeIds = promo.washTypes?.map((wt) => wt.id) ?? [];
      if (!washTypeIds.includes(typeLavageId)) continue;

      // Compute effective discount
      let effectiveDiscount = 0;

      if (promo.type === PromotionType.Discount) {
        if (promo.discountType === DiscountType.Percentage) {
          effectiveDiscount = Math.round(totalPrice * Number(promo.discountValue) / 100);
        } else {
          effectiveDiscount = Number(promo.discountValue ?? 0);
        }
        // Cap discount at total price
        effectiveDiscount = Math.min(effectiveDiscount, totalPrice);
      }
      // service_offert: effectiveDiscount stays 0 — it's a free add-on, not a price reduction

      applicable.push({ promotion: promo, effectiveDiscount, visitCount });
    }

    // 4. Sort by biggest discount first
    applicable.sort((a, b) => b.effectiveDiscount - a.effectiveDiscount);

    return applicable;
  }
}
