import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { OrderModule } from './order/order.module';
import { PaymentModule } from './payment/payment.module';
import { HealthModule } from './health/health.module';
import { JwtStrategy } from './auth/jwt.strategy';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback-secret-key-for-development-only',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '15m' },
    }),
    OrderModule,
    PaymentModule,
    HealthModule,
  ],
  providers: [JwtStrategy, PrismaService],
})
export class AppModule {} 
