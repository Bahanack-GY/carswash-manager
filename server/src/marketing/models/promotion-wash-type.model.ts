import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import { MarketingPromotion } from './promotion.model.js';
import { TypeLavage } from '../../wash-operations/models/type-lavage.model.js';

@Table({ tableName: 'promotion_wash_types', timestamps: false })
export class PromotionWashType extends Model {
  @ForeignKey(() => MarketingPromotion)
  @Column({ type: DataType.INTEGER, primaryKey: true })
  declare promotionId: number;

  @ForeignKey(() => TypeLavage)
  @Column({ type: DataType.INTEGER, primaryKey: true })
  declare typeLavageId: number;
}
