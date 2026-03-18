import {
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsString,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MouvementType } from '../../common/constants/status.enum.js';

export class CreateMouvementStockDto {
  @ApiProperty({ example: 1, description: 'ID du produit' })
  @IsInt({ message: 'Le produitId doit être un entier' })
  @IsNotEmpty({ message: 'Le produitId est requis' })
  produitId: number;

  @ApiProperty({
    example: '2026-02-23',
    description: 'Date du mouvement (YYYY-MM-DD)',
  })
  @IsString({ message: 'La date doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'La date est requise' })
  date: string;

  @ApiProperty({
    enum: MouvementType,
    example: MouvementType.Entree,
    description: 'Type de mouvement',
  })
  @IsEnum(MouvementType, {
    message: `Le type de mouvement doit être l'une des valeurs suivantes : ${Object.values(MouvementType).join(', ')}`,
  })
  @IsNotEmpty({ message: 'Le type de mouvement est requis' })
  typeMouvement: MouvementType;

  @ApiProperty({ example: 20, description: 'Quantité du mouvement' })
  @IsInt({ message: 'La quantité doit être un entier' })
  @IsNotEmpty({ message: 'La quantité est requise' })
  quantite: number;

  @ApiPropertyOptional({
    example: 'Réapprovisionnement mensuel',
    description: 'Motif du mouvement',
  })
  @IsOptional()
  @IsString({ message: 'Le motif doit être une chaîne de caractères' })
  motif?: string;
}
