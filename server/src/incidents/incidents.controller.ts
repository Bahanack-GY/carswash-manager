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
import { IncidentsService } from './incidents.service.js';
import { CreateIncidentDto } from './dto/create-incident.dto.js';
import { UpdateIncidentDto } from './dto/update-incident.dto.js';
import { IncidentStatus, IncidentSeverity } from '../common/constants/status.enum.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../common/constants/roles.enum.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Incidents')
@ApiBearerAuth()
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get('active-by-station')
  @ApiOperation({ summary: 'Récupérer le statut des incidents actifs par station' })
  @ApiResponse({
    status: 200,
    description: 'Map des stations avec leurs incidents actifs',
  })
  async getActiveByStation() {
    return this.incidentsService.getActiveByStation();
  }

  @Get()
  @ApiOperation({ summary: 'Lister les incidents avec filtres et pagination' })
  @ApiQuery({ name: 'stationId', required: false, type: Number, description: 'Filtrer par station' })
  @ApiQuery({ name: 'statut', required: false, enum: IncidentStatus, description: 'Filtrer par statut' })
  @ApiQuery({ name: 'severity', required: false, enum: IncidentSeverity, description: 'Filtrer par sévérité' })
  @ApiQuery({ name: 'stopsActivity', required: false, type: Boolean, description: 'Filtrer par arrêt d\'activité' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre de résultats par page' })
  @ApiResponse({ status: 200, description: 'Liste paginée des incidents' })
  async findAll(
    @Query('stationId') stationId?: number,
    @Query('statut') statut?: IncidentStatus,
    @Query('severity') severity?: IncidentSeverity,
    @Query('stopsActivity') stopsActivity?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.incidentsService.findAll({
      stationId,
      statut,
      severity,
      stopsActivity: stopsActivity !== undefined ? stopsActivity === 'true' : undefined,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un incident par ID' })
  @ApiResponse({ status: 200, description: "Détails de l'incident" })
  @ApiResponse({ status: 404, description: 'Incident introuvable' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.incidentsService.findOne(id);
  }

  @Post()
  @Roles(Role.SuperAdmin, Role.Manager)
  @ApiOperation({ summary: 'Déclarer un nouvel incident' })
  @ApiResponse({ status: 201, description: 'Incident créé avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  async create(
    @Body() createIncidentDto: CreateIncidentDto,
    @CurrentUser('id') currentUserId: number,
  ) {
    return this.incidentsService.create(createIncidentDto, currentUserId);
  }

  @Patch(':id')
  @Roles(Role.SuperAdmin, Role.Manager)
  @ApiOperation({ summary: 'Mettre à jour un incident' })
  @ApiResponse({ status: 200, description: 'Incident mis à jour avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Incident introuvable' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateIncidentDto: UpdateIncidentDto,
  ) {
    return this.incidentsService.update(id, updateIncidentDto);
  }
}
