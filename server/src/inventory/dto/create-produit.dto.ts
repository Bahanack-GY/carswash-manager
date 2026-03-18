import {
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsNumber,
  IsString,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductCategory } from '../../common/constants/status.enum.js';

export class CreateProduitDto {
  @ApiProperty({ example: 1, description: 'ID de la station' })
  @IsInt({ message: 'Le stationId doit être un entier' })
  @IsNotEmpty({ message: 'Le stationId est requis' })
  stationId: number;

  @ApiProperty({ example: 'Shampoing auto', description: 'Nom du produit' })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom est requis' })
  nom: string;

  @ApiProperty({
    enum: ProductCategory,
    example: ProductCategory.Chimique,
    description: 'Catégorie du produit',
  })
  @IsEnum(ProductCategory, {
    message: `La catégorie doit être l'une des valeurs suivantes : ${Object.values(ProductCategory).join(', ')}`,
  })
  @IsNotEmpty({ message: 'La catégorie est requise' })
  categorie: ProductCategory;

  @ApiPropertyOptional({ example: 50, description: 'Quantité en stock' })
  @IsOptional()
  @IsInt({ message: 'La quantité en stock doit être un entier' })
  quantiteStock?: number;

  @ApiPropertyOptional({
    example: 10,
    description: "Seuil d'alerte de stock",
    default: 10,
  })
  @IsOptional()
  @IsInt({ message: "La quantité d'alerte doit être un entier" })
  quantiteAlerte?: number;

  @ApiPropertyOptional({ example: 2500.0, description: 'Prix du produit' })
  @IsOptional()
  @IsNumber({}, { message: 'Le prix doit être un nombre' })
  prix?: number;

  @ApiPropertyOptional({ example: 'litre', description: 'Unité de mesure' })
  @IsOptional()
  @IsString({ message: "L'unité doit être une chaîne de caractères" })
  unite?: string;

  @ApiPropertyOptional({ example: 1500.0, description: 'Prix de revient (coût d\'achat)' })
  @IsOptional()
  @IsNumber({}, { message: 'Le prix de revient doit être un nombre' })
  prixRevient?: number;
}
