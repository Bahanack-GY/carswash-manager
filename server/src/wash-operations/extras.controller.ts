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
import { CreateServiceSpecialDto } from './dto/create-service-special.dto.js';
import { UpdateServiceSpecialDto } from './dto/update-service-special.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../common/constants/roles.enum.js';

@ApiTags('Extras')
@ApiBearerAuth()
@Controller('extras')
export class ExtrasController {
  constructor(private readonly washOpsService: WashOperationsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister tous les services spéciaux' })
  @ApiQuery({ name: 'stationId', required: false, type: Number, description: 'Filtrer par station' })
  @ApiResponse({
    status: 200,
    description: 'Liste des services spéciaux',
  })
  async findAll(@Query('stationId') stationId?: number) {
    return this.washOpsService.findAllExtras({ stationId });
  }

  @Post()
  @Roles(Role.SuperAdmin, Role.Manager)
  @ApiOperation({ summary: 'Créer un service spécial' })
  @ApiResponse({
    status: 201,
    description: 'Service spécial créé avec succès',
  })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  async create(@Body() dto: CreateServiceSpecialDto) {
    return this.washOpsService.createExtra(dto);
  }

  @Patch(':id')
  @Roles(Role.SuperAdmin, Role.Manager)
  @ApiOperation({ summary: 'Mettre à jour un service spécial' })
  @ApiResponse({
    status: 200,
    description: 'Service spécial mis à jour avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Service spécial introuvable',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServiceSpecialDto,
  ) {
    return this.washOpsService.updateExtra(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SuperAdmin, Role.Manager)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un service spécial' })
  @ApiResponse({ status: 204, description: 'Service spécial supprimé' })
  @ApiResponse({ status: 404, description: 'Service spécial introuvable' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.washOpsService.deleteExtra(id);
  }
}
