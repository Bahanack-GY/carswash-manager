import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { AssignStationDto } from './dto/assign-station.dto.js';
import { TransferStationDto } from './dto/transfer-station.dto.js';
import { CreateSanctionDto } from './dto/create-sanction.dto.js';
import { LiftSanctionDto } from './dto/lift-sanction.dto.js';
import { CreatePromotionDto } from './dto/create-promotion.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../common/constants/roles.enum.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les utilisateurs avec filtres' })
  @ApiQuery({ name: 'role', required: false, enum: Role })
  @ApiQuery({ name: 'stationId', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des utilisateurs',
  })
  async findAll(
    @Query('role') role?: Role,
    @Query('stationId') stationId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.findAll({
      role,
      stationId: stationId ? +stationId : undefined,
      search,
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
    });
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Classement des laveurs ou commerciaux par points' })
  @ApiQuery({ name: 'type', required: true, enum: ['laveurs', 'commerciaux'] })
  @ApiQuery({ name: 'stationId', required: false, type: Number })
  async getLeaderboard(
    @Query('type') type: 'laveurs' | 'commerciaux',
    @Query('stationId') stationId?: string,
  ) {
    return this.usersService.getLeaderboard(type, stationId ? +stationId : undefined);
  }

  @Get('washers/available')
  @ApiOperation({
    summary: 'Lister les laveurs disponibles pour une station',
  })
  @ApiQuery({ name: 'stationId', required: true, type: Number })
  @ApiResponse({
    status: 200,
    description:
      'Liste des laveurs actifs affectés à la station',
  })
  async findAvailableWashers(
    @Query('stationId', ParseIntPipe) stationId: number,
  ) {
    return this.usersService.findAvailableWashers(stationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un utilisateur par ID' })
  @ApiResponse({ status: 200, description: "Détails de l'utilisateur" })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(Role.SuperAdmin, Role.Manager)
  @ApiOperation({
    summary: 'Créer un utilisateur (SuperAdmin ou Manager)',
  })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Mettre à jour son propre profil (email, téléphone, mot de passe)' })
  @ApiResponse({ status: 200, description: 'Profil mis à jour' })
  @ApiResponse({ status: 403, description: 'Mot de passe actuel incorrect' })
  async updateSelf(
    @CurrentUser('id') currentUserId: number,
    @Body() dto: { email?: string; telephone?: string; newPassword?: string; currentPassword?: string },
  ) {
    return this.usersService.updateSelf(currentUserId, dto);
  }

  @Patch(':id')
  @Roles(Role.SuperAdmin, Role.Manager)
  @ApiOperation({
    summary: 'Mettre à jour un utilisateur (SuperAdmin ou Manager)',
  })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur mis à jour avec succès',
  })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Get(':id/performance')
  @ApiOperation({
    summary: "Récupérer les performances d'un utilisateur",
  })
  @ApiQuery({ name: 'stationId', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Date début (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Date fin (YYYY-MM-DD)' })
  @ApiResponse({
    status: 200,
    description: "Performances de l'utilisateur",
  })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  async getPerformance(
    @Param('id', ParseIntPipe) id: number,
    @Query('stationId') stationId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.usersService.getPerformance(
      id,
      stationId ? +stationId : undefined,
      startDate,
      endDate,
    );
  }

  @Post(':id/assign-station')
  @Roles(Role.SuperAdmin, Role.Manager)
  @ApiOperation({
    summary: 'Affecter un utilisateur à une station (SuperAdmin ou Manager)',
  })
  @ApiResponse({
    status: 201,
    description: 'Affectation créée avec succès',
  })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  async assignStation(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignStationDto: AssignStationDto,
  ) {
    return this.usersService.assignStation(id, assignStationDto);
  }

  @Post(':id/transfer-station')
  @Roles(Role.SuperAdmin, Role.Manager)
  @ApiOperation({
    summary:
      'Transférer un utilisateur vers une nouvelle station (désactive les affectations actuelles)',
  })
  @ApiResponse({
    status: 201,
    description: 'Transfert effectué avec succès',
  })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  async transferStation(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TransferStationDto,
  ) {
    return this.usersService.transferStation(id, dto);
  }

  @Post(':id/unassign-station')
  @Roles(Role.SuperAdmin)
  @ApiOperation({
    summary:
      'Retirer un utilisateur de sa station (désactive toutes ses affectations actives)',
  })
  @ApiResponse({
    status: 201,
    description: 'Affectations désactivées avec succès',
  })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  async unassignStation(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.unassignStation(id);
  }

  @Post(':id/sanctions')
  @Roles(Role.SuperAdmin, Role.Manager)
  @ApiOperation({
    summary: 'Appliquer une sanction à un employé',
  })
  @ApiResponse({
    status: 201,
    description: 'Sanction appliquée avec succès',
  })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  async addSanction(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateSanctionDto,
    @CurrentUser('id') currentUserId: number,
  ) {
    return this.usersService.addSanction(id, dto, currentUserId);
  }

  @Get(':id/sanctions')
  @ApiOperation({
    summary: "Récupérer les sanctions d'un employé",
  })
  @ApiResponse({
    status: 200,
    description: "Liste des sanctions de l'employé",
  })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  async getUserSanctions(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserSanctions(id);
  }

  @Patch('sanctions/:sanctionId/lift')
  @Roles(Role.SuperAdmin, Role.Manager)
  @ApiOperation({
    summary: 'Lever une sanction',
  })
  @ApiResponse({
    status: 200,
    description: 'Sanction levée avec succès',
  })
  @ApiResponse({ status: 403, description: 'Accès refusé ou sanction déjà levée' })
  @ApiResponse({ status: 404, description: 'Sanction introuvable' })
  async liftSanction(
    @Param('sanctionId', ParseIntPipe) sanctionId: number,
    @Body() dto: LiftSanctionDto,
  ) {
    return this.usersService.liftSanction(sanctionId, dto);
  }

  @Post(':id/avatar')
  @Roles(Role.SuperAdmin, Role.Manager)
  @ApiOperation({ summary: "Mettre à jour la photo de profil d'un employé" })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: join(process.cwd(), 'uploads', 'avatars'),
      filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        cb(null, `${unique}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (_req, file, cb) => {
      const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
      if (!allowed.includes(extname(file.originalname).toLowerCase())) {
        return cb(new BadRequestException('Format non supporté. Utilisez JPG, PNG ou WebP.'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 3 * 1024 * 1024 },
  }))
  async uploadAvatar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    const path = `/uploads/avatars/${file.filename}`;
    return this.usersService.update(id, { profilePicture: path } as any);
  }

  @Post(':id/promote')
  @Roles(Role.SuperAdmin, Role.Manager)
  @ApiOperation({
    summary: 'Promouvoir un employé (changer son rôle)',
  })
  @ApiResponse({
    status: 201,
    description: 'Promotion effectuée avec succès',
  })
  @ApiResponse({ status: 403, description: 'Accès refusé ou rôle identique' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  async promoteUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreatePromotionDto,
    @CurrentUser('id') currentUserId: number,
  ) {
    return this.usersService.promoteUser(id, dto, currentUserId);
  }
}
