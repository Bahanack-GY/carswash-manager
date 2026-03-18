import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateIncidentDto } from './create-incident.dto.js';
import { IncidentStatus } from '../../common/constants/status.enum.js';

export class UpdateIncidentDto extends PartialType(CreateIncidentDto) {
  @ApiPropertyOptional({
    enum: IncidentStatus,
    description: 'Statut de l\'incident',
    example: IncidentStatus.InProgress,
  })
  @IsOptional()
  @IsEnum(IncidentStatus, {
    message: `Le statut doit être l'une des valeurs suivantes : ${Object.values(IncidentStatus).join(', ')}`,
  })
  statut?: IncidentStatus;

  @ApiPropertyOptional({
    example: '2026-02-25T14:30:00Z',
    description: 'Date de résolution de l\'incident',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La date de résolution doit être une date valide' })
  resolvedAt?: string;
}
