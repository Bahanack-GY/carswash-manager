import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SanctionType } from '../../common/constants/status.enum.js';

export class CreateSanctionDto {
  @ApiProperty({
    enum: SanctionType,
    example: SanctionType.Avertissement,
    description: 'Type de sanction',
  })
  @IsEnum(SanctionType, {
    message: `Le type doit être : ${Object.values(SanctionType).join(', ')}`,
  })
  @IsNotEmpty({ message: 'Le type de sanction est requis' })
  type: SanctionType;

  @ApiProperty({
    example: 'Absences répétées sans justification',
    description: 'Motif de la sanction',
  })
  @IsString({ message: 'Le motif doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le motif est requis' })
  motif: string;
}
