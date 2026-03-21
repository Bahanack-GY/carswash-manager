import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  BelongsToMany,
  HasMany,
  HasOne,
  CreatedAt,
  UpdatedAt,
  Index,
} from 'sequelize-typescript';
import { FichePiste } from './fiche-piste.model.js';
import { User } from '../../users/models/user.model.js';
import { CouponWashers } from './coupon-washers.model.js';
import { Paiement } from '../../billing/models/paiement.model.js';
import { MarketingPromotion } from '../../marketing/models/promotion.model.js';
import { CouponStatus } from '../../common/constants/status.enum.js';

@Table({ tableName: 'coupons', timestamps: true })
export class Coupon extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare numero: string;

  @Index
  @ForeignKey(() => FichePiste)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare fichePisteId: number;

  @Index
  @Column({
    type: DataType.ENUM(...Object.values(CouponStatus)),
    defaultValue: CouponStatus.Pending,
  })
  declare statut: CouponStatus;

  @Column({ type: DataType.DECIMAL(10, 2), defaultValue: 0 })
  declare montantTotal: number;

  @ForeignKey(() => MarketingPromotion)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare promotionId: number | null;

  @BelongsTo(() => MarketingPromotion)
  declare promotion: MarketingPromotion | null;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  declare remise: number | null;

  @BelongsTo(() => FichePiste)
  declare fichePiste: FichePiste;

  @BelongsToMany(() => User, () => CouponWashers)
  declare washers: User[];

  @HasMany(() => Paiement)
  declare paiements: Paiement[];

  @Column({ type: DataType.DATE, allowNull: true })
  declare washingStartedAt: Date | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
