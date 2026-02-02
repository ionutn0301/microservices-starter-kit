import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    passwordReset: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should successfully register a new user', async () => {
      const hashedPassword = 'hashedPassword123';
      const mockUser = {
        id: 'user-1',
        email: registerDto.email,
        password: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        isEmailVerified: false,
        role: 'USER',
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe(registerDto.email);
      expect(result.tokens.accessToken).toBe('access-token');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
    });

    it('should throw ConflictException if user already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: 'user-1',
      email: loginDto.email,
      password: 'hashedPassword',
      firstName: 'John',
      lastName: 'Doe',
      isEmailVerified: false,
      role: 'USER',
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully login a user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe(loginDto.email);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLoginAt: expect.any(Date) },
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    const refreshTokenDto = { refreshToken: 'valid-refresh-token' };

    it('should successfully refresh tokens', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isEmailVerified: false,
        role: 'USER',
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockStoredToken = {
        token: refreshTokenDto.refreshToken,
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 86400000), // 1 day from now
        user: mockUser,
      };

      mockJwtService.verify.mockReturnValue({ sub: mockUser.id });
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(mockStoredToken);
      mockPrismaService.refreshToken.delete.mockResolvedValue({});
      mockJwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.refreshToken(refreshTokenDto);

      expect(result).toHaveProperty('tokens');
      expect(result.tokens.accessToken).toBe('new-access-token');
      expect(mockPrismaService.refreshToken.delete).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if token is expired', async () => {
      const mockStoredToken = {
        token: refreshTokenDto.refreshToken,
        expiresAt: new Date(Date.now() - 86400000), // 1 day ago
        user: { id: 'user-1' },
      };

      mockJwtService.verify.mockReturnValue({ sub: 'user-1' });
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(mockStoredToken);

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should delete all refresh tokens for user', async () => {
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 2 });

      const result = await service.logout('user-1');

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });

  describe('forgotPassword', () => {
    it('should create password reset token if user exists', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.passwordReset.create.mockResolvedValue({});

      const result = await service.forgotPassword({ email: 'test@example.com' });

      expect(result.message).toBe('If the email exists, a reset link has been sent');
      expect(mockPrismaService.passwordReset.create).toHaveBeenCalled();
    });

    it('should return same message if user does not exist (security)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'nonexistent@example.com' });

      expect(result.message).toBe('If the email exists, a reset link has been sent');
      expect(mockPrismaService.passwordReset.create).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDto = {
      token: 'valid-reset-token',
      newPassword: 'newPassword123',
    };

    it('should successfully reset password', async () => {
      const mockResetToken = {
        token: resetPasswordDto.token,
        used: false,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        userId: 'user-1',
        user: { id: 'user-1' },
      };

      mockPrismaService.passwordReset.findUnique.mockResolvedValue(mockResetToken);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      mockPrismaService.$transaction.mockResolvedValue([]);

      const result = await service.resetPassword(resetPasswordDto);

      expect(result.message).toBe('Password reset successfully');
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if token is invalid or expired', async () => {
      mockPrismaService.passwordReset.findUnique.mockResolvedValue(null);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token is already used', async () => {
      const mockResetToken = {
        token: resetPasswordDto.token,
        used: true,
        expiresAt: new Date(Date.now() + 3600000),
        userId: 'user-1',
      };

      mockPrismaService.passwordReset.findUnique.mockResolvedValue(mockResetToken);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should return user if found', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isEmailVerified: false,
        role: 'USER',
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser('user-1');

      expect(result.id).toBe('user-1');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.validateUser('nonexistent-user')).rejects.toThrow(NotFoundException);
    });
  });
});
