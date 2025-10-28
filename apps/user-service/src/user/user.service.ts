import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserProfile, Address, UserPreferences } from '@prisma/client';
import { CreateUserProfileDto, UpdateUserProfileDto, CreateAddressDto, UpdateUserPreferencesDto } from '@microservices/shared';
import { EventService } from '../events/event.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private eventService: EventService,
  ) {}

  // User Profile Operations
  async createUserProfile(userId: string, createProfileDto: CreateUserProfileDto): Promise<UserProfile> {
    const existingProfile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new ConflictException('User profile already exists');
    }

    return this.prisma.userProfile.create({
      data: {
        userId,
        ...createProfileDto,
      },
      include: {
        address: true,
        preferences: true,
      },
    });
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return this.prisma.userProfile.findUnique({
      where: { userId },
      include: {
        address: true,
        preferences: true,
      },
    });
  }

  async updateUserProfile(userId: string, updateProfileDto: UpdateUserProfileDto): Promise<UserProfile> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    const updatedProfile = await this.prisma.userProfile.update({
      where: { userId },
      data: {
        firstName: updateProfileDto.firstName,
        lastName: updateProfileDto.lastName,
        phoneNumber: updateProfileDto.phoneNumber,
        dateOfBirth: updateProfileDto.dateOfBirth ? new Date(updateProfileDto.dateOfBirth) : undefined,
        bio: updateProfileDto.bio,
      },
      include: {
        address: true,
        preferences: true,
      },
    });

    // Publish event
    await this.eventService.publishUserProfileUpdated({
      userId: updatedProfile.userId,
      changes: {
        firstName: updatedProfile.firstName,
        lastName: updatedProfile.lastName,
        phoneNumber: updatedProfile.phoneNumber,
        bio: updatedProfile.bio,
      },
      timestamp: new Date(),
    });
    await this.eventService.publishUserProfileUpdated({
      userId,
      changes: updateProfileDto,
      timestamp: new Date(),
    });

    return updatedProfile;
  }

  async deleteUserProfile(userId: string): Promise<void> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    await this.prisma.userProfile.delete({
      where: { userId },
    });

    // Publish event
    await this.eventService.publishUserDeleted({
      userId,
      email: profile.email,
      timestamp: new Date(),
    });
  }

  // Address Operations
  async createOrUpdateAddress(userId: string, addressDto: CreateAddressDto): Promise<Address> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    return this.prisma.address.upsert({
      where: { userProfileId: profile.id },
      update: addressDto,
      create: {
        userProfileId: profile.id,
        ...addressDto,
      },
    });
  }

  async getUserAddress(userId: string): Promise<Address | null> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: { address: true },
    });

    return profile?.address || null;
  }

  async deleteUserAddress(userId: string): Promise<void> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: { address: true },
    });

    if (!profile?.address) {
      throw new NotFoundException('User address not found');
    }

    await this.prisma.address.delete({
      where: { id: profile.address.id },
    });
  }

  // User Preferences Operations
  async updateUserPreferences(userId: string, preferencesDto: UpdateUserPreferencesDto): Promise<UserPreferences> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    const updatedPreferences = await this.prisma.userPreferences.upsert({
      where: { userProfileId: profile.id },
      update: {
        theme: preferencesDto.theme,
        language: preferencesDto.language,
        timezone: preferencesDto.timezone,
        emailNotifications: preferencesDto.emailNotifications,
        pushNotifications: preferencesDto.pushNotifications,
      },
      create: {
        userProfileId: profile.id,
        theme: preferencesDto.theme,
        language: preferencesDto.language,
        timezone: preferencesDto.timezone,
        emailNotifications: preferencesDto.emailNotifications,
        pushNotifications: preferencesDto.pushNotifications,
      },
    });

    // Publish event
    await this.eventService.publishUserPreferencesUpdated({
      userId,
      preferences: preferencesDto,
      timestamp: new Date(),
    });

    return updatedPreferences;
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: { preferences: true },
    });

    return profile?.preferences || null;
  }

  // Utility Methods
  async getAllUserProfiles(page: number = 1, limit: number = 10): Promise<{ data: UserProfile[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      this.prisma.userProfile.findMany({
        skip,
        take: limit,
        include: {
          address: true,
          preferences: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.userProfile.count(),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async searchUserProfiles(query: string): Promise<UserProfile[]> {
    return this.prisma.userProfile.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        address: true,
        preferences: true,
      },
      take: 20,
    });
  }
}
