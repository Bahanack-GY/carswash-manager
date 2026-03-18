import { Controller, Post, Body } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BillingService } from './billing.service.js';
import { CreatePaiementDto } from './dto/create-paiement.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Paiements')
@ApiBearerAuth()
@Controller('paiements')
export class PaiementsController {
  constructor(private readonly billingService: BillingService) {}

  @Post()
  @ApiOperation({ summary: 'Enregistrer un paiement' })
  @ApiResponse({ status: 201, description: 'Paiement créé avec succès' })
  async create(
    @Body() dto: CreatePaiementDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.billingService.createPaiement(dto, userId);
  }
}
