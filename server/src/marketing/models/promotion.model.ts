import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  BelongsToMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Station } from '../../stations/models/station.model.js';
import { User } from '../../users/models/user.model.js';
import { ServiceSpecial } from '../../wash-operations/models/service-special.model.js';
import { TypeLavage } from '../../wash-operations/models/type-lavage.model.js';
import { PromotionWashType } from './promotion-wash-type.model.js';

export enum PromotionType {
  Discount = 'discount',
  ServiceOffert = 'service_offert',
}

export enum DiscountType {
  Percentage = 'percentage',
  Fixed = 'fixed',
}

@Table({ tableName: 'marketing_promotions', timestamps: true })
export class MarketingPromotion extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare nom: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(PromotionType)),
    allowNull: false,
  })
  declare type: PromotionType;

  @Column({
    type: DataType.ENUM(...Object.values(DiscountType)),
    allowNull: true,
  })
  declare discountType: DiscountType | null;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  declare discountValue: number | null;

  @ForeignKey(() => ServiceSpecial)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare serviceSpecialId: number | null;

  @BelongsTo(() => ServiceSpecial)
  declare serviceSpecial: ServiceSpecial | null;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare minVisits: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare maxUses: number | null;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare usedCount: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare isActive: boolean;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare startDate: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare endDate: string;

  @ForeignKey(() => Station)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare stationId: number | null;

  @BelongsTo(() => Station)
  declare station: Station | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare createdBy: number;

  @BelongsTo(() => User, { foreignKey: 'createdBy' })
  declare creator: User;

  @BelongsToMany(() => TypeLavage, () => PromotionWashType)
  declare washTypes: TypeLavage[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
