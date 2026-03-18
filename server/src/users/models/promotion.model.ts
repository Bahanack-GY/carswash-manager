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
import { Role } from '../../common/constants/roles.enum.js';

@Table({ tableName: 'promotions', timestamps: true })
export class Promotion extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare userId: number;

  @Column({
    type: DataType.ENUM(...Object.values(Role)),
    allowNull: false,
  })
  declare ancienRole: Role;

  @Column({
    type: DataType.ENUM(...Object.values(Role)),
    allowNull: false,
  })
  declare nouveauRole: Role;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare motif: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare date: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare createdBy: number;

  @BelongsTo(() => User, 'userId')
  declare user: User;

  @BelongsTo(() => User, 'createdBy')
  declare promoteur: User;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
