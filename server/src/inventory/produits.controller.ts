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
import { CreateProduitDto } from './dto/create-produit.dto.js';
import { UpdateProduitDto } from './dto/update-produit.dto.js';
import { ProductCategory } from '../common/constants/status.enum.js';

@ApiTags('Produits')
@ApiBearerAuth()
@Controller('produits')
export class ProduitsController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les produits avec filtres et pagination',
  })
  @ApiQuery({
    name: 'stationId',
    required: false,
    type: Number,
    description: 'Filtrer par station',
  })
  @ApiQuery({
    name: 'categorie',
    required: false,
    enum: ProductCategory,
    description: 'Filtrer par catégorie',
  })
  @ApiQuery({
    name: 'lowStock',
    required: false,
    type: Boolean,
    description: 'Filtrer les produits en stock bas',
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
  @ApiResponse({ status: 200, description: 'Liste paginée des produits' })
  async findAll(
    @Query('stationId') stationId?: number,
    @Query('categorie') categorie?: ProductCategory,
    @Query('lowStock') lowStock?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.inventoryService.findAllProduits({
      stationId,
      categorie,
      lowStock,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un produit par ID' })
  @ApiResponse({ status: 200, description: 'Détails du produit' })
  @ApiResponse({ status: 404, description: 'Produit introuvable' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.findOneProduit(id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau produit' })
  @ApiResponse({ status: 201, description: 'Produit créé avec succès' })
  async create(@Body() dto: CreateProduitDto) {
    return this.inventoryService.createProduit(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un produit' })
  @ApiResponse({
    status: 200,
    description: 'Produit mis à jour avec succès',
  })
  @ApiResponse({ status: 404, description: 'Produit introuvable' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProduitDto,
  ) {
    return this.inventoryService.updateProduit(id, dto);
  }
}
