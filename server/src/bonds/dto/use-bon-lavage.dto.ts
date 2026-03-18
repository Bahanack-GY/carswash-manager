import { IsNotEmpty, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UseBonLavageDto {
  @ApiProperty({ example: 42, description: 'ID du coupon payé avec ce bon' })
  @IsInt({ message: 'Le couponId doit être un entier' })
  @IsNotEmpty({ message: 'Le couponId est requis' })
  couponId: number;
}
