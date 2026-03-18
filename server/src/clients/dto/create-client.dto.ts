import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiPropertyOptional({ example: 1, description: 'ID de la station' })
  @IsOptional()
  @IsInt({ message: 'Le stationId doit être un entier' })
  stationId?: number;

  @ApiProperty({ example: 'Mamadou Diallo' })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom est requis' })
  nom: string;

  @ApiPropertyOptional({ example: '+221 77 123 45 67' })
  @IsOptional()
  @IsString({ message: 'Le contact doit être une chaîne de caractères' })
  contact?: string;

  @ApiPropertyOptional({ example: 'mamadou@example.com' })
  @IsOptional()
  @IsEmail({}, { message: "L'email doit être une adresse email valide" })
  email?: string;

  @ApiPropertyOptional({ example: 'Plateau' })
  @IsOptional()
  @IsString({ message: 'Le quartier doit être une chaîne de caractères' })
  quartier?: string;
}
