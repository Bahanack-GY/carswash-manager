import {
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsString,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommandeStatus } from '../../common/constants/status.enum.js';

export class CreateCommandeAchatDto {
  @ApiProperty({ example: 1, description: 'ID du fournisseur' })
  @IsInt({ message: 'Le fournisseurId doit être un entier' })
  @IsNotEmpty({ message: 'Le fournisseurId est requis' })
  fournisseurId: number;

  @ApiProperty({
    example: '2026-02-23',
    description: 'Date de la commande (YYYY-MM-DD)',
  })
  @IsString({ message: 'La date doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'La date est requise' })
  date: string;

  @ApiPropertyOptional({
    enum: CommandeStatus,
    example: CommandeStatus.Pending,
    description: 'Statut de la commande',
    default: CommandeStatus.Pending,
  })
  @IsOptional()
  @IsEnum(CommandeStatus, {
    message: `Le statut doit être l'une des valeurs suivantes : ${Object.values(CommandeStatus).join(', ')}`,
  })
  statut?: CommandeStatus;
}
