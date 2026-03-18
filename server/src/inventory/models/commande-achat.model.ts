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
import { Fournisseur } from './fournisseur.model.js';
import { CommandeStatus } from '../../common/constants/status.enum.js';

@Table({ tableName: 'commandes_achat', timestamps: true })
export class CommandeAchat extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare numero: string;

  @ForeignKey(() => Fournisseur)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare fournisseurId: number;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare date: string;

  @Column({
    type: DataType.ENUM(...Object.values(CommandeStatus)),
    defaultValue: CommandeStatus.Pending,
  })
  declare statut: CommandeStatus;

  @BelongsTo(() => Fournisseur)
  declare fournisseur: Fournisseur;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
