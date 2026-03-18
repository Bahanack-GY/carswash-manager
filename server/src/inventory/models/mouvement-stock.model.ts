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
import { Produit } from './produit.model.js';
import { User } from '../../users/models/user.model.js';
import { MouvementType } from '../../common/constants/status.enum.js';

@Table({ tableName: 'mouvements_stock', timestamps: true })
export class MouvementStock extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Produit)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare produitId: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER })
  declare userId: number;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare date: string;

  @Column({
    type: DataType.ENUM(...Object.values(MouvementType)),
    allowNull: false,
  })
  declare typeMouvement: MouvementType;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare quantite: number;

  @Column({ type: DataType.STRING })
  declare motif: string;

  @BelongsTo(() => Produit)
  declare produit: Produit;

  @BelongsTo(() => User)
  declare user: User;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
