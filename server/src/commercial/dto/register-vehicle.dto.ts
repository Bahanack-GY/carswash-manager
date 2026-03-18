import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterVehicleDto {
  @ApiProperty({ example: 'DK-1234-AB', description: "Numéro d'immatriculation du véhicule" })
  @IsString({ message: "L'immatriculation doit être une chaîne de caractères" })
  @IsNotEmpty({ message: "L'immatriculation est requise" })
  immatriculation: string;

  @ApiProperty({ example: 'Jean Dupont', description: 'Nom du prospect' })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom du prospect est requis' })
  prospectNom: string;

  @ApiProperty({ example: '690123456', description: 'Téléphone du prospect' })
  @IsString({ message: 'Le téléphone doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le téléphone du prospect est requis' })
  prospectTelephone: string;

  @ApiPropertyOptional({ example: 'jean@example.com', description: 'Email du prospect' })
  @IsOptional()
  @IsString()
  prospectEmail?: string;

  @ApiPropertyOptional({ example: 'Almadies', description: 'Quartier du prospect' })
  @IsOptional()
  @IsString()
  prospectQuartier?: string;

  @ApiPropertyOptional({ example: 'Toyota', description: 'Marque du véhicule' })
  @IsOptional()
  @IsString()
  vehicleBrand?: string;

  @ApiPropertyOptional({ example: 'Camry', description: 'Modèle du véhicule' })
  @IsOptional()
  @IsString()
  vehicleModele?: string;

  @ApiPropertyOptional({ example: 'Blanc', description: 'Couleur du véhicule' })
  @IsOptional()
  @IsString()
  vehicleColor?: string;

  @ApiPropertyOptional({ example: 'Berline', description: 'Type du véhicule' })
  @IsOptional()
  @IsString()
  vehicleType?: string;
}
