import {
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFichePisteDto {
  @ApiProperty({ example: 1, description: 'ID de la station' })
  @IsInt({ message: 'Le stationId doit être un entier' })
  @IsNotEmpty({ message: 'Le stationId est requis' })
  stationId: number;

  @ApiProperty({ example: 1, description: 'ID du véhicule' })
  @IsInt({ message: 'Le vehicleId doit être un entier' })
  @IsNotEmpty({ message: 'Le vehicleId est requis' })
  vehicleId: number;

  @ApiProperty({ example: 1, description: 'ID du client' })
  @IsInt({ message: 'Le clientId doit être un entier' })
  @IsNotEmpty({ message: 'Le clientId est requis' })
  clientId: number;

  @ApiPropertyOptional({ example: 1, description: 'ID du contrôleur' })
  @IsOptional()
  @IsInt({ message: 'Le controleurId doit être un entier' })
  controleurId?: number;

  @ApiProperty({ example: 1, description: 'ID du type de lavage' })
  @IsInt({ message: 'Le typeLavageId doit être un entier' })
  @IsNotEmpty({ message: 'Le typeLavageId est requis' })
  typeLavageId: number;

  @ApiProperty({
    example: '2026-03-15',
    description: 'Date de la fiche (YYYY-MM-DD)',
  })
  @IsString({ message: 'La date doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'La date est requise' })
  date: string;

  @ApiPropertyOptional({
    example: 'Rayure côté gauche',
    description: "État des lieux du véhicule",
  })
  @IsOptional()
  @IsString({ message: "L'état des lieux doit être une chaîne de caractères" })
  etatLieu?: string;

  @ApiPropertyOptional({
    example: [1, 2],
    description: 'IDs des services additionnels',
    type: [Number],
  })
  @IsOptional()
  @IsArray({ message: 'extrasIds doit être un tableau' })
  @IsInt({ each: true, message: 'Chaque extrasId doit être un entier' })
  extrasIds?: number[];
}
