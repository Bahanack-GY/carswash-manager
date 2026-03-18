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
import { Client } from '../../clients/models/client.model.js';
import { Vehicle } from '../../clients/models/vehicle.model.js';
import { Station } from '../../stations/models/station.model.js';
import { ReservationStatus } from '../../common/constants/status.enum.js';

@Table({ tableName: 'reservations', timestamps: true })
export class Reservation extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare numero: string;

  @ForeignKey(() => Client)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare clientId: number;

  @ForeignKey(() => Vehicle)
  @Column({ type: DataType.INTEGER })
  declare vehicleId: number;

  @ForeignKey(() => Station)
  @Column({ type: DataType.INTEGER })
  declare stationId: number;

  @Column({ type: DataType.INTEGER })
  declare typeLavageId: number;

  @Column({ type: DataType.DATE, allowNull: false })
  declare dateHeureApport: Date;

  @Column({
    type: DataType.ENUM(...Object.values(ReservationStatus)),
    defaultValue: ReservationStatus.Pending,
  })
  declare statut: ReservationStatus;

  @BelongsTo(() => Client)
  declare client: Client;

  @BelongsTo(() => Vehicle)
  declare vehicle: Vehicle;

  @BelongsTo(() => Station)
  declare station: Station;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
