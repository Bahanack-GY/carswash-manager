import { IsNotEmpty, IsOptional, IsInt, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFournisseurDto {
  @ApiProperty({ example: 1, description: 'ID de la station' })
  @IsInt({ message: 'Le stationId doit être un entier' })
  @IsNotEmpty({ message: 'Le stationId est requis' })
  stationId: number;

  @ApiProperty({
    example: 'ChimPro SARL',
    description: 'Nom du fournisseur',
  })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom est requis' })
  nom: string;

  @ApiPropertyOptional({
    example: '+221 77 123 45 67',
    description: 'Contact du fournisseur',
  })
  @IsOptional()
  @IsString({ message: 'Le contact doit être une chaîne de caractères' })
  contact?: string;
}
