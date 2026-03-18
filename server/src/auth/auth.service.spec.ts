import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { User } from '../users/models/user.model';
import { Affectation } from '../users/models/affectation.model';
import { Role } from '../common/constants/roles.enum';

describe('AuthService', () => {
    let service: AuthService;
    let userModel: any;
    let affectationModel: any;
    let jwtService: JwtService;
    let configService: ConfigService;

    const mockUser = {
        id: 1,
        nom: 'Doe',
        prenom: 'John',
        email: 'john@test.com',
        telephone: '1234567890',
        password: 'hashed_password',
        role: Role.Manager,
        actif: true,
        validatePassword: jest.fn(),
    };

    const mockAffectations = [
        { stationId: 1 },
        { stationId: 2 },
    ];

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: getModelToken(User),
                    useValue: {
                        findOne: jest.fn(),
                        findByPk: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Affectation),
                    useValue: {
                        findAll: jest.fn(),
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        sign: jest.fn().mockReturnValue('mock_token'),
                        verify: jest.fn(),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue('test-secret'),
                    },
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        userModel = module.get(getModelToken(User));
        affectationModel = module.get(getModelToken(Affectation));
        jwtService = module.get<JwtService>(JwtService);
        configService = module.get<ConfigService>(ConfigService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ─── login ────────────────────────────────────────────────────────
    describe('login', () => {
        it('should return tokens and user info on valid credentials', async () => {
            mockUser.validatePassword.mockResolvedValue(true);
            userModel.findOne.mockResolvedValue(mockUser);
            affectationModel.findAll.mockResolvedValue(mockAffectations);

            const result = await service.login({ email: 'john@test.com', password: 'password123' });

            expect(result).toHaveProperty('access_token');
            expect(result).toHaveProperty('refresh_token');
            expect(result.user).toEqual(expect.objectContaining({
                id: 1,
                nom: 'Doe',
                email: 'john@test.com',
                role: Role.Manager,
                stationIds: [1, 2],
            }));
        });

        it('should throw UnauthorizedException for unknown email', async () => {
            userModel.findOne.mockResolvedValue(null);

            await expect(
                service.login({ email: 'unknown@test.com', password: 'password123' }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for inactive user', async () => {
            userModel.findOne.mockResolvedValue({ ...mockUser, actif: false });

            await expect(
                service.login({ email: 'john@test.com', password: 'password123' }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for wrong password', async () => {
            mockUser.validatePassword.mockResolvedValue(false);
            userModel.findOne.mockResolvedValue(mockUser);

            await expect(
                service.login({ email: 'john@test.com', password: 'wrong' }),
            ).rejects.toThrow(UnauthorizedException);
        });
    });

    // ─── refresh ──────────────────────────────────────────────────────
    describe('refresh', () => {
        it('should return new tokens for a valid refresh token', async () => {
            (jwtService.verify as jest.Mock).mockReturnValue({
                sub: 1,
                email: 'john@test.com',
                role: Role.Manager,
            });
            userModel.findByPk.mockResolvedValue(mockUser);

            const result = await service.refresh('valid_refresh_token');

            expect(result).toHaveProperty('access_token');
            expect(result).toHaveProperty('refresh_token');
        });

        it('should throw UnauthorizedException for inactive user on refresh', async () => {
            (jwtService.verify as jest.Mock).mockReturnValue({
                sub: 1,
                email: 'john@test.com',
                role: Role.Manager,
            });
            userModel.findByPk.mockResolvedValue({ ...mockUser, actif: false });

            await expect(service.refresh('valid_refresh_token')).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should throw UnauthorizedException for invalid/expired token', async () => {
            (jwtService.verify as jest.Mock).mockImplementation(() => {
                throw new Error('invalid token');
            });

            await expect(service.refresh('invalid_token')).rejects.toThrow(
                UnauthorizedException,
            );
        });
    });

    // ─── getProfile ───────────────────────────────────────────────────
    describe('getProfile', () => {
        it('should return user profile with stationIds', async () => {
            userModel.findByPk.mockResolvedValue(mockUser);
            affectationModel.findAll.mockResolvedValue(mockAffectations);

            const result = await service.getProfile(1);

            expect(result).toEqual(expect.objectContaining({
                id: 1,
                nom: 'Doe',
                email: 'john@test.com',
                role: Role.Manager,
                stationIds: [1, 2],
            }));
        });

        it('should throw UnauthorizedException if user not found', async () => {
            userModel.findByPk.mockResolvedValue(null);

            await expect(service.getProfile(999)).rejects.toThrow(
                UnauthorizedException,
            );
        });
    });
});
