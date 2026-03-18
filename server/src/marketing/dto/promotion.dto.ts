import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsInt,
  IsArray,
  IsDateString,
  Min,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { PromotionType, DiscountType } from '../models/promotion.model.js';

export class CreatePromotionDto {
  @IsString({ message: 'Le nom doit être une chaîne' })
  @IsNotEmpty({ message: 'Le nom est requis' })
  nom: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(PromotionType, { message: 'Le type doit être discount ou service_offert' })
  @IsNotEmpty()
  type: PromotionType;

  @IsOptional()
  @IsEnum(DiscountType, { message: 'Le type de remise doit être percentage ou fixed' })
  discountType?: DiscountType;

  @IsOptional()
  @IsNumber({}, { message: 'La valeur de remise doit être un nombre' })
  @Min(0)
  discountValue?: number;

  @IsOptional()
  @IsInt()
  serviceSpecialId?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minVisits?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @IsDateString({}, { message: 'La date de début doit être une date valide' })
  @IsNotEmpty()
  startDate: string;

  @IsDateString({}, { message: 'La date de fin doit être une date valide' })
  @IsNotEmpty()
  endDate: string;

  @IsOptional()
  @IsInt()
  stationId?: number;

  @IsArray()
  @IsInt({ each: true })
  washTypeIds: number[];
}

export class UpdatePromotionDto extends PartialType(CreatePromotionDto) {}
