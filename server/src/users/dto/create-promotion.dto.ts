import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../common/constants/roles.enum.js';

export class CreatePromotionDto {
  @ApiProperty({
    enum: Role,
    example: Role.Controleur,
    description: 'Nouveau rôle à attribuer',
  })
  @IsEnum(Role, {
    message: `Le rôle doit être : ${Object.values(Role).join(', ')}`,
  })
  @IsNotEmpty({ message: 'Le nouveau rôle est requis' })
  nouveauRole: Role;

  @ApiProperty({
    example: 'Excellente performance et compétences démontrées',
    description: 'Motif de la promotion',
  })
  @IsString({ message: 'Le motif doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le motif est requis' })
  motif: string;
}
