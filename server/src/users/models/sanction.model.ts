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
import {
  SanctionType,
  SanctionStatus,
} from '../../common/constants/status.enum.js';

@Table({ tableName: 'sanctions', timestamps: true })
export class Sanction extends Model {
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

  @Column({
    type: DataType.ENUM(...Object.values(SanctionType)),
    allowNull: false,
  })
  declare type: SanctionType;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare motif: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare dateDebut: string;

  @Column({ type: DataType.DATEONLY })
  declare dateFin: string;

  @Index
  @Column({
    type: DataType.ENUM(...Object.values(SanctionStatus)),
    defaultValue: SanctionStatus.Active,
  })
  declare statut: SanctionStatus;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare createdBy: number;

  @Column({ type: DataType.TEXT })
  declare noteLevee: string;

  @BelongsTo(() => User, 'userId')
  declare user: User;

  @BelongsTo(() => User, 'createdBy')
  declare createur: User;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
