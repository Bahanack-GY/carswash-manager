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
import { User } from './user.model.js';
import { Station } from '../../stations/models/station.model.js';

@Table({ tableName: 'performances', timestamps: true })
export class Performance extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare userId: number;

  @ForeignKey(() => Station)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare stationId: number;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare date: string;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare vehiculesLaves: number;

  @Column({ type: DataType.DECIMAL(10, 2), defaultValue: 0 })
  declare bonusEstime: number;

  @BelongsTo(() => User)
  declare user: User;

  @BelongsTo(() => Station)
  declare station: Station;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
