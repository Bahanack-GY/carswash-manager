import { PartialType } from '@nestjs/swagger';
import { CreateProduitDto } from './create-produit.dto.js';

export class UpdateProduitDto extends PartialType(CreateProduitDto) {}
