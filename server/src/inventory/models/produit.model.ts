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
import { MouvementStock } from './mouvement-stock.model.js';
import { ProductCategory } from '../../common/constants/status.enum.js';

@Table({ tableName: 'produits', timestamps: true })
export class Produit extends Model {
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

  @Column({
    type: DataType.ENUM(...Object.values(ProductCategory)),
    allowNull: false,
  })
  declare categorie: ProductCategory;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare quantiteStock: number;

  @Column({ type: DataType.INTEGER, defaultValue: 10 })
  declare quantiteAlerte: number;

  @Column({ type: DataType.DECIMAL(10, 2) })
  declare prix: number;

  @Column({ type: DataType.DECIMAL(10, 2), defaultValue: 0 })
  declare prixRevient: number;

  @Column({ type: DataType.STRING })
  declare unite: string;

  @BelongsTo(() => Station)
  declare station: Station;

  @HasMany(() => MouvementStock)
  declare mouvements: MouvementStock[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
