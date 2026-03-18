import { PartialType } from '@nestjs/swagger';
import { CreateCommandeAchatDto } from './create-commande-achat.dto.js';

export class UpdateCommandeAchatDto extends PartialType(
  CreateCommandeAchatDto,
) {}
