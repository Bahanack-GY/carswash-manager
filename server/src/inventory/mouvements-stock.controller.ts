import {
  Controller,
  Get,
  Post,
  Body,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service.js';
import { CreateMouvementStockDto } from './dto/create-mouvement-stock.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Mouvements Stock')
@ApiBearerAuth()
@Controller('mouvements-stock')
export class MouvementsStockController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les mouvements de stock avec filtres et pagination',
  })
  @ApiQuery({
    name: 'produitId',
    required: false,
    type: Number,
    description: 'Filtrer par produit',
  })
  @ApiQuery({
    name: 'stationId',
    required: false,
    type: Number,
    description: 'Filtrer par station (via produit)',
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
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des mouvements de stock',
  })
  async findAll(
    @Query('produitId') produitId?: number,
    @Query('stationId') stationId?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.inventoryService.findAllMouvements({
      produitId,
      stationId,
      page,
      limit,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Créer un mouvement de stock' })
  @ApiResponse({
    status: 201,
    description: 'Mouvement de stock créé avec succès',
  })
  @ApiResponse({ status: 404, description: 'Produit introuvable' })
  async create(
    @Body() dto: CreateMouvementStockDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.createMouvement(dto, user.id);
  }
}
