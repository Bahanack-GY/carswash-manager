import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../common/constants/roles.enum.js';

export class CreateUserDto {
  @ApiProperty({ example: 'Diallo' })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom est requis' })
  nom: string;

  @ApiProperty({ example: 'Mamadou' })
  @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le prénom est requis' })
  prenom: string;

  @ApiProperty({ example: 'mamadou.diallo@example.com' })
  @IsEmail({}, { message: "L'email doit être une adresse email valide" })
  @IsNotEmpty({ message: "L'email est requis" })
  email: string;

  @ApiPropertyOptional({ example: '+221 77 123 45 67' })
  @IsOptional()
  @IsString({ message: 'Le téléphone doit être une chaîne de caractères' })
  telephone?: string;

  @ApiProperty({ example: 'motdepasse123', minLength: 6 })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @MinLength(6, {
    message: 'Le mot de passe doit contenir au moins 6 caractères',
  })
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  password: string;

  @ApiProperty({ enum: Role, example: Role.Laveur })
  @IsEnum(Role, {
    message: `Le rôle doit être l'une des valeurs suivantes : ${Object.values(Role).join(', ')}`,
  })
  @IsNotEmpty({ message: 'Le rôle est requis' })
  role: Role;

  @ApiPropertyOptional({ example: 500, description: 'Bonus par lavage (laveurs uniquement)' })
  @IsOptional()
  @IsNumber({}, { message: 'Le bonus doit être un nombre' })
  @Min(0, { message: 'Le bonus ne peut pas être négatif' })
  bonusParLavage?: number;

  @ApiPropertyOptional({ example: 10, description: 'Objectif journalier (commerciaux uniquement)' })
  @IsOptional()
  @IsNumber({}, { message: "L'objectif doit être un nombre" })
  @Min(1, { message: "L'objectif doit être au moins 1" })
  objectifJournalier?: number;

  @ApiPropertyOptional({ example: false, description: 'Accès global à toutes les stations (comptable uniquement)' })
  @IsOptional()
  @IsBoolean({ message: 'globalAccess doit être un booléen' })
  globalAccess?: boolean;
}
