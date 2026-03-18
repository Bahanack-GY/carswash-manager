import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateFichePisteDto } from './create-fiche-piste.dto.js';
import { FichePisteStatus } from '../../common/constants/status.enum.js';

export class UpdateFichePisteDto extends PartialType(CreateFichePisteDto) {
  @ApiPropertyOptional({
    enum: FichePisteStatus,
    description: 'Statut de la fiche de piste',
    example: FichePisteStatus.InProgress,
  })
  @IsOptional()
  @IsEnum(FichePisteStatus, {
    message: `Le statut doit être l'une des valeurs suivantes : ${Object.values(FichePisteStatus).join(', ')}`,
  })
  statut?: FichePisteStatus;
}
