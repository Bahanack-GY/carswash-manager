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
import { User } from '../../users/models/user.model.js';
import { Station } from '../../stations/models/station.model.js';

@Table({ tableName: 'sms_templates', timestamps: true })
export class SmsTemplate extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare nom: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare contenu: string;

  @ForeignKey(() => Station)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare stationId: number | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare createdBy: number;

  @BelongsTo(() => Station)
  declare station: Station;

  @BelongsTo(() => User)
  declare creator: User;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
