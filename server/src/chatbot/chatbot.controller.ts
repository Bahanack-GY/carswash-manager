import { Body, Controller, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../common/constants/roles.enum.js';
import { ChatbotService } from './chatbot.service.js';
import { ChatQueryDto } from './dto/chat-query.dto.js';

@ApiTags('Chatbot IA')
@ApiBearerAuth()
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('query')
  @Roles(Role.SuperAdmin, Role.Manager, Role.Comptable)
  @ApiOperation({
    summary: 'Poser une question en langage naturel sur la base de données',
  })
  @ApiResponse({ status: 200, description: 'Résultat de la requête' })
  @ApiResponse({ status: 400, description: 'Question invalide' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  async query(@Body() dto: ChatQueryDto, @Req() req: any) {
    const stationId = req.stationId as number | undefined;
    return this.chatbotService.query(dto.question, stationId);
  }
}
