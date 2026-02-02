import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { UserService } from '../user.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  const mockUserService = {
    createUserProfile: jest.fn(),
    getUserProfile: jest.fn(),
    updateUserProfile: jest.fn(),
    deleteUserProfile: jest.fn(),
    createAddress: jest.fn(),
    updateAddress: jest.fn(),
    deleteAddress: jest.fn(),
    updateUserPreferences: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);

    jest.clearAllMocks();
  });

  describe('createProfile', () => {
    it('should create a user profile', async () => {
      const mockRequest = { user: { userId: 'user-1' } };
      const createProfileDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };
      const expectedResult = { id: 'profile-1', ...createProfileDto };

      mockUserService.createUserProfile.mockResolvedValue(expectedResult);

      const result = await controller.createProfile(mockRequest, createProfileDto);

      expect(result).toEqual(expectedResult);
      expect(mockUserService.createUserProfile).toHaveBeenCalledWith('user-1', createProfileDto);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockRequest = { user: { userId: 'user-1' } };
      const expectedResult = {
        id: 'profile-1',
        userId: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockUserService.getUserProfile.mockResolvedValue(expectedResult);

      const result = await controller.getProfile(mockRequest);

      expect(result).toEqual(expectedResult);
      expect(mockUserService.getUserProfile).toHaveBeenCalledWith('user-1');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const mockRequest = { user: { userId: 'user-1' } };
      const updateProfileDto = { firstName: 'Jane' };
      const expectedResult = { id: 'profile-1', firstName: 'Jane' };

      mockUserService.updateUserProfile.mockResolvedValue(expectedResult);

      const result = await controller.updateProfile(mockRequest, updateProfileDto);

      expect(result).toEqual(expectedResult);
      expect(mockUserService.updateUserProfile).toHaveBeenCalledWith('user-1', updateProfileDto);
    });
  });

  describe('deleteProfile', () => {
    it('should delete user profile', async () => {
      const mockRequest = { user: { userId: 'user-1' } };

      mockUserService.deleteUserProfile.mockResolvedValue(undefined);

      await controller.deleteProfile(mockRequest);

      expect(mockUserService.deleteUserProfile).toHaveBeenCalledWith('user-1');
    });
  });

  describe('createAddress', () => {
    it('should create an address', async () => {
      const mockRequest = { user: { userId: 'user-1' } };
      const createAddressDto = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        postalCode: '10001',
      };
      const expectedResult = { id: 'address-1', ...createAddressDto };

      mockUserService.createAddress.mockResolvedValue(expectedResult);

      const result = await controller.createAddress(mockRequest, createAddressDto);

      expect(result).toEqual(expectedResult);
      expect(mockUserService.createAddress).toHaveBeenCalledWith('user-1', createAddressDto);
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      const mockRequest = { user: { userId: 'user-1' } };
      const updatePreferencesDto = { theme: 'DARK', emailNotifications: false };
      const expectedResult = { id: 'pref-1', ...updatePreferencesDto };

      mockUserService.updateUserPreferences.mockResolvedValue(expectedResult);

      const result = await controller.updatePreferences(mockRequest, updatePreferencesDto);

      expect(result).toEqual(expectedResult);
      expect(mockUserService.updateUserPreferences).toHaveBeenCalledWith(
        'user-1',
        updatePreferencesDto,
      );
    });
  });
});
