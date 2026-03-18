import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Coupon } from '../../wash-operations/models/coupon.model.js';
import { Station } from '../../stations/models/station.model.js';
import { Client } from '../../clients/models/client.model.js';
import { Paiement } from './paiement.model.js';
import { LigneVente } from './ligne-vente.model.js';

@Table({ tableName: 'factures', timestamps: true })
export class Facture extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare numero: string;

  @ForeignKey(() => Coupon)
  @Column({ type: DataType.INTEGER })
  declare couponId: number;

  @ForeignKey(() => Station)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare stationId: number;

  @ForeignKey(() => Client)
  @Column({ type: DataType.INTEGER })
  declare clientId: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare montantTotal: number;

  @Column({ type: DataType.DECIMAL(10, 2), defaultValue: 0 })
  declare tva: number;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare date: string;

  @BelongsTo(() => Coupon)
  declare coupon: Coupon;

  @BelongsTo(() => Station)
  declare station: Station;

  @BelongsTo(() => Client)
  declare client: Client;

  @HasMany(() => Paiement)
  declare paiements: Paiement[];

  @HasMany(() => LigneVente)
  declare lignes: LigneVente[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
