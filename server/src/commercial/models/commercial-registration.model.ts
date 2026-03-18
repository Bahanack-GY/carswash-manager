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
import { Vehicle } from '../../clients/models/vehicle.model.js';
import { Station } from '../../stations/models/station.model.js';
import { Coupon } from '../../wash-operations/models/coupon.model.js';

@Table({ tableName: 'commercial_registrations', timestamps: true })
export class CommercialRegistration extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare commercialId: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare immatriculation: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare prospectNom: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare prospectTelephone: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare prospectEmail: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare prospectQuartier: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare vehicleModele: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare vehicleBrand: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare vehicleColor: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare vehicleType: string | null;

  @ForeignKey(() => Vehicle)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare vehicleId: number | null;

  @ForeignKey(() => Station)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare stationId: number;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare date: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare confirmed: boolean;

  @ForeignKey(() => Coupon)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare couponId: number;

  @BelongsTo(() => User)
  declare commercial: User;

  @BelongsTo(() => Vehicle)
  declare vehicle: Vehicle;

  @BelongsTo(() => Station)
  declare station: Station;

  @BelongsTo(() => Coupon)
  declare coupon: Coupon;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
