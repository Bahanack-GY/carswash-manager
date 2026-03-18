import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
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
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '../common/constants/roles.enum.js';
import { BondsService } from './bonds.service.js';
import { CreateBonLavageDto } from './dto/create-bon-lavage.dto.js';
import { UseBonLavageDto } from './dto/use-bon-lavage.dto.js';

@ApiTags('Bons de Lavage')
@ApiBearerAuth()
@Controller('bonds')
export class BondsController {
  constructor(private readonly bondsService: BondsService) {}

  @Post()
  @Roles(Role.SuperAdmin)
  @ApiOperation({ summary: 'Créer un bon de lavage (super_admin uniquement)' })
  @ApiResponse({ status: 201, description: 'Bon créé avec succès' })
  async create(
    @Body() dto: CreateBonLavageDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.bondsService.create(dto, userId);
  }

  @Get()
  @Roles(Role.SuperAdmin, Role.Manager)
  @ApiOperation({ summary: 'Lister tous les bons de lavage' })
  @ApiQuery({ name: 'isUsed', required: false, type: String })
  @ApiQuery({ name: 'stationId', required: false, type: Number })
  @ApiQuery({ name: 'createdById', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Liste paginée des bons' })
  async findAll(
    @Query('isUsed') isUsed?: string,
    @Query('stationId') stationId?: number,
    @Query('createdById') createdById?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.bondsService.findAll({
      isUsed:
        isUsed === 'true' ? true : isUsed === 'false' ? false : undefined,
      stationId,
      createdById,
      page,
      limit,
    });
  }

  @Get('validate/:code')
  @Roles(Role.SuperAdmin, Role.Manager, Role.Caissiere)
  @ApiOperation({
    summary: "Valider un code de bon (vérifier s'il existe et n'est pas utilisé)",
  })
  @ApiResponse({ status: 200, description: 'Bon valide et disponible' })
  async validateCode(@Param('code') code: string) {
    return this.bondsService.validateByCode(code);
  }

  @Get(':id')
  @Roles(Role.SuperAdmin, Role.Manager, Role.Caissiere)
  @ApiOperation({ summary: "Détail d'un bon de lavage" })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bondsService.findOne(id);
  }

  @Patch(':id/use')
  @Roles(Role.SuperAdmin, Role.Manager, Role.Caissiere)
  @ApiOperation({ summary: 'Marquer un bon comme utilisé' })
  @ApiResponse({ status: 200, description: 'Bon marqué comme utilisé' })
  async markAsUsed(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UseBonLavageDto,
  ) {
    return this.bondsService.markAsUsed(id, dto);
  }
}
