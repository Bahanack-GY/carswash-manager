import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { ChatbotController } from './chatbot.controller.js';
import { ChatbotService } from './chatbot.service.js';
import { SchemaService } from './services/schema.service.js';
import { PromptService } from './services/prompt.service.js';
import { OllamaService } from './services/ollama.service.js';
import { QuerySandboxService } from './services/query-sandbox.service.js';

@Module({
  imports: [ConfigModule],
  controllers: [ChatbotController],
  providers: [
    ChatbotService,
    SchemaService,
    PromptService,
    OllamaService,
    QuerySandboxService,
    {
      provide: 'CHATBOT_DB_POOL',
      useFactory: (config: ConfigService) => {
        return new Pool({
          host: config.get('DB_HOST', 'localhost'),
          port: config.get<number>('DB_PORT', 5432),
          database: config.get('DB_NAME', 'lis_car_wash'),
          user: config.get('AI_DB_USER', 'ai_chatbot_user'),
          password: config.get('AI_DB_PASSWORD', 'ai_chatbot_password'),
          max: 5,
          statement_timeout: 10_000,
          idle_timeout: 30_000,
        } as any);
      },
      inject: [ConfigService],
    },
  ],
  exports: [ChatbotService],
})
export class ChatbotModule {}
