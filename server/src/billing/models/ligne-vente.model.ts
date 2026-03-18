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

@Table({ tableName: 'lignes_vente', timestamps: true })
export class LigneVente extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Facture)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare factureId: number;

  @Column({ type: DataType.INTEGER })
  declare produitId: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare quantite: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare prixUnitaire: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare sousTotal: number;

  @BelongsTo(() => Facture)
  declare facture: Facture;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
