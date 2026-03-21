import {
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsNumber,
  IsPositive,
  IsString,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PaymentMethod,
  TransactionType,
} from '../../common/constants/status.enum.js';

export class CreatePaiementDto {
  @ApiPropertyOptional({ example: 1, description: 'ID de la facture associée' })
  @IsOptional()
  @IsInt({ message: 'Le factureId doit être un entier' })
  factureId?: number;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.Cash,
    description: 'Méthode de paiement',
  })
  @IsEnum(PaymentMethod, { message: 'La méthode de paiement est invalide' })
  @IsNotEmpty({ message: 'La méthode de paiement est requise' })
  methode: PaymentMethod;

  @ApiProperty({ example: 5000.0, description: 'Montant du paiement' })
  @IsNumber({}, { message: 'Le montant doit être un nombre' })
  @IsPositive({ message: 'Le montant doit être supérieur à zéro' })
  @IsNotEmpty({ message: 'Le montant est requis' })
  montant: number;

  @ApiPropertyOptional({
    example: 'REF-123456',
    description: 'Référence externe du paiement',
  })
  @IsOptional()
  @IsString({ message: 'La référence externe doit être une chaîne' })
  referenceExterne?: string;

  @ApiProperty({
    enum: TransactionType,
    example: TransactionType.Income,
    description: 'Type de transaction',
  })
  @IsEnum(TransactionType, { message: 'Le type de transaction est invalide' })
  @IsNotEmpty({ message: 'Le type de transaction est requis' })
  type: TransactionType;

  @ApiPropertyOptional({
    example: 'Paiement lavage complet',
    description: 'Description du paiement',
  })
  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne' })
  description?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID de la station' })
  @IsOptional()
  @IsInt({ message: 'Le stationId doit être un entier' })
  stationId?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID du coupon associé' })
  @IsOptional()
  @IsInt({ message: 'Le couponId doit être un entier' })
  couponId?: number;

  @ApiPropertyOptional({
    example: 'fournitures',
    description: 'Catégorie de la dépense',
  })
  @IsOptional()
  @IsString({ message: 'La catégorie doit être une chaîne' })
  categorie?: string;

  @ApiPropertyOptional({
    example: '/uploads/justificatifs/1234567890-facture.pdf',
    description: 'Chemin du justificatif',
  })
  @IsOptional()
  @IsString({ message: 'Le justificatif doit être une chaîne' })
  justificatif?: string;
}
