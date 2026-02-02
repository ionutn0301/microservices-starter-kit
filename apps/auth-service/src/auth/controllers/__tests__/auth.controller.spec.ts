import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../../services/auth.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const expectedResult = {
        user: { id: 'user-1', email: 'test@example.com' },
        tokens: { accessToken: 'access-token', refreshToken: 'refresh-token' },
      };

      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResult = {
        user: { id: 'user-1', email: 'test@example.com' },
        tokens: { accessToken: 'access-token', refreshToken: 'refresh-token' },
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens', async () => {
      const refreshTokenDto = { refreshToken: 'valid-refresh-token' };

      const expectedResult = {
        user: { id: 'user-1' },
        tokens: { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' },
      };

      mockAuthService.refreshToken.mockResolvedValue(expectedResult);

      const result = await controller.refreshToken(refreshTokenDto);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(refreshTokenDto);
    });
  });

  describe('logout', () => {
    it('should logout a user', async () => {
      const mockRequest = { user: { userId: 'user-1' } };
      const expectedResult = { message: 'Logged out successfully' };

      mockAuthService.logout.mockResolvedValue(expectedResult);

      const result = await controller.logout(mockRequest);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.logout).toHaveBeenCalledWith('user-1');
    });
  });

  describe('forgotPassword', () => {
    it('should handle forgot password request', async () => {
      const forgotPasswordDto = { email: 'test@example.com' };
      const expectedResult = { message: 'If the email exists, a reset link has been sent' };

      mockAuthService.forgotPassword.mockResolvedValue(expectedResult);

      const result = await controller.forgotPassword(forgotPasswordDto);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(forgotPasswordDto);
    });
  });

  describe('resetPassword', () => {
    it('should reset password', async () => {
      const resetPasswordDto = { token: 'reset-token', newPassword: 'newPassword123' };
      const expectedResult = { message: 'Password reset successfully' };

      mockAuthService.resetPassword.mockResolvedValue(expectedResult);

      const result = await controller.resetPassword(resetPasswordDto);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(resetPasswordDto);
    });
  });

  describe('getMe', () => {
    it('should return current user', async () => {
      const mockRequest = { user: { userId: 'user-1' } };
      const expectedResult = { id: 'user-1', email: 'test@example.com' };

      mockAuthService.validateUser.mockResolvedValue(expectedResult);

      const result = await controller.getMe(mockRequest);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith('user-1');
    });
  });
});
