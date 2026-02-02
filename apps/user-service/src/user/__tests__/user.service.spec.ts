import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserService } from '../user.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventService } from '../../events/event.service';

describe('UserService', () => {
  let service: UserService;
  let prismaService: PrismaService;
  let eventService: EventService;

  const mockPrismaService = {
    userProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    address: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    userPreferences: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const mockEventService = {
    publishUserProfileUpdated: jest.fn(),
    publishUserDeleted: jest.fn(),
    publishUserPreferencesUpdated: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventService,
          useValue: mockEventService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
    eventService = module.get<EventService>(EventService);

    jest.clearAllMocks();
  });

  describe('createUserProfile', () => {
    const userId = 'user-1';
    const createProfileDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phoneNumber: '+1234567890',
    };

    it('should create a new user profile', async () => {
      const expectedProfile = {
        id: 'profile-1',
        userId,
        ...createProfileDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        address: null,
        preferences: null,
      };

      mockPrismaService.userProfile.findUnique.mockResolvedValue(null);
      mockPrismaService.userProfile.create.mockResolvedValue(expectedProfile);

      const result = await service.createUserProfile(userId, createProfileDto);

      expect(result).toEqual(expectedProfile);
      expect(mockPrismaService.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(mockPrismaService.userProfile.create).toHaveBeenCalledWith({
        data: {
          userId,
          ...createProfileDto,
        },
        include: {
          address: true,
          preferences: true,
        },
      });
    });

    it('should throw ConflictException if profile already exists', async () => {
      mockPrismaService.userProfile.findUnique.mockResolvedValue({ id: 'existing-profile' });

      await expect(service.createUserProfile(userId, createProfileDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrismaService.userProfile.create).not.toHaveBeenCalled();
    });
  });

  describe('getUserProfile', () => {
    const userId = 'user-1';

    it('should return user profile if exists', async () => {
      const expectedProfile = {
        id: 'profile-1',
        userId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        address: null,
        preferences: null,
      };

      mockPrismaService.userProfile.findUnique.mockResolvedValue(expectedProfile);

      const result = await service.getUserProfile(userId);

      expect(result).toEqual(expectedProfile);
      expect(mockPrismaService.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId },
        include: {
          address: true,
          preferences: true,
        },
      });
    });

    it('should return null if profile does not exist', async () => {
      mockPrismaService.userProfile.findUnique.mockResolvedValue(null);

      const result = await service.getUserProfile(userId);

      expect(result).toBeNull();
    });
  });

  describe('updateUserProfile', () => {
    const userId = 'user-1';
    const updateProfileDto = {
      firstName: 'Jane',
      lastName: 'Smith',
      bio: 'Updated bio',
    };

    it('should update user profile', async () => {
      const existingProfile = {
        id: 'profile-1',
        userId,
        firstName: 'John',
        lastName: 'Doe',
      };

      const updatedProfile = {
        ...existingProfile,
        ...updateProfileDto,
        address: null,
        preferences: null,
      };

      mockPrismaService.userProfile.findUnique.mockResolvedValue(existingProfile);
      mockPrismaService.userProfile.update.mockResolvedValue(updatedProfile);
      mockEventService.publishUserProfileUpdated.mockResolvedValue(true);

      const result = await service.updateUserProfile(userId, updateProfileDto);

      expect(result).toEqual(updatedProfile);
      expect(mockEventService.publishUserProfileUpdated).toHaveBeenCalled();
    });

    it('should throw NotFoundException if profile does not exist', async () => {
      mockPrismaService.userProfile.findUnique.mockResolvedValue(null);

      await expect(service.updateUserProfile(userId, updateProfileDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteUserProfile', () => {
    const userId = 'user-1';

    it('should delete user profile', async () => {
      const existingProfile = { id: 'profile-1', userId };

      mockPrismaService.userProfile.findUnique.mockResolvedValue(existingProfile);
      mockPrismaService.userProfile.delete.mockResolvedValue(existingProfile);

      await service.deleteUserProfile(userId);

      expect(mockPrismaService.userProfile.delete).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should throw NotFoundException if profile does not exist', async () => {
      mockPrismaService.userProfile.findUnique.mockResolvedValue(null);

      await expect(service.deleteUserProfile(userId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.userProfile.delete).not.toHaveBeenCalled();
    });
  });

  describe('createAddress', () => {
    const userId = 'user-1';
    const createAddressDto = {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      postalCode: '10001',
    };

    it('should create an address for user profile', async () => {
      const existingProfile = { id: 'profile-1', userId };
      const expectedAddress = {
        id: 'address-1',
        userProfileId: existingProfile.id,
        ...createAddressDto,
      };

      mockPrismaService.userProfile.findUnique.mockResolvedValue(existingProfile);
      mockPrismaService.address.create.mockResolvedValue(expectedAddress);

      const result = await service.createAddress(userId, createAddressDto);

      expect(result).toEqual(expectedAddress);
    });

    it('should throw NotFoundException if profile does not exist', async () => {
      mockPrismaService.userProfile.findUnique.mockResolvedValue(null);

      await expect(service.createAddress(userId, createAddressDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateUserPreferences', () => {
    const userId = 'user-1';
    const updatePreferencesDto = {
      theme: 'DARK',
      language: 'en',
      emailNotifications: false,
    };

    it('should update user preferences', async () => {
      const existingProfile = { id: 'profile-1', userId };
      const expectedPreferences = {
        id: 'pref-1',
        userProfileId: existingProfile.id,
        ...updatePreferencesDto,
      };

      mockPrismaService.userProfile.findUnique.mockResolvedValue(existingProfile);
      mockPrismaService.userPreferences.upsert.mockResolvedValue(expectedPreferences);
      mockEventService.publishUserPreferencesUpdated.mockResolvedValue(true);

      const result = await service.updateUserPreferences(userId, updatePreferencesDto);

      expect(result).toEqual(expectedPreferences);
      expect(mockEventService.publishUserPreferencesUpdated).toHaveBeenCalled();
    });

    it('should throw NotFoundException if profile does not exist', async () => {
      mockPrismaService.userProfile.findUnique.mockResolvedValue(null);

      await expect(service.updateUserPreferences(userId, updatePreferencesDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
