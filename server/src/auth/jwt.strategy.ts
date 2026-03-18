import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectModel } from '@nestjs/sequelize';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from '../users/models/user.model.js';
import { Affectation } from '../users/models/affectation.model.js';
import { AffectationStatus } from '../common/constants/status.enum.js';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Affectation)
    private readonly affectationModel: typeof Affectation,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userModel.findByPk(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    if (!user.actif) {
      throw new UnauthorizedException('Ce compte est désactivé');
    }

    // Load active station affectations
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
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
      globalAccess: user.globalAccess,
      telephone: user.telephone ?? null,
      stationIds,
    };
  }
}
