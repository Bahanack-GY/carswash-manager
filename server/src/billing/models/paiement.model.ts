import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Facture } from './facture.model.js';
import { User } from '../../users/models/user.model.js';
import { Coupon } from '../../wash-operations/models/coupon.model.js';
import { PaymentMethod, TransactionType } from '../../common/constants/status.enum.js';

@Table({ tableName: 'paiements', timestamps: true })
export class Paiement extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Facture)
  @Column({ type: DataType.INTEGER })
  declare factureId: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER })
  declare userId: number;

  @Column({
    type: DataType.ENUM(...Object.values(PaymentMethod)),
    allowNull: false,
  })
  declare methode: PaymentMethod;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare montant: number;

  @Column({ type: DataType.STRING })
  declare referenceExterne: string;

  @Column({
    type: DataType.ENUM(...Object.values(TransactionType)),
    defaultValue: TransactionType.Income,
  })
  declare type: TransactionType;

  @Column({ type: DataType.STRING })
  declare description: string;

  @Column({ type: DataType.INTEGER })
  declare stationId: number;

  @Column({ type: DataType.STRING, allowNull: true })
  declare categorie: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare justificatif: string | null;

  @ForeignKey(() => Coupon)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare couponId: number | null;

  @BelongsTo(() => Facture)
  declare facture: Facture;

  @BelongsTo(() => User)
  declare user: User;

  @BelongsTo(() => Coupon)
  declare coupon: Coupon;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
