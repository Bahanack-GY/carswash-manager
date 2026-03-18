import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionType } from '../../common/constants/status.enum.js';

export class CreateSubscriptionDto {
  @ApiProperty({ enum: SubscriptionType, example: SubscriptionType.Mensuel })
  @IsEnum(SubscriptionType, {
    message: `Le type doit être l'une des valeurs suivantes : ${Object.values(SubscriptionType).join(', ')}`,
  })
  @IsNotEmpty({ message: 'Le type est requis' })
  type: SubscriptionType;

  @ApiProperty({ example: '2026-03-01' })
  @IsString({ message: 'La date de début doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'La date de début est requise' })
  dateDebut: string;

  @ApiProperty({ example: '2026-04-01' })
  @IsString({ message: 'La date de fin doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'La date de fin est requise' })
  dateFin: string;
}
