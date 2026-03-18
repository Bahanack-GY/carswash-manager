import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../users/models/user.model.js';
import { Affectation } from '../users/models/affectation.model.js';
import { AffectationStatus } from '../common/constants/status.enum.js';
import { LoginDto } from './dto/login.dto.js';
import type { JwtPayload } from './jwt.strategy.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Affectation)
    private readonly affectationModel: typeof Affectation,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userModel.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    if (!user.actif) {
      throw new UnauthorizedException('Ce compte est désactivé');
    }

    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload as any);
    const refreshToken = this.generateRefreshToken(payload);

    const affectations = await this.affectationModel.findAll({
      where: { userId: user.id, statut: AffectationStatus.Active },
      attributes: ['stationId'],
    });
    const stationIds = affectations.map((a) => a.stationId);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
        role: user.role,
        globalAccess: user.globalAccess,
        stationIds,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.userModel.findByPk(payload.sub);

      if (!user || !user.actif) {
        throw new UnauthorizedException('Refresh token invalide');
      }

      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(newPayload as any);
      const newRefreshToken = this.generateRefreshToken(newPayload);

      return {
        access_token: accessToken,
        refresh_token: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }
  }

  async getProfile(userId: number) {
    const user = await this.userModel.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    const affectations = await this.affectationModel.findAll({
      where: {
        userId: user.id,
        statut: AffectationStatus.Active,
      },
      attributes: ['stationId'],
    });

    const stationIds = affectations.map((a) => a.stationId);

    return {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      role: user.role,
      globalAccess: user.globalAccess,
      actif: user.actif,
      stationIds,
    };
  }

  private generateRefreshToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload as any, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>(
        'JWT_REFRESH_EXPIRES_IN',
        '7d',
      ) as any,
    });
  }
}
