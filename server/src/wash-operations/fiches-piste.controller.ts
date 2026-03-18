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
import { CreateFichePisteDto } from './dto/create-fiche-piste.dto.js';
import { UpdateFichePisteDto } from './dto/update-fiche-piste.dto.js';
import { CreateNouveauLavageDto } from './dto/create-nouveau-lavage.dto.js';
import { FichePisteStatus } from '../common/constants/status.enum.js';

@ApiTags('Fiches de Piste')
@ApiBearerAuth()
@Controller('fiches-piste')
export class FichesPisteController {
  constructor(private readonly washOpsService: WashOperationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les fiches de piste avec filtres et pagination',
  })
  @ApiQuery({
    name: 'stationId',
    required: false,
    type: Number,
    description: 'Filtrer par station',
  })
  @ApiQuery({
    name: 'clientId',
    required: false,
    type: Number,
    description: 'Filtrer par client',
  })
  @ApiQuery({
    name: 'controleurId',
    required: false,
    type: Number,
    description: 'Filtrer par contrôleur',
  })
  @ApiQuery({
    name: 'statut',
    required: false,
    enum: FichePisteStatus,
    description: 'Filtrer par statut',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: 'Filtrer par date (YYYY-MM-DD)',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Date début (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Date fin (YYYY-MM-DD)' })
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
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des fiches de piste',
  })
  async findAll(
    @Query('stationId') stationId?: number,
    @Query('clientId') clientId?: number,
    @Query('controleurId') controleurId?: number,
    @Query('statut') statut?: FichePisteStatus,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.washOpsService.findAllFiches({
      stationId,
      clientId,
      controleurId,
      statut,
      date,
      startDate,
      endDate,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une fiche de piste par ID' })
  @ApiResponse({ status: 200, description: 'Détails de la fiche de piste' })
  @ApiResponse({ status: 404, description: 'Fiche de piste introuvable' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.washOpsService.findOneFiche(id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle fiche de piste (standalone)' })
  @ApiResponse({
    status: 201,
    description: 'Fiche de piste créée avec succès',
  })
  async create(@Body() dto: CreateFichePisteDto) {
    return this.washOpsService.createFiche(dto);
  }

  @Post('nouveau-lavage')
  @ApiOperation({
    summary:
      'Nouveau Lavage — crée une fiche de piste + coupon en une seule opération',
  })
  @ApiResponse({
    status: 201,
    description: 'Fiche de piste et coupon créés avec succès',
  })
  async createNouveauLavage(@Body() dto: CreateNouveauLavageDto) {
    return this.washOpsService.createNouveauLavage(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une fiche de piste' })
  @ApiResponse({
    status: 200,
    description: 'Fiche de piste mise à jour avec succès',
  })
  @ApiResponse({ status: 404, description: 'Fiche de piste introuvable' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFichePisteDto,
  ) {
    return this.washOpsService.updateFiche(id, dto);
  }
}
