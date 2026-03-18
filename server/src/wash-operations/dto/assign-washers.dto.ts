import { IsArray, IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignWashersDto {
  @ApiProperty({
    example: [1, 2],
    description: 'IDs des laveurs à assigner au coupon',
    type: [Number],
  })
  @IsArray({ message: 'washerIds doit être un tableau' })
  @IsInt({ each: true, message: 'Chaque washerId doit être un entier' })
  @IsNotEmpty({ message: 'washerIds est requis' })
  washerIds: number[];
}
