import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { ProxyModule } from './proxy/proxy.module';
import { HealthModule } from './health/health.module';
import { AuthController } from './routes/auth.controller';
import { UsersController } from './routes/users.controller';
import { ProductsController, CategoriesController, InventoryController } from './routes/products.controller';
import { OrdersController, PaymentsController } from './routes/payments.controller';
import { JwtStrategy } from './routes/jwt.strategy';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 seconds
      limit: 100, // 100 requests per TTL
    }]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback-secret-key-for-development-only',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '15m' },
    }),
    ProxyModule,
    HealthModule,
  ],
  controllers: [
    AuthController,
    UsersController,
    ProductsController,
    CategoriesController,
    InventoryController,
    OrdersController,
    PaymentsController,
  ],
  providers: [
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {} 
