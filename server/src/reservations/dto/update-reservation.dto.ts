import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateReservationDto } from './create-reservation.dto.js';
import { ReservationStatus } from '../../common/constants/status.enum.js';

export class UpdateReservationDto extends PartialType(CreateReservationDto) {
  @ApiPropertyOptional({
    enum: ReservationStatus,
    description: 'Statut de la réservation',
    example: ReservationStatus.Confirmed,
  })
  @IsOptional()
  @IsEnum(ReservationStatus, {
    message: `Le statut doit être l'une des valeurs suivantes : ${Object.values(ReservationStatus).join(', ')}`,
  })
  statut?: ReservationStatus;
}
