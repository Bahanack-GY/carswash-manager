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

@Table({ tableName: 'vehicles', timestamps: true })
export class Vehicle extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Client)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare clientId: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare immatriculation: string;

  @Column({ type: DataType.STRING })
  declare modele: string;

  @Column({ type: DataType.STRING })
  declare color: string;

  @Column({ type: DataType.STRING })
  declare type: string;

  @Column({ type: DataType.STRING })
  declare brand: string;

  @BelongsTo(() => Client)
  declare client: Client;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
