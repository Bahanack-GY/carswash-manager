import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { StationsService } from './stations.service.js';
import { CreateStationDto } from './dto/create-station.dto.js';
import { UpdateStationDto } from './dto/update-station.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '../common/constants/roles.enum.js';

@ApiTags('Stations')
@ApiBearerAuth()
@Controller('stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister toutes les stations' })
  @ApiResponse({
    status: 200,
    description: 'Liste des stations avec le nombre d\'employés actifs',
  })
  async findAll(@CurrentUser() user: any) {
    if (user.role === Role.SuperAdmin) {
      return this.stationsService.findAll();
    }
    return this.stationsService.findAll(user.stationIds);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une station par ID' })
  @ApiResponse({ status: 200, description: 'Détails de la station' })
  @ApiResponse({ status: 404, description: 'Station introuvable' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.stationsService.findOne(id);
  }

  @Post()
  @Roles(Role.SuperAdmin)
  @ApiOperation({ summary: 'Créer une nouvelle station (SuperAdmin uniquement)' })
  @ApiResponse({ status: 201, description: 'Station créée avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  async create(@Body() createStationDto: CreateStationDto) {
    return this.stationsService.create(createStationDto);
  }

  @Patch(':id')
  @Roles(Role.SuperAdmin)
  @ApiOperation({ summary: 'Mettre à jour une station (SuperAdmin uniquement)' })
  @ApiResponse({ status: 200, description: 'Station mise à jour avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Station introuvable' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStationDto: UpdateStationDto,
  ) {
    return this.stationsService.update(id, updateStationDto);
  }
}
