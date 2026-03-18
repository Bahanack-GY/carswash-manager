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
import { Client } from './client.model.js';
import { SubscriptionType } from '../../common/constants/status.enum.js';

@Table({ tableName: 'subscriptions', timestamps: true })
export class Subscription extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Client)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare clientId: number;

  @Column({
    type: DataType.ENUM(...Object.values(SubscriptionType)),
    allowNull: false,
  })
  declare type: SubscriptionType;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare dateDebut: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare dateFin: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare actif: boolean;

  @BelongsTo(() => Client)
  declare client: Client;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
