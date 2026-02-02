import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventService } from '../events/event.service';

@Module({
  controllers: [OrderController],
  providers: [OrderService, PrismaService, EventService],
  exports: [OrderService],
})
export class OrderModule {}
