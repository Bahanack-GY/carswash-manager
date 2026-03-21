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
import { Station } from '../../stations/models/station.model.js';
import { User } from '../../users/models/user.model.js';
import { IncidentStatus, IncidentSeverity } from '../../common/constants/status.enum.js';

@Table({ tableName: 'incidents', timestamps: true })
export class Incident extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Index
  @ForeignKey(() => Station)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare stationId: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare description: string;

  @Column({
    type: DataType.ENUM(...Object.values(IncidentSeverity)),
    allowNull: false,
    defaultValue: IncidentSeverity.Medium,
  })
  declare severity: IncidentSeverity;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare stopsActivity: boolean;

  @Index
  @Column({
    type: DataType.ENUM(...Object.values(IncidentStatus)),
    defaultValue: IncidentStatus.Open,
  })
  declare statut: IncidentStatus;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare dateDeclaration: string;

  @Column({ type: DataType.DATE, allowNull: true })
  declare resolvedAt: Date | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare declarantId: number;

  @BelongsTo(() => Station)
  declare station: Station;

  @BelongsTo(() => User)
  declare declarant: User;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
