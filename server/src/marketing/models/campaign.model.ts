import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model.js';
import { Station } from '../../stations/models/station.model.js';
import { SmsTemplate } from './sms-template.model.js';
import { CampaignRecipient } from './campaign-recipient.model.js';

export enum CampaignStatus {
  Draft = 'draft',
  Sending = 'sending',
  Sent = 'sent',
  Failed = 'failed',
}

@Table({ tableName: 'campaigns', timestamps: true })
export class Campaign extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare nom: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare message: string;

  @ForeignKey(() => SmsTemplate)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare templateId: number | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare segment: string | null;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare filters: Record<string, any> | null;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare totalRecipients: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare sentCount: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare failedCount: number;

  @Column({
    type: DataType.ENUM(...Object.values(CampaignStatus)),
    defaultValue: CampaignStatus.Draft,
  })
  declare status: CampaignStatus;

  @ForeignKey(() => Station)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare stationId: number | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare createdBy: number;

  @BelongsTo(() => SmsTemplate)
  declare template: SmsTemplate;

  @BelongsTo(() => Station)
  declare station: Station;

  @BelongsTo(() => User)
  declare creator: User;

  @HasMany(() => CampaignRecipient)
  declare recipients: CampaignRecipient[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
