import { IsNotEmpty, IsInt, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCouponDto {
  @ApiProperty({ example: 1, description: 'ID de la fiche de piste' })
  @IsInt({ message: 'Le fichePisteId doit être un entier' })
  @IsNotEmpty({ message: 'Le fichePisteId est requis' })
  fichePisteId: number;

  @ApiPropertyOptional({
    example: [1, 2],
    description: 'IDs des laveurs assignés',
    type: [Number],
  })
  @IsOptional()
  @IsArray({ message: 'washerIds doit être un tableau' })
  @IsInt({ each: true, message: 'Chaque washerId doit être un entier' })
  washerIds?: number[];
}
