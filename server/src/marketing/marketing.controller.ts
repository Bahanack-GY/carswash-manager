import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Param,
  Body,
  Res,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MarketingService } from './marketing.service.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../common/constants/roles.enum.js';
import { CurrentStation } from '../common/decorators/current-station.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  CreateCampaignDto,
} from './dto/campaign.dto.js';
import { CreatePromotionDto, UpdatePromotionDto } from './dto/promotion.dto.js';

@ApiTags('Marketing')
@ApiBearerAuth()
@Controller('marketing')
@Roles(Role.SuperAdmin, Role.Manager)
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get('insights')
  @ApiOperation({ summary: 'KPIs marketing (clients, revenus, conversions)' })
  async getInsights(@CurrentStation() stationId?: number) {
    return this.marketingService.getInsights(stationId);
  }

  @Get('segments')
  @ApiOperation({ summary: 'Segments clients intelligents avec compteurs' })
  async getSegments(@CurrentStation() stationId?: number) {
    return this.marketingService.getSegments(stationId);
  }

  @Get('clients')
  @ApiOperation({ summary: 'Liste enrichie des clients avec filtres et tri' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'segment', required: false })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['nom', 'visits', 'revenue', 'lastVisit'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getClients(
    @CurrentStation() stationId: number | undefined,
    @Query('search') search?: string,
    @Query('segment') segment?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketingService.getClients({
      search,
      segment,
      stationId,
      sortBy,
      sortOrder,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('export')
  @ApiOperation({ summary: 'Exporter les clients en CSV' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'segment', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  async exportClients(
    @CurrentStation() stationId: number | undefined,
    @Res() res: any,
    @Query('search') search?: string,
    @Query('segment') segment?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    const csv = await this.marketingService.exportClients({
      search,
      segment,
      stationId,
      sortBy,
      sortOrder,
    });

    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="clients-marketing.csv"',
    });
    res.send(csv);
  }

  @Get('prospects')
  @ApiOperation({ summary: 'Pipeline des prospects commerciaux' })
  async getProspects(@CurrentStation() stationId?: number) {
    return this.marketingService.getProspects(stationId);
  }

  // ═══ SMS Templates ═══════════════════════════════════════════════

  @Get('templates')
  @ApiOperation({ summary: 'Liste des templates SMS' })
  async getTemplates(@CurrentStation() stationId?: number) {
    return this.marketingService.getTemplates(stationId);
  }

  @Post('templates')
  @ApiOperation({ summary: 'Créer un template SMS' })
  async createTemplate(
    @Body() dto: CreateTemplateDto,
    @CurrentUser('id') userId: number,
    @CurrentStation() stationId?: number,
  ) {
    return this.marketingService.createTemplate(dto, userId, stationId);
  }

  @Patch('templates/:id')
  @ApiOperation({ summary: 'Modifier un template SMS' })
  async updateTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.marketingService.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Supprimer un template SMS' })
  async deleteTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.marketingService.deleteTemplate(id);
  }

  // ═══ Campaigns ═══════════════════════════════════════════════════

  @Get('campaigns')
  @ApiOperation({ summary: 'Liste des campagnes SMS' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getCampaigns(
    @CurrentStation() stationId: number | undefined,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketingService.getCampaigns(
      stationId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get('campaigns/:id')
  @ApiOperation({ summary: 'Détail d\'une campagne SMS' })
  async getCampaign(@Param('id', ParseIntPipe) id: number) {
    return this.marketingService.getCampaign(id);
  }

  @Post('campaigns')
  @ApiOperation({ summary: 'Créer une campagne SMS' })
  async createCampaign(
    @Body() dto: CreateCampaignDto,
    @CurrentUser('id') userId: number,
    @CurrentStation() stationId?: number,
  ) {
    return this.marketingService.createCampaign(dto, userId, stationId);
  }

  @Post('campaigns/:id/send')
  @ApiOperation({ summary: 'Envoyer une campagne SMS' })
  async sendCampaign(@Param('id', ParseIntPipe) id: number) {
    return this.marketingService.sendCampaign(id);
  }

  // ═══ Promotions ═══════════════════════════════════════════════════

  @Get('promotions')
  @ApiOperation({ summary: 'Liste des promotions' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async getPromotions(
    @CurrentStation() stationId: number | undefined,
    @Query('isActive') isActive?: string,
  ) {
    return this.marketingService.getPromotions(
      stationId,
      isActive !== undefined ? isActive === 'true' : undefined,
    );
  }

  @Get('promotions/applicable')
  @ApiOperation({ summary: 'Promotions applicables pour un client et type de lavage' })
  @ApiQuery({ name: 'clientId', required: true, type: Number })
  @ApiQuery({ name: 'typeLavageId', required: true, type: Number })
  @ApiQuery({ name: 'stationId', required: true, type: Number })
  @ApiQuery({ name: 'extrasIds', required: false })
  async getApplicablePromotions(
    @Query('clientId') clientId: string,
    @Query('typeLavageId') typeLavageId: string,
    @Query('stationId') stationId: string,
    @Query('extrasIds') extrasIds?: string,
  ) {
    const parsedExtras = extrasIds
      ? extrasIds.split(',').map((id) => parseInt(id, 10)).filter((id) => !isNaN(id))
      : undefined;

    return this.marketingService.getApplicablePromotions(
      parseInt(clientId, 10),
      parseInt(typeLavageId, 10),
      parseInt(stationId, 10),
      parsedExtras,
    );
  }

  @Get('promotions/:id')
  @ApiOperation({ summary: 'Détail d\'une promotion' })
  async getPromotion(@Param('id', ParseIntPipe) id: number) {
    return this.marketingService.getPromotion(id);
  }

  @Post('promotions')
  @ApiOperation({ summary: 'Créer une promotion' })
  async createPromotion(
    @Body() dto: CreatePromotionDto,
    @CurrentUser('id') userId: number,
    @CurrentStation() stationId?: number,
  ) {
    return this.marketingService.createPromotion(dto, userId, stationId);
  }

  @Patch('promotions/:id')
  @ApiOperation({ summary: 'Modifier une promotion' })
  async updatePromotion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePromotionDto,
  ) {
    return this.marketingService.updatePromotion(id, dto);
  }

  @Patch('promotions/:id/toggle')
  @ApiOperation({ summary: 'Activer/désactiver une promotion' })
  async togglePromotion(@Param('id', ParseIntPipe) id: number) {
    return this.marketingService.togglePromotion(id);
  }
}
