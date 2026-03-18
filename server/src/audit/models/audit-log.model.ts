import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  Index,
} from 'sequelize-typescript';

@Table({ tableName: 'audit_logs', timestamps: false })
export class AuditLog extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  // ── WHO ──────────────────────────────────────────────────────────

  @Index
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare userId: number | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare userName: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare userRole: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare userPhone: string | null;

  // ── WHAT ─────────────────────────────────────────────────────────

  @Column({ type: DataType.STRING, allowNull: false })
  declare action: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare actionLabel: string;

  @Index
  @Column({ type: DataType.STRING, allowNull: false })
  declare entity: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare entityId: string | null;

  // ── WHERE ────────────────────────────────────────────────────────

  @Index
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare stationId: number | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare stationName: string | null;

  // ── WHEN ─────────────────────────────────────────────────────────

  @Index
  @CreatedAt
  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  declare timestamp: Date;

  // ── DETAILS ──────────────────────────────────────────────────────

  @Column({ type: DataType.STRING, allowNull: false })
  declare route: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare statusCode: number | null;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare requestBody: Record<string, any> | null;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare metadata: Record<string, any> | null;
}
