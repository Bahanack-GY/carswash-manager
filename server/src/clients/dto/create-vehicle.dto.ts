import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVehicleDto {
  @ApiProperty({ example: 'DK-1234-AB' })
  @IsString({ message: "L'immatriculation doit être une chaîne de caractères" })
  @IsNotEmpty({ message: "L'immatriculation est requise" })
  immatriculation: string;

  @ApiPropertyOptional({ example: 'Corolla' })
  @IsOptional()
  @IsString({ message: 'Le modèle doit être une chaîne de caractères' })
  modele?: string;

  @ApiPropertyOptional({ example: 'Noir' })
  @IsOptional()
  @IsString({ message: 'La couleur doit être une chaîne de caractères' })
  color?: string;

  @ApiPropertyOptional({ example: 'Berline' })
  @IsOptional()
  @IsString({ message: 'Le type doit être une chaîne de caractères' })
  type?: string;

  @ApiPropertyOptional({ example: 'Toyota' })
  @IsOptional()
  @IsString({ message: 'La marque doit être une chaîne de caractères' })
  brand?: string;
}
