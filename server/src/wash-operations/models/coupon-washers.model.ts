import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import { Coupon } from './coupon.model.js';
import { User } from '../../users/models/user.model.js';

@Table({ tableName: 'coupon_washers', timestamps: false })
export class CouponWashers extends Model {
  @ForeignKey(() => Coupon)
  @Column({ type: DataType.INTEGER, primaryKey: true })
  declare couponId: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, primaryKey: true })
  declare userId: number;
}
