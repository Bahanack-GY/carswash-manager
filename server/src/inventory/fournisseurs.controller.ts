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
import { InventoryService } from './inventory.service.js';
import { CreateFournisseurDto } from './dto/create-fournisseur.dto.js';
import { UpdateFournisseurDto } from './dto/update-fournisseur.dto.js';

@ApiTags('Fournisseurs')
@ApiBearerAuth()
@Controller('fournisseurs')
export class FournisseursController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les fournisseurs avec filtres et pagination',
  })
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
  @ApiResponse({ status: 200, description: 'Liste paginée des fournisseurs' })
  async findAll(
    @Query('stationId') stationId?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.inventoryService.findAllFournisseurs({
      stationId,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un fournisseur par ID' })
  @ApiResponse({ status: 200, description: 'Détails du fournisseur' })
  @ApiResponse({ status: 404, description: 'Fournisseur introuvable' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.findOneFournisseur(id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau fournisseur' })
  @ApiResponse({ status: 201, description: 'Fournisseur créé avec succès' })
  async create(@Body() dto: CreateFournisseurDto) {
    return this.inventoryService.createFournisseur(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un fournisseur' })
  @ApiResponse({
    status: 200,
    description: 'Fournisseur mis à jour avec succès',
  })
  @ApiResponse({ status: 404, description: 'Fournisseur introuvable' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFournisseurDto,
  ) {
    return this.inventoryService.updateFournisseur(id, dto);
  }
}
