import { PartialType } from '@nestjs/swagger';
import { CreateTypeLavageDto } from './create-type-lavage.dto.js';

export class UpdateTypeLavageDto extends PartialType(CreateTypeLavageDto) {}
