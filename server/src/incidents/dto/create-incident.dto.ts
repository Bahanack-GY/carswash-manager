import { IsInt, IsNotEmpty, IsOptional, IsString, IsDateString, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentSeverity } from '../../common/constants/status.enum.js';

export class CreateIncidentDto {
  @ApiProperty({ example: 1, description: 'ID de la station' })
  @IsInt({ message: 'Le stationId doit être un entier' })
  @IsNotEmpty({ message: 'Le stationId est requis' })
  stationId: number;

  @ApiProperty({
    example: 'Fuite d\'eau au niveau de la piste 2',
    description: 'Description détaillée de l\'incident',
  })
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'La description est requise' })
  description: string;

  @ApiProperty({
    enum: IncidentSeverity,
    example: IncidentSeverity.Medium,
    description: 'Niveau de sévérité de l\'incident',
  })
  @IsEnum(IncidentSeverity, {
    message: `La sévérité doit être l'une des valeurs suivantes : ${Object.values(IncidentSeverity).join(', ')}`,
  })
  @IsNotEmpty({ message: 'La sévérité est requise' })
  severity: IncidentSeverity;

  @ApiPropertyOptional({
    example: false,
    description: 'Indique si l\'incident arrête l\'activité de la station',
  })
  @IsOptional()
  @IsBoolean({ message: 'stopsActivity doit être un booléen' })
  stopsActivity?: boolean;

  @ApiProperty({
    example: '2026-02-23',
    description: 'Date de déclaration de l\'incident (YYYY-MM-DD)',
  })
  @IsDateString({}, { message: 'La date de déclaration doit être une date valide (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'La date de déclaration est requise' })
  dateDeclaration: string;
}
