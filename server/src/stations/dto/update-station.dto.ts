import { PartialType } from '@nestjs/swagger';
import { CreateStationDto } from './create-station.dto.js';

export class UpdateStationDto extends PartialType(CreateStationDto) {}
