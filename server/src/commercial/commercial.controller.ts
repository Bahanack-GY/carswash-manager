import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CurrentStation } from '../common/decorators/current-station.decorator.js';
import { Role } from '../common/constants/roles.enum.js';
import { CommercialService } from './commercial.service.js';
import { RegisterVehicleDto } from './dto/register-vehicle.dto.js';

@ApiTags('Commercial')
@ApiBearerAuth()
@Controller('commercial')
export class CommercialController {
  constructor(private readonly commercialService: CommercialService) {}

  @Post('register')
  @Roles(Role.Commercial)
  @ApiOperation({ summary: 'Enregistrer un véhicule (immatriculation)' })
  @ApiResponse({ status: 201, description: 'Véhicule enregistré avec succès' })
  @ApiResponse({ status: 409, description: 'Véhicule déjà enregistré en attente' })
  async register(
    @CurrentUser('id') commercialId: number,
    @CurrentStation() stationId: number,
    @Body() dto: RegisterVehicleDto,
  ) {
    return this.commercialService.registerVehicle(commercialId, stationId, dto);
  }

  @Get('today')
  @Roles(Role.Commercial)
  @ApiOperation({ summary: "Enregistrements du jour pour le commercial connecté" })
  async getToday(
    @CurrentUser('id') commercialId: number,
    @CurrentStation() stationId: number,
  ) {
    return this.commercialService.getTodayRegistrations(commercialId, stationId);
  }

  @Get('stats')
  @Roles(Role.Commercial)
  @ApiOperation({ summary: 'Statistiques du commercial connecté' })
  async getStats(
    @CurrentUser('id') commercialId: number,
    @CurrentStation() stationId: number,
  ) {
    return this.commercialService.getStats(commercialId, stationId);
  }

  @Get('history')
  @Roles(Role.Commercial)
  @ApiOperation({ summary: 'Historique des enregistrements du commercial connecté' })
  async getHistory(
    @CurrentUser('id') commercialId: number,
    @CurrentStation() stationId: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: 'confirmed' | 'pending',
    @Query('search') search?: string,
  ) {
    return this.commercialService.getHistory(commercialId, stationId, { from, to, status, search });
  }

  @Get('portfolio')
  @Roles(Role.Commercial)
  @ApiOperation({ summary: 'Portefeuille clients du commercial connecté' })
  async getPortfolio(@CurrentUser('id') commercialId: number) {
    return this.commercialService.getPortfolio(commercialId);
  }

  @Post('portfolio/transfer')
  @Roles(Role.SuperAdmin, Role.Manager)
  @ApiOperation({ summary: 'Transférer le portefeuille clients d\'un commercial à un autre' })
  async transferPortfolio(
    @Body() body: { fromCommercialId: number; toCommercialId: number | null },
  ) {
    return this.commercialService.transferPortfolio(body.fromCommercialId, body.toCommercialId);
  }

  @Get('pending')
  @Roles(Role.SuperAdmin, Role.Manager, Role.Controleur)
  @ApiOperation({ summary: 'Prospects en attente de confirmation (vue controleur/manager)' })
  async getPending(@CurrentStation() stationId: number) {
    return this.commercialService.getPendingRegistrations(stationId);
  }

  @Get('commissions')
  @Roles(Role.Commercial)
  @ApiOperation({ summary: 'Commissions gagnées par le commercial connecté' })
  async getMyCommissions(
    @CurrentUser('id') commercialId: number,
    @CurrentStation() stationId: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.commercialService.getCommissions(commercialId, stationId, { from, to });
  }

  @Get('admin/bonus-summary')
  @Roles(Role.SuperAdmin, Role.Manager)
  @ApiOperation({ summary: 'Résumé admin : commissions commerciaux + frais de service laveurs' })
  async getAdminBonusSummary(
    @CurrentStation() stationId: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.commercialService.getAdminBonusSummary(stationId, { from, to });
  }

  @Get(':id/stats')
  @Roles(Role.SuperAdmin, Role.Manager)
  @ApiOperation({ summary: "Stats d'un commercial (vue manager)" })
  async getCommercialStats(
    @Param('id', ParseIntPipe) id: number,
    @CurrentStation() stationId: number,
  ) {
    return this.commercialService.getStats(id, stationId);
  }
}
