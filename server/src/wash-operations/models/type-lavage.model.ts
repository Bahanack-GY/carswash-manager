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

@Table({ tableName: 'types_lavage', timestamps: true })
export class TypeLavage extends Model {
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

  @Column({ type: DataType.TEXT })
  declare particularites: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare prixBase: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  declare prixCatB: number | null;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true, defaultValue: 150 })
  declare fraisService: number | null;

  @Column({ type: DataType.INTEGER })
  declare dureeEstimee: number;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'active' })
  declare statut: 'active' | 'suspended';

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
