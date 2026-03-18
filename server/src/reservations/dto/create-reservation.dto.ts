import { IsInt, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({ example: 1, description: 'ID du client' })
  @IsInt({ message: 'Le clientId doit être un entier' })
  @IsNotEmpty({ message: 'Le clientId est requis' })
  clientId: number;

  @ApiPropertyOptional({ example: 1, description: 'ID du véhicule' })
  @IsOptional()
  @IsInt({ message: 'Le vehicleId doit être un entier' })
  vehicleId?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID de la station' })
  @IsOptional()
  @IsInt({ message: 'Le stationId doit être un entier' })
  stationId?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID du type de lavage' })
  @IsOptional()
  @IsInt({ message: 'Le typeLavageId doit être un entier' })
  typeLavageId?: number;

  @ApiProperty({
    example: '2026-03-15T10:00:00.000Z',
    description: "Date et heure d'apport du véhicule (ISO 8601)",
  })
  @IsDateString({}, { message: "La date d'apport doit être une date ISO valide" })
  @IsNotEmpty({ message: "La date d'apport est requise" })
  dateHeureApport: string;
}
