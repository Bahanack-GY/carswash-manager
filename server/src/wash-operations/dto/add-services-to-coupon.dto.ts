import { IsOptional, IsArray, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AddServicesToCouponDto {
  @ApiPropertyOptional({ type: [Number], description: 'IDs des services spéciaux à ajouter' })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  extrasIds?: number[];

  @ApiPropertyOptional({ type: [Number], description: 'IDs des types de lavage à ajouter' })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  typeLavageIds?: number[];
}
