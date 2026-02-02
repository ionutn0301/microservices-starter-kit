import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ValidationPipe } from '@nestjs/common';

describe('Auth Service (e2e)', () => {
  let app: NestFastifyApplication;
  let prismaService: PrismaService;
  
  const testUser = {
    email: 'e2e-test@example.com',
    password: 'TestPassword123!',
    firstName: 'E2E',
    lastName: 'Tester',
  };

  let accessToken: string;
  let refreshToken: string;

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
    // Clean up test user
    try {
      await prismaService.user.deleteMany({
        where: { email: testUser.email },
      });
    } catch (error) {
      // Ignore if user doesn't exist
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

  describe('Authentication Flow', () => {
    describe('POST /auth/register', () => {
      it('should register a new user successfully', async () => {
        const result = await app.inject({
          method: 'POST',
          url: '/auth/register',
          payload: testUser,
        });

        expect(result.statusCode).toBe(201);
        const body = JSON.parse(result.payload);
        expect(body.user).toBeDefined();
        expect(body.user.email).toBe(testUser.email);
        expect(body.accessToken).toBeDefined();
        expect(body.refreshToken).toBeDefined();

        accessToken = body.accessToken;
        refreshToken = body.refreshToken;
      });

      it('should fail with duplicate email', async () => {
        const result = await app.inject({
          method: 'POST',
          url: '/auth/register',
          payload: testUser,
        });

        expect(result.statusCode).toBe(409);
      });

      it('should fail with invalid email', async () => {
        const result = await app.inject({
          method: 'POST',
          url: '/auth/register',
          payload: {
            ...testUser,
            email: 'invalid-email',
          },
        });

        expect(result.statusCode).toBe(400);
      });

      it('should fail with weak password', async () => {
        const result = await app.inject({
          method: 'POST',
          url: '/auth/register',
          payload: {
            ...testUser,
            email: 'another@example.com',
            password: '123',
          },
        });

        expect(result.statusCode).toBe(400);
      });
    });

    describe('POST /auth/login', () => {
      it('should login with valid credentials', async () => {
        const result = await app.inject({
          method: 'POST',
          url: '/auth/login',
          payload: {
            email: testUser.email,
            password: testUser.password,
          },
        });

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.payload);
        expect(body.accessToken).toBeDefined();
        expect(body.refreshToken).toBeDefined();

        accessToken = body.accessToken;
        refreshToken = body.refreshToken;
      });

      it('should fail with invalid password', async () => {
        const result = await app.inject({
          method: 'POST',
          url: '/auth/login',
          payload: {
            email: testUser.email,
            password: 'WrongPassword123!',
          },
        });

        expect(result.statusCode).toBe(401);
      });

      it('should fail with non-existent user', async () => {
        const result = await app.inject({
          method: 'POST',
          url: '/auth/login',
          payload: {
            email: 'nonexistent@example.com',
            password: testUser.password,
          },
        });

        expect(result.statusCode).toBe(401);
      });
    });

    describe('GET /auth/profile', () => {
      it('should get user profile with valid token', async () => {
        const result = await app.inject({
          method: 'GET',
          url: '/auth/profile',
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        });

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.payload);
        expect(body.email).toBe(testUser.email);
      });

      it('should fail without token', async () => {
        const result = await app.inject({
          method: 'GET',
          url: '/auth/profile',
        });

        expect(result.statusCode).toBe(401);
      });

      it('should fail with invalid token', async () => {
        const result = await app.inject({
          method: 'GET',
          url: '/auth/profile',
          headers: {
            authorization: 'Bearer invalid-token',
          },
        });

        expect(result.statusCode).toBe(401);
      });
    });

    describe('POST /auth/refresh', () => {
      it('should refresh tokens with valid refresh token', async () => {
        const result = await app.inject({
          method: 'POST',
          url: '/auth/refresh',
          payload: {
            refreshToken,
          },
        });

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.payload);
        expect(body.accessToken).toBeDefined();
        expect(body.refreshToken).toBeDefined();

        accessToken = body.accessToken;
        refreshToken = body.refreshToken;
      });

      it('should fail with invalid refresh token', async () => {
        const result = await app.inject({
          method: 'POST',
          url: '/auth/refresh',
          payload: {
            refreshToken: 'invalid-refresh-token',
          },
        });

        expect(result.statusCode).toBe(401);
      });
    });

    describe('POST /auth/logout', () => {
      it('should logout successfully', async () => {
        const result = await app.inject({
          method: 'POST',
          url: '/auth/logout',
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        });

        expect(result.statusCode).toBe(200);
      });

      it('should invalidate the refresh token after logout', async () => {
        const result = await app.inject({
          method: 'POST',
          url: '/auth/refresh',
          payload: {
            refreshToken,
          },
        });

        expect(result.statusCode).toBe(401);
      });
    });
  });

  describe('Password Reset Flow', () => {
    beforeAll(async () => {
      // Re-login to get fresh tokens
      const loginResult = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: testUser.email,
          password: testUser.password,
        },
      });
      const body = JSON.parse(loginResult.payload);
      accessToken = body.accessToken;
    });

    describe('POST /auth/forgot-password', () => {
      it('should initiate password reset', async () => {
        const result = await app.inject({
          method: 'POST',
          url: '/auth/forgot-password',
          payload: {
            email: testUser.email,
          },
        });

        expect(result.statusCode).toBe(200);
      });

      it('should not reveal if email exists', async () => {
        const result = await app.inject({
          method: 'POST',
          url: '/auth/forgot-password',
          payload: {
            email: 'nonexistent@example.com',
          },
        });

        // Should still return 200 for security
        expect(result.statusCode).toBe(200);
      });
    });
  });
});
