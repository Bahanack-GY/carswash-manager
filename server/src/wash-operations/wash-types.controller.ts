import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WashOperationsService } from './wash-operations.service.js';
import { CreateTypeLavageDto } from './dto/create-type-lavage.dto.js';
import { UpdateTypeLavageDto } from './dto/update-type-lavage.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../common/constants/roles.enum.js';

@ApiTags('Wash Types')
@ApiBearerAuth()
@Controller('wash-types')
export class WashTypesController {
  constructor(private readonly washOpsService: WashOperationsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister tous les types de lavage' })
  @ApiQuery({ name: 'stationId', required: false, type: Number, description: 'Filtrer par station' })
  @ApiResponse({ status: 200, description: 'Liste des types de lavage' })
  async findAll(@Query('stationId') stationId?: number) {
    return this.washOpsService.findAllTypes({ stationId });
  }

  @Post()
  @Roles(Role.SuperAdmin, Role.Manager)
  @ApiOperation({ summary: 'Créer un type de lavage' })
  @ApiResponse({ status: 201, description: 'Type de lavage créé avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  async create(@Body() dto: CreateTypeLavageDto) {
    return this.washOpsService.createType(dto);
  }

  @Patch(':id')
  @Roles(Role.SuperAdmin, Role.Manager)
  @ApiOperation({ summary: 'Mettre à jour un type de lavage' })
  @ApiResponse({
    status: 200,
    description: 'Type de lavage mis à jour avec succès',
  })
  @ApiResponse({ status: 404, description: 'Type de lavage introuvable' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTypeLavageDto,
  ) {
    return this.washOpsService.updateType(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SuperAdmin, Role.Manager)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un type de lavage' })
  @ApiResponse({ status: 204, description: 'Type de lavage supprimé' })
  @ApiResponse({ status: 404, description: 'Type de lavage introuvable' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.washOpsService.deleteType(id);
  }
}
