import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../common/constants/roles.enum.js';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'KPIs de la station (revenu, véhicules, lavages actifs, réservations)' })
  @ApiQuery({ name: 'stationId', required: true, type: Number, description: 'ID de la station' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Date début (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Date fin (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'KPIs de la station' })
  async getStats(
    @Query('stationId', ParseIntPipe) stationId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const range = this.dashboardService.parseDateRange(startDate, endDate);
    return this.dashboardService.getStats(stationId, range);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Revenus pour le graphique sur la période' })
  @ApiQuery({ name: 'stationId', required: true, type: Number, description: 'ID de la station' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Date début (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Date fin (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Données de revenus sur la période' })
  async getRevenue(
    @Query('stationId', ParseIntPipe) stationId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const range = this.dashboardService.parseDateRange(startDate, endDate);
    return this.dashboardService.getRevenue(stationId, range);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Flux d\'activité récente (10 derniers événements)' })
  @ApiQuery({ name: 'stationId', required: true, type: Number, description: 'ID de la station' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Date début (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Date fin (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Liste des activités récentes' })
  async getActivity(
    @Query('stationId', ParseIntPipe) stationId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const range = this.dashboardService.parseDateRange(startDate, endDate);
    return this.dashboardService.getActivity(stationId, range);
  }

  @Get('top-performers')
  @ApiOperation({ summary: 'Top 5 laveurs sur la période' })
  @ApiQuery({ name: 'stationId', required: true, type: Number, description: 'ID de la station' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Date début (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Date fin (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Top 5 des meilleurs performeurs' })
  async getTopPerformers(
    @Query('stationId', ParseIntPipe) stationId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const range = this.dashboardService.parseDateRange(startDate, endDate);
    return this.dashboardService.getTopPerformers(stationId, range);
  }

  @Get('wash-type-distribution')
  @ApiOperation({ summary: 'Distribution des types de lavage sur la période' })
  @ApiQuery({ name: 'stationId', required: true, type: Number, description: 'ID de la station' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Date début (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Date fin (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Distribution par type de lavage' })
  async getWashTypeDistribution(
    @Query('stationId', ParseIntPipe) stationId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const range = this.dashboardService.parseDateRange(startDate, endDate);
    return this.dashboardService.getWashTypeDistribution(stationId, range);
  }

  // ═══ Global (cross-station) endpoints ═══════════════════════════

  @Get('global/stats')
  @Roles(Role.SuperAdmin, Role.Comptable)
  @ApiOperation({ summary: 'KPIs globaux agrégés (toutes stations)' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Date début (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Date fin (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'KPIs globaux' })
  async getGlobalStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const range = this.dashboardService.parseDateRange(startDate, endDate);
    return this.dashboardService.getGlobalStats(range);
  }

  @Get('global/revenue-by-station')
  @Roles(Role.SuperAdmin, Role.Comptable)
  @ApiOperation({ summary: 'Revenus par station sur la période' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Date début (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Date fin (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Revenus par station' })
  async getRevenueByStation(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const range = this.dashboardService.parseDateRange(startDate, endDate);
    return this.dashboardService.getRevenueByStation(range);
  }

  @Get('global/station-ranking')
  @Roles(Role.SuperAdmin, Role.Comptable)
  @ApiOperation({ summary: 'Classement des stations par revenus sur la période' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Date début (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Date fin (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Stations classées par rentabilité' })
  async getStationRanking(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const range = this.dashboardService.parseDateRange(startDate, endDate);
    return this.dashboardService.getStationRanking(range);
  }

  @Get('global/top-performers')
  @Roles(Role.SuperAdmin, Role.Comptable)
  @ApiOperation({ summary: 'Top 10 laveurs globaux sur la période' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Date début (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Date fin (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Meilleurs performers toutes stations' })
  async getGlobalTopPerformers(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const range = this.dashboardService.parseDateRange(startDate, endDate);
    return this.dashboardService.getGlobalTopPerformers(range);
  }

  @Get('global/wash-type-distribution')
  @Roles(Role.SuperAdmin, Role.Comptable)
  @ApiOperation({ summary: 'Distribution globale des types de lavage sur la période' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Date début (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Date fin (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Distribution agrégée par type' })
  async getGlobalWashTypeDistribution(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const range = this.dashboardService.parseDateRange(startDate, endDate);
    return this.dashboardService.getGlobalWashTypeDistribution(range);
  }
}
