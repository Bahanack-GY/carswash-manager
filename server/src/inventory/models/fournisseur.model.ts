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
import { Station } from '../../stations/models/station.model.js';
import { CommandeAchat } from './commande-achat.model.js';

@Table({ tableName: 'fournisseurs', timestamps: true })
export class Fournisseur extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Station)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare stationId: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare nom: string;

  @Column({ type: DataType.STRING })
  declare contact: string;

  @BelongsTo(() => Station)
  declare station: Station;

  @HasMany(() => CommandeAchat)
  declare commandes: CommandeAchat[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
