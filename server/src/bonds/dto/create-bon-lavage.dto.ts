import {
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBonLavageDto {
  @ApiProperty({ example: 50, description: 'Pourcentage de réduction (5-100)' })
  @IsInt({ message: 'Le pourcentage doit être un entier' })
  @IsNotEmpty({ message: 'Le pourcentage est requis' })
  @Min(5, { message: 'Le pourcentage minimum est 5%' })
  @Max(100, { message: 'Le pourcentage maximum est 100%' })
  pourcentage: number;

  @ApiPropertyOptional({ example: 1, description: 'ID de la station (optionnel)' })
  @IsOptional()
  @IsInt({ message: 'Le stationId doit être un entier' })
  stationId?: number;

  @ApiPropertyOptional({
    example: 'Bon offert pour fidélité client',
    description: 'Description / raison du bon',
  })
  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne' })
  description?: string;
}
