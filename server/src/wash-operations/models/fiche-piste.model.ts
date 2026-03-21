import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  BelongsToMany,
  HasOne,
  CreatedAt,
  UpdatedAt,
  Index,
} from 'sequelize-typescript';
import { Station } from '../../stations/models/station.model.js';
import { Vehicle } from '../../clients/models/vehicle.model.js';
import { Client } from '../../clients/models/client.model.js';
import { User } from '../../users/models/user.model.js';
import { TypeLavage } from './type-lavage.model.js';
import { ServiceSpecial } from './service-special.model.js';
import { FicheExtras } from './fiche-extras.model.js';
import { Coupon } from './coupon.model.js';
import { FichePisteStatus } from '../../common/constants/status.enum.js';

@Table({
  tableName: 'fiches_piste',
  timestamps: true,
  indexes: [
    { fields: ['stationId', 'date'] },
  ],
})
export class FichePiste extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare numero: string;

  @Index
  @ForeignKey(() => Station)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare stationId: number;

  @ForeignKey(() => Vehicle)
  @Column({ type: DataType.INTEGER })
  declare vehicleId: number;

  @Index
  @ForeignKey(() => Client)
  @Column({ type: DataType.INTEGER })
  declare clientId: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER })
  declare controleurId: number;

  @ForeignKey(() => TypeLavage)
  @Column({ type: DataType.INTEGER })
  declare typeLavageId: number;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare date: string;

  @Column({ type: DataType.TEXT })
  declare etatLieu: string;

  @Index
  @Column({
    type: DataType.ENUM(...Object.values(FichePisteStatus)),
    defaultValue: FichePisteStatus.Open,
  })
  declare statut: FichePisteStatus;

  @BelongsTo(() => Station)
  declare station: Station;

  @BelongsTo(() => Vehicle)
  declare vehicle: Vehicle;

  @BelongsTo(() => Client)
  declare client: Client;

  @BelongsTo(() => User)
  declare controleur: User;

  @BelongsTo(() => TypeLavage)
  declare typeLavage: TypeLavage;

  @BelongsToMany(() => ServiceSpecial, () => FicheExtras)
  declare extras: ServiceSpecial[];

  @HasOne(() => Coupon)
  declare coupon: Coupon;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
