import { IsInt, IsNotEmpty, IsOptional, IsString, IsNumber, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceSpecialDto {
  @ApiPropertyOptional({ example: 1, description: 'ID de la station (null = global)' })
  @IsOptional()
  @IsInt({ message: 'Le stationId doit être un entier' })
  stationId?: number;

  @ApiProperty({ example: 'Cire de protection', description: 'Nom du service spécial' })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom est requis' })
  nom: string;

  @ApiPropertyOptional({ example: 'lavage', enum: ['lavage', 'renovation', 'film', 'accessoire', 'vitre', 'nettoyage'] })
  @IsOptional()
  @IsString()
  categorie?: string;

  @ApiPropertyOptional({ example: 'Traitement céramique longue durée' })
  @IsOptional()
  @IsString()
  particularites?: string;

  @ApiProperty({ example: 2000, description: 'Prix Cat A (FCFA)' })
  @IsNumber({}, { message: 'Le prix doit être un nombre' })
  @IsNotEmpty({ message: 'Le prix est requis' })
  prix: number;

  @ApiPropertyOptional({ example: 3500, description: 'Prix Cat B (FCFA)' })
  @IsOptional()
  @IsNumber()
  prixCatB?: number | null;

  @ApiPropertyOptional({ example: 500, description: 'Commission versée au commercial qui a apporté le client (FCFA)' })
  @IsOptional()
  @IsNumber()
  commission?: number | null;

  @ApiPropertyOptional({ example: 150, description: 'Frais de service versés aux laveurs ayant effectué le service (FCFA)' })
  @IsOptional()
  @IsNumber()
  fraisService?: number | null;

  @ApiPropertyOptional({ example: 500, description: 'Bonus laveur pour ce service (FCFA)' })
  @IsOptional()
  @IsNumber({}, { message: 'Le bonus doit être un nombre' })
  bonus?: number | null;

  @ApiPropertyOptional({ example: 60, description: 'Durée estimée en minutes' })
  @IsOptional()
  @IsInt()
  dureeEstimee?: number;

  @ApiPropertyOptional({ example: 'active', enum: ['active', 'suspended'] })
  @IsOptional()
  @IsIn(['active', 'suspended'])
  statut?: 'active' | 'suspended';
}
