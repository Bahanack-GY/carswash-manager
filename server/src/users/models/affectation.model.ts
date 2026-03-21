import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  Index,
} from 'sequelize-typescript';
import { User } from './user.model.js';
import { Station } from '../../stations/models/station.model.js';
import { AffectationStatus } from '../../common/constants/status.enum.js';

@Table({ tableName: 'affectations', timestamps: true })
export class Affectation extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Index
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare userId: number;

  @Index
  @ForeignKey(() => Station)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare stationId: number;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare dateDebut: string;

  @Column({ type: DataType.DATEONLY })
  declare dateFin: string;

  @Index
  @Column({
    type: DataType.ENUM(...Object.values(AffectationStatus)),
    defaultValue: AffectationStatus.Active,
  })
  declare statut: AffectationStatus;

  @BelongsTo(() => User)
  declare user: User;

  @BelongsTo(() => Station)
  declare station: Station;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
