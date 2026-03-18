import { PartialType } from '@nestjs/swagger';
import { CreateServiceSpecialDto } from './create-service-special.dto.js';

export class UpdateServiceSpecialDto extends PartialType(CreateServiceSpecialDto) {}
