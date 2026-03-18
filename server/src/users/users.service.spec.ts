import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { UsersService } from './users.service';
import { User } from './models/user.model';
import { Affectation } from './models/affectation.model';
import { Performance } from './models/performance.model';
import { Sanction } from './models/sanction.model';
import { Promotion } from './models/promotion.model';
import { CommercialRegistration } from '../commercial/models/commercial-registration.model';
import { Role } from '../common/constants/roles.enum';

describe('UsersService', () => {
    let service: UsersService;
    let userModel: any;
    let affectationModel: any;
    let performanceModel: any;
    let sanctionModel: any;
    let promotionModel: any;

    const mockUser = {
        id: 1,
        nom: 'Doe',
        prenom: 'John',
        email: 'john@test.com',
        telephone: '1234567890',
        role: Role.Laveur,
        actif: true,
        bonusParLavage: 500,
        objectifJournalier: 10,
        update: jest.fn(),
        toJSON: jest.fn().mockReturnThis(),
    };

    const mockAffectation = {
        id: 1,
        userId: 1,
        stationId: 1,
        statut: 'active',
        update: jest.fn(),
        save: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getModelToken(User),
                    useValue: {
                        findAndCountAll: jest.fn(),
                        findAll: jest.fn(),
                        findByPk: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Affectation),
                    useValue: {
                        findAll: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        update: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Performance),
                    useValue: {
                        findAll: jest.fn(),
                        sum: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Sanction),
                    useValue: {
                        findAll: jest.fn(),
                        findByPk: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Promotion),
                    useValue: {
                        create: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(CommercialRegistration),
                    useValue: {
                        findAll: jest.fn(),
                        findByPk: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        bulkCreate: jest.fn(),
                        count: jest.fn(),
                        sum: jest.fn(),
                        destroy: jest.fn(),
                        update: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        userModel = module.get(getModelToken(User));
        affectationModel = module.get(getModelToken(Affectation));
        performanceModel = module.get(getModelToken(Performance));
        sanctionModel = module.get(getModelToken(Sanction));
        promotionModel = module.get(getModelToken(Promotion));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ─── findAll ──────────────────────────────────────────────────────
    describe('findAll', () => {
        it('should return paginated users', async () => {
            userModel.findAndCountAll.mockResolvedValue({
                rows: [mockUser],
                count: 1,
            });

            const result = await service.findAll({ page: 1, limit: 10 });

            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(result.page).toBe(1);
        });

        it('should filter by role', async () => {
            userModel.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

            await service.findAll({ role: Role.Laveur });

            expect(userModel.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ role: Role.Laveur }),
                }),
            );
        });
    });

    // ─── findOne ──────────────────────────────────────────────────────
    describe('findOne', () => {
        it('should return a user with relations', async () => {
            userModel.findByPk.mockResolvedValue(mockUser);

            const result = await service.findOne(1);

            expect(result).toEqual(mockUser);
        });

        it('should throw NotFoundException if user not found', async () => {
            userModel.findByPk.mockResolvedValue(null);

            await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
        });
    });

    // ─── create ───────────────────────────────────────────────────────
    describe('create', () => {
        it('should create a user', async () => {
            const dto = {
                nom: 'New',
                prenom: 'User',
                email: 'new@test.com',
                password: 'password123',
                role: Role.Laveur,
            };
            userModel.findOne.mockResolvedValue(null); // no duplicate
            const created = { id: 2, ...dto };
            userModel.create.mockResolvedValue({ ...created, toJSON: jest.fn().mockReturnValue(created) });

            const result = await service.create(dto as any);

            expect(result).toHaveProperty('id', 2);
        });
    });

    // ─── update ───────────────────────────────────────────────────────
    describe('update', () => {
        it('should update user fields', async () => {
            const dto = { nom: 'Updated' };
            userModel.findByPk.mockResolvedValue(mockUser);
            userModel.findOne.mockResolvedValue(null); // no email conflict
            mockUser.update.mockResolvedValue({ ...mockUser, ...dto });

            const result = await service.update(1, dto as any);

            expect(mockUser.update).toHaveBeenCalled();
        });

        it('should throw NotFoundException if user to update not found', async () => {
            userModel.findByPk.mockResolvedValue(null);

            await expect(service.update(999, { nom: 'X' } as any)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    // ─── checkEmailUniqueness ─────────────────────────────────────────
    describe('checkEmailUniqueness', () => {
        it('should throw ConflictException for duplicate email', async () => {
            userModel.findOne.mockResolvedValue(mockUser);

            await expect(
                (service as any).checkEmailUniqueness('john@test.com'),
            ).rejects.toThrow(ConflictException);
        });

        it('should not throw if email is unique', async () => {
            userModel.findOne.mockResolvedValue(null);

            await expect(
                (service as any).checkEmailUniqueness('unique@test.com'),
            ).resolves.not.toThrow();
        });
    });

    // ─── assignStation ────────────────────────────────────────────────
    describe('assignStation', () => {
        it('should create an affectation', async () => {
            userModel.findByPk.mockResolvedValue(mockUser);
            affectationModel.create.mockResolvedValue(mockAffectation);

            const result = await service.assignStation(1, { stationId: 1 } as any);

            expect(affectationModel.create).toHaveBeenCalled();
        });
    });

    // ─── unassignStation ──────────────────────────────────────────────
    describe('unassignStation', () => {
        it('should deactivate active affectations', async () => {
            userModel.findByPk.mockResolvedValue(mockUser);
            affectationModel.update.mockResolvedValue([1]);

            await service.unassignStation(1);

            expect(affectationModel.update).toHaveBeenCalled();
        });
    });

    // ─── addSanction ──────────────────────────────────────────────────
    describe('addSanction', () => {
        it('should create a sanction for a user', async () => {
            userModel.findByPk.mockResolvedValue(mockUser);
            sanctionModel.create.mockResolvedValue({
                id: 1,
                userId: 1,
                type: 'avertissement',
                motif: 'Retard',
            });

            const result = await service.addSanction(
                1,
                { type: 'avertissement', motif: 'Retard' } as any,
                2,
            );

            expect(sanctionModel.create).toHaveBeenCalled();
        });
    });

    // ─── getUserSanctions ─────────────────────────────────────────────
    describe('getUserSanctions', () => {
        it('should return sanctions for a user', async () => {
            userModel.findByPk.mockResolvedValue(mockUser);
            sanctionModel.findAll.mockResolvedValue([
                { id: 1, type: 'avertissement', motif: 'Retard' },
            ]);

            const result = await service.getUserSanctions(1);

            expect(result).toHaveLength(1);
        });
    });

    // ─── liftSanction ────────────────────────────────────────────────
    describe('liftSanction', () => {
        it('should lift a sanction', async () => {
            const mockSanction = {
                id: 1,
                userId: 1,
                statut: 'active',
                update: jest.fn().mockResolvedValue(true),
            };
            sanctionModel.findByPk.mockResolvedValue(mockSanction);
            userModel.findByPk.mockResolvedValue(mockUser);

            await service.liftSanction(1, { motifLevee: 'Good behavior' } as any);

            expect(mockSanction.update).toHaveBeenCalled();
        });

        it('should throw NotFoundException if sanction not found', async () => {
            sanctionModel.findByPk.mockResolvedValue(null);

            await expect(
                service.liftSanction(999, { motifLevee: 'X' } as any),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ─── promoteUser ──────────────────────────────────────────────────
    describe('promoteUser', () => {
        it('should promote a user to a new role', async () => {
            userModel.findByPk.mockResolvedValue(mockUser);
            promotionModel.create.mockResolvedValue({ id: 1 });
            mockUser.update.mockResolvedValue({ ...mockUser, role: Role.Controleur });

            const result = await service.promoteUser(
                1,
                { newRole: Role.Controleur, motif: 'Promotion' } as any,
                2,
            );

            expect(mockUser.update).toHaveBeenCalled();
            expect(promotionModel.create).toHaveBeenCalled();
        });
    });

    // ─── findAvailableWashers ─────────────────────────────────────────
    describe('findAvailableWashers', () => {
        it('should return active washers for a station', async () => {
            userModel.findAll.mockResolvedValue([mockUser]);

            const result = await service.findAvailableWashers(1);

            expect(userModel.findAll).toHaveBeenCalled();
        });
    });
});
