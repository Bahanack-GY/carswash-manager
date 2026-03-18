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
import { ReservationsService } from './reservations.service.js';
import { CreateReservationDto } from './dto/create-reservation.dto.js';
import { UpdateReservationDto } from './dto/update-reservation.dto.js';
import { ReservationStatus } from '../common/constants/status.enum.js';

@ApiTags('Reservations')
@ApiBearerAuth()
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les réservations avec filtres et pagination' })
  @ApiQuery({ name: 'stationId', required: false, type: Number, description: 'Filtrer par station' })
  @ApiQuery({ name: 'statut', required: false, enum: ReservationStatus, description: 'Filtrer par statut' })
  @ApiQuery({ name: 'date', required: false, type: String, description: 'Filtrer par date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre de résultats par page' })
  @ApiResponse({ status: 200, description: 'Liste paginée des réservations' })
  async findAll(
    @Query('stationId') stationId?: number,
    @Query('statut') statut?: ReservationStatus,
    @Query('date') date?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reservationsService.findAll({ stationId, statut, date, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une réservation par ID' })
  @ApiResponse({ status: 200, description: 'Détails de la réservation' })
  @ApiResponse({ status: 404, description: 'Réservation introuvable' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle réservation' })
  @ApiResponse({ status: 201, description: 'Réservation créée avec succès' })
  async create(@Body() createReservationDto: CreateReservationDto) {
    return this.reservationsService.create(createReservationDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une réservation' })
  @ApiResponse({ status: 200, description: 'Réservation mise à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Réservation introuvable' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReservationDto: UpdateReservationDto,
  ) {
    return this.reservationsService.update(id, updateReservationDto);
  }
}
