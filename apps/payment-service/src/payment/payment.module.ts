import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventService } from '../events/event.service';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, PrismaService, EventService],
  exports: [PaymentService],
})
export class PaymentModule {}
