import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BillingService } from './billing.service.js';
import { CreatePaiementDto } from './dto/create-paiement.dto.js';
import { TransactionType } from '../common/constants/status.enum.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@ApiTags('Caisse')
@ApiBearerAuth()
@Controller('caisse')
export class CaisseController {
  constructor(private readonly billingService: BillingService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Résumé de la caisse pour une station et une date' })
  @ApiQuery({
    name: 'stationId',
    required: true,
    type: Number,
    description: 'ID de la station',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: 'Date au format YYYY-MM-DD (défaut: aujourd\'hui)',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Date début de période (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Date fin de période (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Résumé de la caisse' })
  async getSummary(
    @Query('stationId') stationId: number,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.billingService.getCaisseSummary(stationId, date, startDate, endDate);
  }

  @Get('transactions')
  @ApiOperation({
    summary: 'Lister les transactions de la caisse avec filtres et pagination',
  })
  @ApiQuery({
    name: 'stationId',
    required: true,
    type: Number,
    description: 'ID de la station',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: Number,
    description: 'Filtrer par utilisateur',
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
    name: 'type',
    required: false,
    enum: TransactionType,
    description: 'Filtrer par type de transaction',
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
    description: 'Liste paginée des transactions de la caisse',
  })
  async getTransactions(
    @Query('stationId') stationId: number,
    @Query('userId') userId?: number,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: TransactionType,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.billingService.getCaisseTransactions({
      stationId,
      userId,
      date,
      startDate,
      endDate,
      type,
      page,
      limit,
    });
  }

  @Post('transactions')
  @ApiOperation({
    summary: 'Enregistrer une transaction (dépense ou recette)',
  })
  @ApiResponse({ status: 201, description: 'Transaction créée avec succès' })
  async createTransaction(
    @Body() dto: CreatePaiementDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.billingService.createPaiement(dto, userId);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Uploader un justificatif de dépense' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Fichier uploadé avec succès' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'justificatifs'),
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e4);
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (ALLOWED_EXTENSIONS.includes(ext)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Type de fichier non autorisé. Extensions acceptées : ${ALLOWED_EXTENSIONS.join(', ')}`,
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadJustificatif(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }
    return { path: `/uploads/justificatifs/${file.filename}` };
  }
}
