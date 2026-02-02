import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventService } from '../events/event.service';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, PrismaService, EventService],
  exports: [InventoryService],
})
export class InventoryModule {}
