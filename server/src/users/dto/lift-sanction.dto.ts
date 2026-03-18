import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class LiftSanctionDto {
  @ApiPropertyOptional({
    example: 'Comportement amélioré, levée anticipée',
    description: 'Note optionnelle lors de la levée',
  })
  @IsOptional()
  @IsString({ message: 'La note doit être une chaîne de caractères' })
  noteLevee?: string;
}
