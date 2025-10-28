import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  HttpCode, 
  HttpStatus,
  NotFoundException,
  UseGuards,
  Req
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { Request } from 'express';
import { UserService } from './user.service';
import { CreateUserProfileDto, UpdateUserProfileDto, CreateAddressDto, UpdateUserPreferencesDto } from '@microservices/shared';
import { UserProfile, Address, UserPreferences } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('User Management')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('profile')
  @ApiOperation({ summary: 'Create user profile' })
  @ApiResponse({ status: 201, description: 'User profile created successfully' })
  @ApiResponse({ status: 409, description: 'User profile already exists' })
  @ApiBearerAuth()
  async createProfile(
    @Req() req: AuthenticatedRequest,
    @Body() createProfileDto: CreateUserProfileDto,
  ): Promise<UserProfile> {
    const userId = req.user.id;
    return this.userService.createUserProfile(userId, createProfileDto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User profile not found' })
  @ApiBearerAuth()
  async getProfile(@Req() req: AuthenticatedRequest): Promise<UserProfile> {
    const userId = req.user.id;
    const profile = await this.userService.getUserProfile(userId);
    
    if (!profile) {
      throw new NotFoundException('User profile not found');
    }
    
    return profile;
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'User profile updated successfully' })
  @ApiResponse({ status: 404, description: 'User profile not found' })
  // @ApiBearerAuth()
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() updateProfileDto: UpdateUserProfileDto,
  ): Promise<UserProfile> {
    const userId = req.user?.id || 'mock-user-id';
    return this.userService.updateUserProfile(userId, updateProfileDto);
  }

  @Delete('profile')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user profile' })
  @ApiResponse({ status: 204, description: 'User profile deleted successfully' })
  @ApiResponse({ status: 404, description: 'User profile not found' })
  @ApiBearerAuth()
  async deleteProfile(@Req() req: AuthenticatedRequest): Promise<void> {
    const userId = req.user.id;
    await this.userService.deleteUserProfile(userId);
  }

  @Get('profile/:userId')
  @ApiOperation({ summary: 'Get user profile by ID (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User profile not found' })
  @ApiBearerAuth()
  @Roles('ADMIN')
  async getProfileById(@Param('userId') userId: string): Promise<UserProfile> {
    const profile = await this.userService.getUserProfile(userId);
    
    if (!profile) {
      throw new NotFoundException('User profile not found');
    }
    
    return profile;
  }

  // Address Management
  @Post('address')
  @ApiOperation({ summary: 'Create or update user address' })
  @ApiResponse({ status: 201, description: 'Address created/updated successfully' })
  @ApiResponse({ status: 404, description: 'User profile not found' })
  // @ApiBearerAuth()
  async createOrUpdateAddress(
    @Req() req: AuthenticatedRequest,
    @Body() addressDto: CreateAddressDto,
  ): Promise<Address> {
    const userId = req.user?.id || 'mock-user-id';
    return this.userService.createOrUpdateAddress(userId, addressDto);
  }

  @Get('address')
  @ApiOperation({ summary: 'Get user address' })
  @ApiResponse({ status: 200, description: 'Address retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  // @ApiBearerAuth()
  async getAddress(@Req() req: AuthenticatedRequest): Promise<Address> {
    const userId = req.user?.id || 'mock-user-id';
    const address = await this.userService.getUserAddress(userId);
    
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    
    return address;
  }

  @Delete('address')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user address' })
  @ApiResponse({ status: 204, description: 'Address deleted successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  // @ApiBearerAuth()
  async deleteAddress(@Req() req: AuthenticatedRequest): Promise<void> {
    const userId = req.user?.id || 'mock-user-id';
    await this.userService.deleteUserAddress(userId);
  }

  // User Preferences
  @Put('preferences')
  @ApiOperation({ summary: 'Update user preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  @ApiResponse({ status: 404, description: 'User profile not found' })
  // @ApiBearerAuth()
  async updatePreferences(
    @Req() req: AuthenticatedRequest,
    @Body() preferencesDto: UpdateUserPreferencesDto,
  ): Promise<UserPreferences> {
    const userId = req.user?.id || 'mock-user-id';
    return this.userService.updateUserPreferences(userId, preferencesDto);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get user preferences' })
  @ApiResponse({ status: 200, description: 'Preferences retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Preferences not found' })
  // @ApiBearerAuth()
  async getPreferences(@Req() req: AuthenticatedRequest): Promise<UserPreferences> {
    const userId = req.user?.id || 'mock-user-id';
    const preferences = await this.userService.getUserPreferences(userId);
    
    if (!preferences) {
      throw new NotFoundException('Preferences not found');
    }
    
    return preferences;
  }

  // Admin endpoints
  @Get()
  @ApiOperation({ summary: 'Get all user profiles (Admin only)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'User profiles retrieved successfully' })
  // @ApiBearerAuth()
  // @Roles('ADMIN')
  async getAllProfiles(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{ data: UserProfile[]; total: number; page: number; limit: number }> {
    return this.userService.getAllUserProfiles(Number(page), Number(limit));
  }

  @Get('search')
  @ApiOperation({ summary: 'Search user profiles (Admin only)' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  // @ApiBearerAuth()
  // @Roles('ADMIN')
  async searchProfiles(@Query('q') query: string): Promise<UserProfile[]> {
    return this.userService.searchUserProfiles(query);
  }

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck(): Promise<{ status: string; timestamp: string; service: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'user-service',
    };
  }
}
