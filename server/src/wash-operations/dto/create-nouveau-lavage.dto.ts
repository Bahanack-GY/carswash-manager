import {
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsString,
  IsArray,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNouveauLavageDto {
  @ApiProperty({ example: 1, description: 'ID de la station' })
  @IsInt()
  @IsNotEmpty()
  stationId: number;

  @ApiProperty({ example: 1, description: 'ID du véhicule' })
  @IsInt()
  @IsNotEmpty()
  vehicleId: number;

  @ApiProperty({ example: 1, description: 'ID du client' })
  @IsInt()
  @IsNotEmpty()
  clientId: number;

  @ApiPropertyOptional({ example: 1, description: 'ID du contrôleur' })
  @IsOptional()
  @IsInt()
  controleurId?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID du type de lavage (legacy single)' })
  @IsOptional()
  @IsInt()
  typeLavageId?: number;

  @ApiPropertyOptional({
    example: [1, 2],
    description: 'IDs des types de lavage (multi-sélection). Le premier est utilisé comme type principal.',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  typeLavageIds?: number[];

  @ApiProperty({ example: '2026-03-15', description: 'Date (ISO string)' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ description: "État des lieux du véhicule" })
  @IsOptional()
  @IsString()
  etatLieu?: string;

  @ApiPropertyOptional({
    example: [1, 2],
    description: 'IDs des services additionnels',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  extrasIds?: number[];

  @ApiPropertyOptional({
    example: [1, 2],
    description: 'IDs des laveurs à assigner au coupon',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  washerIds?: number[];

  @ApiPropertyOptional({
    example: 1,
    description: 'ID de la promotion à appliquer',
  })
  @IsOptional()
  @IsInt()
  promotionId?: number;

  @ApiPropertyOptional({
    example: 'A',
    description: "Catégorie du véhicule pour la tarification (A = standard, B = grand format). Défaut: A",
    enum: ['A', 'B'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['A', 'B'])
  vehicleCategory?: 'A' | 'B';

  @ApiPropertyOptional({
    example: 1,
    description: "ID de la commercial_registration à confirmer (prospect lié manuellement)",
  })
  @IsOptional()
  @IsInt()
  linkedProspectId?: number;
}
