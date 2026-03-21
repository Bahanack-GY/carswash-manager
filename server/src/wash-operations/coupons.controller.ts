import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WashOperationsService } from './wash-operations.service.js';
import { AuditService } from '../audit/audit.service.js';
import { CreateCouponDto } from './dto/create-coupon.dto.js';
import { UpdateCouponStatusDto } from './dto/update-coupon-status.dto.js';
import { AssignWashersDto } from './dto/assign-washers.dto.js';
import { AddServicesToCouponDto } from './dto/add-services-to-coupon.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CouponStatus } from '../common/constants/status.enum.js';

@ApiTags('Coupons')
@ApiBearerAuth()
@Controller('coupons')
export class CouponsController {
  constructor(
    private readonly washOpsService: WashOperationsService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les coupons avec filtres et pagination',
  })
  @ApiQuery({
    name: 'stationId',
    required: false,
    type: Number,
    description: 'Filtrer par station',
  })
  @ApiQuery({
    name: 'statut',
    required: false,
    enum: CouponStatus,
    description: 'Filtrer par statut',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Numéro de page',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Nombre de résultats par page',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Date début (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Date fin (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Liste paginée des coupons' })
  async findAll(
    @Query('stationId') stationId?: number,
    @Query('statut') statut?: CouponStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.washOpsService.findAllCoupons({
      stationId,
      statut,
      page,
      limit,
      startDate,
      endDate,
    });
  }

  @Get('my-assigned')
  @ApiOperation({
    summary: 'Récupérer les coupons assignés à l\'utilisateur connecté',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des coupons assignés au laveur',
  })
  async findMyAssigned(@CurrentUser() user: any) {
    return this.washOpsService.findMyAssigned(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un coupon par ID' })
  @ApiResponse({ status: 200, description: 'Détails du coupon' })
  @ApiResponse({ status: 404, description: 'Coupon introuvable' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.washOpsService.findOneCoupon(id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau coupon' })
  @ApiResponse({ status: 201, description: 'Coupon créé avec succès' })
  async create(@Body() dto: CreateCouponDto) {
    return this.washOpsService.createCoupon(dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Mettre à jour le statut d\'un coupon' })
  @ApiResponse({
    status: 200,
    description: 'Statut du coupon mis à jour avec succès',
  })
  @ApiResponse({ status: 404, description: 'Coupon introuvable' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCouponStatusDto,
  ) {
    return this.washOpsService.updateCouponStatus(id, dto);
  }

  @Patch(':id/washers')
  @ApiOperation({ summary: 'Assigner des laveurs à un coupon' })
  @ApiResponse({ status: 200, description: 'Laveurs assignés avec succès' })
  @ApiResponse({ status: 404, description: 'Coupon introuvable' })
  async assignWashers(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignWashersDto,
  ) {
    return this.washOpsService.assignWashers(id, dto);
  }

  @Patch(':id/services')
  @ApiOperation({ summary: 'Ajouter des services à un coupon en cours de lavage' })
  @ApiResponse({ status: 200, description: 'Services ajoutés avec succès' })
  @ApiResponse({ status: 404, description: 'Coupon introuvable ou non en cours de lavage' })
  async addServices(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddServicesToCouponDto,
  ) {
    return this.washOpsService.addServicesToCoupon(id, dto);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Historique des modifications d\'un coupon' })
  @ApiResponse({ status: 200, description: 'Historique des modifications' })
  async getHistory(@Param('id', ParseIntPipe) id: number) {
    return this.auditService.findAll({ entity: 'Coupon', entityId: String(id), limit: 50 });
  }
}
