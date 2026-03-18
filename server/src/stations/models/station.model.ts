import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { StationStatus } from '../../common/constants/status.enum.js';

@Table({ tableName: 'stations', timestamps: true })
export class Station extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare nom: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare adresse: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare town: string;

  @Column({ type: DataType.STRING })
  declare contact: string;

  @Column({
    type: DataType.ENUM(...Object.values(StationStatus)),
    defaultValue: StationStatus.Active,
  })
  declare status: StationStatus;

  @Column({ type: DataType.INTEGER, defaultValue: 10 })
  declare objectifCommercialJournalier: number;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
