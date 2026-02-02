import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ValidationPipe } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

describe('User Service (e2e)', () => {
  let app: NestFastifyApplication;
  let prismaService: PrismaService;

  const testUserId = 'e2e-test-user-123';
  const accessToken = jwt.sign(
    { sub: testUserId, email: 'test@example.com', roles: ['user'] },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' },
  );

  const adminToken = jwt.sign(
    { sub: 'admin-user-123', email: 'admin@example.com', roles: ['admin'] },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' },
  );

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prismaService = app.get(PrismaService);
  });

  afterAll(async () => {
    // Clean up test data
    try {
      await prismaService.address.deleteMany({
        where: { userId: testUserId },
      });
      await prismaService.userPreferences.deleteMany({
        where: { userId: testUserId },
      });
      await prismaService.userProfile.deleteMany({
        where: { userId: testUserId },
      });
    } catch (error) {
      // Ignore if data doesn't exist
    }
    await app.close();
  });

  describe('Health Check', () => {
    it('/health (GET)', async () => {
      const result = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.payload);
      expect(body.status).toBe('ok');
    });
  });

  describe('User Profile Management', () => {
    describe('POST /users/profile', () => {
      it('should create a user profile', async () => {
        const result = await app.inject({
          method: 'POST',
          url: '/users/profile',
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
          payload: {
            userId: testUserId,
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            phoneNumber: '+1234567890',
          },
        });

        expect(result.statusCode).toBe(201);
        const body = JSON.parse(result.payload);
        expect(body.userId).toBe(testUserId);
        expect(body.email).toBe('test@example.com');
      });

      it('should fail without authentication', async () => {
        const result = await app.inject({
          method: 'POST',
          url: '/users/profile',
          payload: {
            userId: 'another-user',
            email: 'another@example.com',
          },
        });

        expect(result.statusCode).toBe(401);
      });
    });

    describe('GET /users/profile/:id', () => {
      it('should get user profile by ID', async () => {
        const result = await app.inject({
          method: 'GET',
          url: `/users/profile/${testUserId}`,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        });

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.payload);
        expect(body.userId).toBe(testUserId);
      });

      it('should return 404 for non-existent profile', async () => {
        const result = await app.inject({
          method: 'GET',
          url: '/users/profile/non-existent-user',
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        });

        expect(result.statusCode).toBe(404);
      });
    });

    describe('PATCH /users/profile/:id', () => {
      it('should update user profile', async () => {
        const result = await app.inject({
          method: 'PATCH',
          url: `/users/profile/${testUserId}`,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
          payload: {
            firstName: 'Updated',
            lastName: 'Name',
            bio: 'This is my bio',
          },
        });

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.payload);
        expect(body.firstName).toBe('Updated');
        expect(body.lastName).toBe('Name');
        expect(body.bio).toBe('This is my bio');
      });

      it('should fail to update another user profile without admin role', async () => {
        const otherUserToken = jwt.sign(
          { sub: 'other-user', email: 'other@example.com', roles: ['user'] },
          process.env.JWT_SECRET || 'test-secret',
          { expiresIn: '1h' },
        );

        const result = await app.inject({
          method: 'PATCH',
          url: `/users/profile/${testUserId}`,
          headers: {
            authorization: `Bearer ${otherUserToken}`,
          },
          payload: {
            firstName: 'Hacker',
          },
        });

        expect(result.statusCode).toBe(403);
      });
    });
  });

  describe('Address Management', () => {
    let addressId: string;

    describe('POST /users/profile/:id/addresses', () => {
      it('should add an address to user profile', async () => {
        const result = await app.inject({
          method: 'POST',
          url: `/users/profile/${testUserId}/addresses`,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
          payload: {
            type: 'HOME',
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'USA',
            isDefault: true,
          },
        });

        expect(result.statusCode).toBe(201);
        const body = JSON.parse(result.payload);
        expect(body.street).toBe('123 Main St');
        expect(body.isDefault).toBe(true);
        addressId = body.id;
      });

      it('should add a second address', async () => {
        const result = await app.inject({
          method: 'POST',
          url: `/users/profile/${testUserId}/addresses`,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
          payload: {
            type: 'WORK',
            street: '456 Office Ave',
            city: 'New York',
            state: 'NY',
            postalCode: '10002',
            country: 'USA',
            isDefault: false,
          },
        });

        expect(result.statusCode).toBe(201);
        const body = JSON.parse(result.payload);
        expect(body.type).toBe('WORK');
      });
    });

    describe('GET /users/profile/:id/addresses', () => {
      it('should get all addresses for user', async () => {
        const result = await app.inject({
          method: 'GET',
          url: `/users/profile/${testUserId}/addresses`,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        });

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.payload);
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe('DELETE /users/profile/:id/addresses/:addressId', () => {
      it('should delete an address', async () => {
        const result = await app.inject({
          method: 'DELETE',
          url: `/users/profile/${testUserId}/addresses/${addressId}`,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        });

        expect(result.statusCode).toBe(200);
      });
    });
  });

  describe('User Preferences', () => {
    describe('PUT /users/profile/:id/preferences', () => {
      it('should update user preferences', async () => {
        const result = await app.inject({
          method: 'PUT',
          url: `/users/profile/${testUserId}/preferences`,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
          payload: {
            theme: 'dark',
            language: 'en',
            emailNotifications: true,
            pushNotifications: false,
            newsletter: true,
          },
        });

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.payload);
        expect(body.theme).toBe('dark');
        expect(body.emailNotifications).toBe(true);
      });
    });

    describe('GET /users/profile/:id/preferences', () => {
      it('should get user preferences', async () => {
        const result = await app.inject({
          method: 'GET',
          url: `/users/profile/${testUserId}/preferences`,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        });

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.payload);
        expect(body.theme).toBe('dark');
      });
    });
  });

  describe('Admin Operations', () => {
    describe('GET /users/admin/all', () => {
      it('should allow admin to list all users', async () => {
        const result = await app.inject({
          method: 'GET',
          url: '/users/admin/all',
          headers: {
            authorization: `Bearer ${adminToken}`,
          },
        });

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.payload);
        expect(Array.isArray(body)).toBe(true);
      });

      it('should deny regular user access to admin endpoint', async () => {
        const result = await app.inject({
          method: 'GET',
          url: '/users/admin/all',
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        });

        expect(result.statusCode).toBe(403);
      });
    });
  });
});
