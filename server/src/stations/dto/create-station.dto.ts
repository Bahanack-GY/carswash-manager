import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StationStatus } from '../../common/constants/status.enum.js';

export class CreateStationDto {
  @ApiProperty({ example: 'Station Dakar Centre' })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom est requis' })
  nom: string;

  @ApiProperty({ example: '12 Rue Carnot' })
  @IsString({ message: "L'adresse doit être une chaîne de caractères" })
  @IsNotEmpty({ message: "L'adresse est requise" })
  adresse: string;

  @ApiProperty({ example: 'Dakar' })
  @IsString({ message: 'La ville doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'La ville est requise' })
  town: string;

  @ApiPropertyOptional({ example: '+221 77 000 00 00' })
  @IsOptional()
  @IsString({ message: 'Le contact doit être une chaîne de caractères' })
  contact?: string;

  @ApiPropertyOptional({ enum: StationStatus, default: StationStatus.Active })
  @IsOptional()
  @IsEnum(StationStatus, {
    message: `Le statut doit être l'une des valeurs suivantes : ${Object.values(StationStatus).join(', ')}`,
  })
  status?: StationStatus;

  @ApiPropertyOptional({ example: 10, description: 'Objectif journalier pour les commerciaux' })
  @IsOptional()
  @IsInt({ message: "L'objectif commercial doit être un entier" })
  @Min(1, { message: "L'objectif commercial doit être au moins 1" })
  objectifCommercialJournalier?: number;
}
