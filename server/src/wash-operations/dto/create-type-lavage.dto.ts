import { IsNotEmpty, IsString, IsNumber, IsOptional, IsInt, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTypeLavageDto {
  @ApiPropertyOptional({ example: 1, description: 'ID de la station (null = global)' })
  @IsOptional()
  @IsInt({ message: 'Le stationId doit être un entier' })
  stationId?: number;

  @ApiProperty({ example: 'LIS Classique', description: 'Nom du type de lavage' })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom est requis' })
  nom: string;

  @ApiPropertyOptional({ example: 'Lavage extérieur complet' })
  @IsOptional()
  @IsString()
  particularites?: string;

  @ApiProperty({ example: 3000, description: 'Prix Catégorie A (FCFA)' })
  @IsNumber({}, { message: 'Le prix de base doit être un nombre' })
  @IsNotEmpty({ message: 'Le prix de base est requis' })
  prixBase: number;

  @ApiPropertyOptional({ example: 5000, description: 'Prix Catégorie B (FCFA)' })
  @IsOptional()
  @IsNumber()
  prixCatB?: number | null;

  @ApiPropertyOptional({ example: 150, description: 'Frais de service versés aux laveurs par véhicule lavé (FCFA)' })
  @IsOptional()
  @IsNumber()
  fraisService?: number | null;

  @ApiPropertyOptional({ example: 45, description: 'Durée estimée en minutes' })
  @IsOptional()
  @IsInt({ message: 'La durée estimée doit être un entier' })
  dureeEstimee?: number;

  @ApiPropertyOptional({ example: 'active', enum: ['active', 'suspended'] })
  @IsOptional()
  @IsIn(['active', 'suspended'])
  statut?: 'active' | 'suspended';
}
