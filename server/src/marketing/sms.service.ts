import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly provider: string;
  private readonly apiKey: string;
  private readonly sender: string;

  constructor(private readonly configService: ConfigService) {
    this.provider = this.configService.get('SMS_PROVIDER', 'log');
    this.apiKey = this.configService.get('SMS_API_KEY', '');
    this.sender = this.configService.get('SMS_SENDER', 'LIS Car Wash');
  }

  async send(
    to: string,
    message: string,
  ): Promise<{ success: boolean; error?: string }> {
    switch (this.provider) {
      case 'log':
        return this.sendLog(to, message);
      default:
        this.logger.warn(
          `Unknown SMS provider "${this.provider}", falling back to log`,
        );
        return this.sendLog(to, message);
    }
  }

  private async sendLog(
    to: string,
    message: string,
  ): Promise<{ success: boolean; error?: string }> {
    this.logger.log(`[SMS → ${to}] ${message}`);
    return { success: true };
  }
}
