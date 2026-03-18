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
import { CreateCommandeAchatDto } from './dto/create-commande-achat.dto.js';
import { UpdateCommandeAchatDto } from './dto/update-commande-achat.dto.js';
import { CommandeStatus } from '../common/constants/status.enum.js';

@ApiTags('Commandes Achat')
@ApiBearerAuth()
@Controller('commandes-achat')
export class CommandesAchatController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({
    summary: "Lister les commandes d'achat avec filtres et pagination",
  })
  @ApiQuery({
    name: 'fournisseurId',
    required: false,
    type: Number,
    description: 'Filtrer par fournisseur',
  })
  @ApiQuery({
    name: 'statut',
    required: false,
    enum: CommandeStatus,
    description: 'Filtrer par statut',
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
    description: "Liste paginée des commandes d'achat",
  })
  async findAll(
    @Query('fournisseurId') fournisseurId?: number,
    @Query('statut') statut?: CommandeStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.inventoryService.findAllCommandes({
      fournisseurId,
      statut,
      page,
      limit,
    });
  }

  @Post()
  @ApiOperation({ summary: "Créer une nouvelle commande d'achat" })
  @ApiResponse({
    status: 201,
    description: "Commande d'achat créée avec succès",
  })
  async create(@Body() dto: CreateCommandeAchatDto) {
    return this.inventoryService.createCommande(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: "Mettre à jour une commande d'achat" })
  @ApiResponse({
    status: 200,
    description: "Commande d'achat mise à jour avec succès",
  })
  @ApiResponse({ status: 404, description: 'Commande introuvable' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommandeAchatDto,
  ) {
    return this.inventoryService.updateCommande(id, dto);
  }
}
