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
import { Station } from '../../stations/models/station.model.js';

@Table({ tableName: 'services_speciaux', timestamps: true })
export class ServiceSpecial extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Station)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare stationId: number;

  @BelongsTo(() => Station)
  declare station: Station;

  @Column({ type: DataType.STRING, allowNull: false })
  declare nom: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare prix: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  declare prixCatB: number | null;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  declare commission: number | null;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  declare fraisService: number | null;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  declare bonus: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare dureeEstimee: number | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare particularites: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare categorie: string | null;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'active' })
  declare statut: 'active' | 'suspended';

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
