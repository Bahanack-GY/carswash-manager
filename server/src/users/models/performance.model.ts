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

@Table({
  tableName: 'performances',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'stationId', 'date'] },
  ],
})
export class Performance extends Model {
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

  @Index
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
