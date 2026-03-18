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
import { ClientsService } from './clients.service.js';
import { CreateClientDto } from './dto/create-client.dto.js';
import { UpdateClientDto } from './dto/update-client.dto.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { CreateSubscriptionDto } from './dto/create-subscription.dto.js';

@ApiTags('Clients')
@ApiBearerAuth()
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les clients avec recherche et pagination' })
  @ApiQuery({ name: 'search', required: false, description: 'Recherche par nom, contact ou email' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre de résultats par page' })
  @ApiQuery({ name: 'stationId', required: false, type: Number, description: 'Filtrer par station' })
  @ApiQuery({ name: 'vehicleType', required: false, description: 'Filtrer par type de véhicule' })
  @ApiQuery({ name: 'contact', required: false, description: 'Filtrer par numéro de téléphone' })
  @ApiQuery({ name: 'quartier', required: false, description: 'Filtrer par quartier' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Date de création minimum (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Date de création maximum (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Liste paginée des clients' })
  async findAll(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('stationId') stationId?: number,
    @Query('vehicleType') vehicleType?: string,
    @Query('contact') contact?: string,
    @Query('quartier') quartier?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.clientsService.findAll({ search, page, limit, stationId, vehicleType, contact, quartier, dateFrom, dateTo });
  }

  @Get('vehicles/search')
  @ApiOperation({ summary: 'Rechercher un véhicule par immatriculation' })
  @ApiQuery({ name: 'immatriculation', required: true, description: 'Numéro de plaque du véhicule' })
  @ApiResponse({ status: 200, description: 'Véhicule trouvé avec son client' })
  async findVehicleByPlate(@Query('immatriculation') immatriculation: string) {
    return this.clientsService.findVehicleByPlate(immatriculation);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un client avec ses véhicules et abonnements' })
  @ApiResponse({ status: 200, description: 'Détails du client' })
  @ApiResponse({ status: 404, description: 'Client introuvable' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau client' })
  @ApiResponse({ status: 201, description: 'Client créé avec succès' })
  async create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un client' })
  @ApiResponse({ status: 200, description: 'Client mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Client introuvable' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(id, updateClientDto);
  }

  @Get(':id/vehicles')
  @ApiOperation({ summary: 'Lister les véhicules d\'un client' })
  @ApiResponse({ status: 200, description: 'Liste des véhicules du client' })
  @ApiResponse({ status: 404, description: 'Client introuvable' })
  async getVehicles(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.getVehicles(id);
  }

  @Post(':id/vehicles')
  @ApiOperation({ summary: 'Ajouter un véhicule à un client' })
  @ApiResponse({ status: 201, description: 'Véhicule ajouté avec succès' })
  @ApiResponse({ status: 404, description: 'Client introuvable' })
  async createVehicle(
    @Param('id', ParseIntPipe) id: number,
    @Body() createVehicleDto: CreateVehicleDto,
  ) {
    return this.clientsService.createVehicle(id, createVehicleDto);
  }

  @Post(':id/subscriptions')
  @ApiOperation({ summary: 'Créer un abonnement pour un client' })
  @ApiResponse({ status: 201, description: 'Abonnement créé avec succès' })
  @ApiResponse({ status: 404, description: 'Client introuvable' })
  async createSubscription(
    @Param('id', ParseIntPipe) id: number,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    return this.clientsService.createSubscription(id, createSubscriptionDto);
  }
}
