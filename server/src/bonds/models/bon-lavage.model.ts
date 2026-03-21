import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  Index,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model.js';
import { Coupon } from '../../wash-operations/models/coupon.model.js';
import { Station } from '../../stations/models/station.model.js';

@Table({ tableName: 'bons_lavage', timestamps: true })
export class BonLavage extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare code: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare pourcentage: number;

  @Index
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare isUsed: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  declare usedAt: Date | null;

  @ForeignKey(() => Coupon)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare couponId: number | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare createdById: number;

  @Index
  @ForeignKey(() => Station)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare stationId: number | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare description: string | null;

  @BelongsTo(() => User)
  declare createdBy: User;

  @BelongsTo(() => Coupon)
  declare coupon: Coupon;

  @BelongsTo(() => Station)
  declare station: Station;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
