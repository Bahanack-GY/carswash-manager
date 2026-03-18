import {
  Controller,
  Get,
  Post,
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
import { BillingService } from './billing.service.js';
import { CreateFactureDto } from './dto/create-facture.dto.js';

@ApiTags('Factures')
@ApiBearerAuth()
@Controller('factures')
export class FacturesController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les factures avec filtres et pagination' })
  @ApiQuery({
    name: 'stationId',
    required: false,
    type: Number,
    description: 'Filtrer par station',
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
  @ApiResponse({ status: 200, description: 'Liste paginée des factures' })
  async findAll(
    @Query('stationId') stationId?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.billingService.findAllFactures({ stationId, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une facture par ID' })
  @ApiResponse({ status: 200, description: 'Détails de la facture' })
  @ApiResponse({ status: 404, description: 'Facture introuvable' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.billingService.findOneFacture(id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle facture' })
  @ApiResponse({ status: 201, description: 'Facture créée avec succès' })
  async create(@Body() dto: CreateFactureDto) {
    return this.billingService.createFacture(dto);
  }
}
