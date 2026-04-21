import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  Index,
} from 'sequelize-typescript';
import { Station } from '../../stations/models/station.model.js';
import { User } from '../../users/models/user.model.js';
import { Vehicle } from './vehicle.model.js';
import { Subscription } from './subscription.model.js';

@Table({ tableName: 'clients', timestamps: true })
export class Client extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Index
  @ForeignKey(() => Station)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare stationId: number;

  @Index
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare commercialId: number | null;

  @BelongsTo(() => Station)
  declare station: Station;

  @BelongsTo(() => User, { foreignKey: 'commercialId', as: 'commercial' })
  declare commercial: User;

  @Column({ type: DataType.STRING, allowNull: false })
  declare nom: string;

  @Column({ type: DataType.STRING })
  declare contact: string;

  @Column({ type: DataType.STRING })
  declare quartier: string;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare pointsFidelite: number;

  @HasMany(() => Vehicle)
  declare vehicles: Vehicle[];

  @HasMany(() => Subscription)
  declare subscriptions: Subscription[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
