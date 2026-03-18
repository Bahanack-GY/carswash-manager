import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsObject,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateTemplateDto {
  @IsString({ message: 'Le nom doit être une chaîne' })
  @IsNotEmpty({ message: 'Le nom est requis' })
  nom: string;

  @IsString({ message: 'Le contenu doit être une chaîne' })
  @IsNotEmpty({ message: 'Le contenu est requis' })
  contenu: string;
}

export class UpdateTemplateDto extends PartialType(CreateTemplateDto) {}

export class CreateCampaignDto {
  @IsString({ message: 'Le nom doit être une chaîne' })
  @IsNotEmpty({ message: 'Le nom est requis' })
  nom: string;

  @IsOptional()
  @IsNumber({}, { message: 'Le templateId doit être un nombre' })
  templateId?: number;

  @IsOptional()
  @IsString({ message: 'Le message doit être une chaîne' })
  customMessage?: string;

  @IsOptional()
  @IsString({ message: 'Le segment doit être une chaîne' })
  segment?: string;

  @IsOptional()
  @IsObject({ message: 'Les filtres doivent être un objet' })
  filters?: Record<string, any>;
}
