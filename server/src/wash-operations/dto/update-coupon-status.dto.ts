import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CouponStatus } from '../../common/constants/status.enum.js';

export class UpdateCouponStatusDto {
  @ApiProperty({
    enum: CouponStatus,
    description: 'Nouveau statut du coupon',
    example: CouponStatus.Washing,
  })
  @IsEnum(CouponStatus, {
    message: `Le statut doit être l'une des valeurs suivantes : ${Object.values(CouponStatus).join(', ')}`,
  })
  @IsNotEmpty({ message: 'Le statut est requis' })
  statut: CouponStatus;
}
