import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import { FichePiste } from './fiche-piste.model.js';
import { ServiceSpecial } from './service-special.model.js';

@Table({ tableName: 'fiche_extras', timestamps: false })
export class FicheExtras extends Model {
  @ForeignKey(() => FichePiste)
  @Column({ type: DataType.INTEGER, primaryKey: true })
  declare fichePisteId: number;

  @ForeignKey(() => ServiceSpecial)
  @Column({ type: DataType.INTEGER, primaryKey: true })
  declare serviceSpecialId: number;
}
