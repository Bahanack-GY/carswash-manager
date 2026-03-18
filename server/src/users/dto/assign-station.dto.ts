import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AssignStationDto {
  @ApiProperty({ example: 1, description: 'ID de la station' })
  @Type(() => Number)
  @IsInt({ message: "L'ID de la station doit être un nombre entier" })
  @IsNotEmpty({ message: "L'ID de la station est requis" })
  stationId: number;

  @ApiProperty({
    example: '2026-01-15',
    description: "Date de début de l'affectation (format YYYY-MM-DD)",
  })
  @IsString({
    message: 'La date de début doit être une chaîne de caractères',
  })
  @IsNotEmpty({ message: 'La date de début est requise' })
  dateDebut: string;
}
