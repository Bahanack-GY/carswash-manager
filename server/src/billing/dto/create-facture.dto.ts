import {
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsNumber,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LigneVenteItemDto {
  @ApiProperty({ example: 1, description: 'ID du produit' })
  @IsInt({ message: 'Le produitId doit être un entier' })
  @IsNotEmpty({ message: 'Le produitId est requis' })
  produitId: number;

  @ApiProperty({ example: 2, description: 'Quantité' })
  @IsInt({ message: 'La quantité doit être un entier' })
  @IsNotEmpty({ message: 'La quantité est requise' })
  quantite: number;

  @ApiProperty({ example: 1500.0, description: 'Prix unitaire' })
  @IsNumber({}, { message: 'Le prix unitaire doit être un nombre' })
  @IsNotEmpty({ message: 'Le prix unitaire est requis' })
  prixUnitaire: number;
}

export class CreateFactureDto {
  @ApiPropertyOptional({ example: 1, description: 'ID du coupon associé' })
  @IsOptional()
  @IsInt({ message: 'Le couponId doit être un entier' })
  couponId?: number;

  @ApiProperty({ example: 1, description: 'ID de la station' })
  @IsInt({ message: 'Le stationId doit être un entier' })
  @IsNotEmpty({ message: 'Le stationId est requis' })
  stationId: number;

  @ApiPropertyOptional({ example: 1, description: 'ID du client' })
  @IsOptional()
  @IsInt({ message: 'Le clientId doit être un entier' })
  clientId?: number;

  @ApiProperty({ example: 5000.0, description: 'Montant total de la facture' })
  @IsNumber({}, { message: 'Le montant total doit être un nombre' })
  @IsNotEmpty({ message: 'Le montant total est requis' })
  montantTotal: number;

  @ApiPropertyOptional({ example: 0, description: 'TVA', default: 0 })
  @IsOptional()
  @IsNumber({}, { message: 'La TVA doit être un nombre' })
  tva?: number = 0;

  @ApiProperty({
    example: '2026-02-23',
    description: 'Date de la facture (YYYY-MM-DD)',
  })
  @IsString({ message: 'La date doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'La date est requise' })
  date: string;

  @ApiPropertyOptional({
    description: 'Lignes de vente de la facture',
    type: [LigneVenteItemDto],
  })
  @IsOptional()
  @IsArray({ message: 'Les lignes doivent être un tableau' })
  @ValidateNested({ each: true })
  @Type(() => LigneVenteItemDto)
  lignes?: LigneVenteItemDto[];
}
