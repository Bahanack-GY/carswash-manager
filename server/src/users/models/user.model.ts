import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  CreatedAt,
  UpdatedAt,
  BeforeCreate,
  BeforeUpdate,
} from 'sequelize-typescript';
import { Role } from '../../common/constants/roles.enum.js';
import { Affectation } from './affectation.model.js';
import { Performance } from './performance.model.js';
import { Sanction } from './sanction.model.js';
import { Promotion } from './promotion.model.js';
import * as bcrypt from 'bcrypt';

@Table({ tableName: 'users', timestamps: true })
export class User extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare nom: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare prenom: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare email: string;

  @Column({ type: DataType.STRING })
  declare telephone: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare password: string;

  @Column({
    type: DataType.ENUM(...Object.values(Role)),
    allowNull: false,
  })
  declare role: Role;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare actif: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare globalAccess: boolean;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  declare bonusParLavage: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare objectifJournalier: number | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare profilePicture: string | null;

  @HasMany(() => Affectation)
  declare affectations: Affectation[];

  @HasMany(() => Performance)
  declare performances: Performance[];

  @HasMany(() => Sanction, 'userId')
  declare sanctions: Sanction[];

  @HasMany(() => Promotion, 'userId')
  declare promotions: Promotion[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BeforeCreate
  @BeforeUpdate
  static async hashPassword(instance: User) {
    if (instance.changed('password')) {
      const salt = await bcrypt.genSalt(10);
      instance.password = await bcrypt.hash(instance.password, salt);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
