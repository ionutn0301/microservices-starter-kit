import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventService } from '../events/event.service';

@Module({
  controllers: [ProductController],
  providers: [ProductService, PrismaService, EventService],
  exports: [ProductService],
})
export class ProductModule {}
