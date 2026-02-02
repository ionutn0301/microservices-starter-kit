import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { InventoryModule } from './inventory/inventory.module';
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
    ProductModule,
    CategoryModule,
    InventoryModule,
    HealthModule,
  ],
  providers: [JwtStrategy, PrismaService],
})
export class AppModule {} 
