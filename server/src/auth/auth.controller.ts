import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { LoginDto, RefreshTokenDto } from './dto/login.dto.js';
import { Public } from '../common/decorators/public.decorator.js';

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('login')
  @ApiOperation({ summary: 'Connexion utilisateur' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Connexion réussie, retourne les tokens JWT et les infos utilisateur',
  })
  @ApiResponse({ status: 401, description: 'Identifiants incorrects' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Rafraîchir le token JWT' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Nouveaux tokens JWT générés',
  })
  @ApiResponse({ status: 401, description: 'Refresh token invalide ou expiré' })
  async refresh(@Body() refreshDto: RefreshTokenDto) {
    return this.authService.refresh(refreshDto.refresh_token);
  }

  @Get('me')
  @ApiOperation({ summary: 'Récupérer le profil de l\'utilisateur connecté' })
  @ApiResponse({
    status: 200,
    description: 'Profil utilisateur avec stations affectées',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }
}
