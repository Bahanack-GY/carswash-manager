import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class TransferStationDto {
  @ApiProperty({ example: 2, description: 'ID de la nouvelle station' })
  @Type(() => Number)
  @IsInt({ message: "L'ID de la station doit être un nombre entier" })
  @IsNotEmpty({ message: "L'ID de la nouvelle station est requis" })
  newStationId: number;
}
