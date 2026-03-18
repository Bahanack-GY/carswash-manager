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
import { Campaign } from './campaign.model.js';
import { Client } from '../../clients/models/client.model.js';

export enum RecipientStatus {
  Pending = 'pending',
  Sent = 'sent',
  Failed = 'failed',
}

@Table({ tableName: 'campaign_recipients', timestamps: true })
export class CampaignRecipient extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Campaign)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare campaignId: number;

  @ForeignKey(() => Client)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare clientId: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare telephone: string;

  @Column({
    type: DataType.ENUM(...Object.values(RecipientStatus)),
    defaultValue: RecipientStatus.Pending,
  })
  declare status: RecipientStatus;

  @Column({ type: DataType.DATE, allowNull: true })
  declare sentAt: Date | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare error: string | null;

  @BelongsTo(() => Campaign)
  declare campaign: Campaign;

  @BelongsTo(() => Client)
  declare client: Client;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
