import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventService } from '../events/event.service';

export interface UpdateInventoryDto {
  quantity?: number;
  reserved?: number;
  lowStockThreshold?: number;
  isTracked?: boolean;
}

export interface ReserveInventoryDto {
  productId: string;
  quantity: number;
  reference?: string;
}

export interface ReleaseInventoryDto {
  productId: string;
  quantity: number;
  reference?: string;
}

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private prisma: PrismaService,
    private eventService: EventService,
  ) {}

  async getInventory(productId: string) {
    const inventory = await this.prisma.productInventory.findUnique({
      where: { productId },
      include: {
        product: {
          select: { id: true, name: true, sku: true },
        },
      },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found for this product');
    }

    return inventory;
  }

  async updateInventory(productId: string, updateInventoryDto: UpdateInventoryDto) {
    const inventory = await this.getInventory(productId);
    const previousQuantity = inventory.quantity;

    const quantity = updateInventoryDto.quantity ?? inventory.quantity;
    const reserved = updateInventoryDto.reserved ?? inventory.reserved;
    const available = quantity - reserved;

    if (available < 0) {
      throw new BadRequestException('Available quantity cannot be negative');
    }

    const updatedInventory = await this.prisma.productInventory.update({
      where: { productId },
      data: {
        quantity,
        reserved,
        available,
        lowStockThreshold: updateInventoryDto.lowStockThreshold,
        isTracked: updateInventoryDto.isTracked,
      },
      include: {
        product: {
          select: { id: true, name: true, sku: true },
        },
      },
    });

    // Record transaction
    if (updateInventoryDto.quantity !== undefined && updateInventoryDto.quantity !== previousQuantity) {
      await this.prisma.inventoryTransaction.create({
        data: {
          productId,
          type: updateInventoryDto.quantity > previousQuantity ? 'RESTOCK' : 'ADJUSTMENT',
          quantity: updateInventoryDto.quantity - previousQuantity,
          reason: 'Manual inventory update',
        },
      });
    }

    // Publish inventory updated event
    await this.eventService.publishInventoryUpdated({
      productId,
      sku: updatedInventory.product.sku,
      previousQuantity,
      newQuantity: quantity,
      available,
      timestamp: new Date(),
    });

    // Check for low stock
    if (available <= updatedInventory.lowStockThreshold && updatedInventory.isTracked) {
      await this.eventService.publishLowStockAlert({
        productId,
        sku: updatedInventory.product.sku,
        productName: updatedInventory.product.name,
        currentQuantity: available,
        threshold: updatedInventory.lowStockThreshold,
        timestamp: new Date(),
      });
      this.logger.warn(`Low stock alert for product ${productId}: ${available} units remaining`);
    }

    this.logger.log(`Updated inventory for product ${productId}: ${previousQuantity} -> ${quantity}`);
    return updatedInventory;
  }

  async reserveInventory(reserveDto: ReserveInventoryDto) {
    const inventory = await this.getInventory(reserveDto.productId);

    if (inventory.available < reserveDto.quantity) {
      throw new BadRequestException(
        `Insufficient inventory. Available: ${inventory.available}, Requested: ${reserveDto.quantity}`,
      );
    }

    const updatedInventory = await this.prisma.productInventory.update({
      where: { productId: reserveDto.productId },
      data: {
        reserved: inventory.reserved + reserveDto.quantity,
        available: inventory.available - reserveDto.quantity,
      },
      include: {
        product: {
          select: { id: true, name: true, sku: true },
        },
      },
    });

    // Record transaction
    await this.prisma.inventoryTransaction.create({
      data: {
        productId: reserveDto.productId,
        type: 'RESERVE',
        quantity: -reserveDto.quantity,
        reason: 'Inventory reservation',
        reference: reserveDto.reference,
      },
    });

    this.logger.log(`Reserved ${reserveDto.quantity} units for product ${reserveDto.productId}`);
    return updatedInventory;
  }

  async releaseInventory(releaseDto: ReleaseInventoryDto) {
    const inventory = await this.getInventory(releaseDto.productId);

    if (inventory.reserved < releaseDto.quantity) {
      throw new BadRequestException(
        `Cannot release more than reserved. Reserved: ${inventory.reserved}, Requested: ${releaseDto.quantity}`,
      );
    }

    const updatedInventory = await this.prisma.productInventory.update({
      where: { productId: releaseDto.productId },
      data: {
        reserved: inventory.reserved - releaseDto.quantity,
        available: inventory.available + releaseDto.quantity,
      },
      include: {
        product: {
          select: { id: true, name: true, sku: true },
        },
      },
    });

    // Record transaction
    await this.prisma.inventoryTransaction.create({
      data: {
        productId: releaseDto.productId,
        type: 'RELEASE',
        quantity: releaseDto.quantity,
        reason: 'Inventory release',
        reference: releaseDto.reference,
      },
    });

    this.logger.log(`Released ${releaseDto.quantity} units for product ${releaseDto.productId}`);
    return updatedInventory;
  }

  async deductInventory(productId: string, quantity: number, reference?: string) {
    const inventory = await this.getInventory(productId);

    // First check if it was reserved
    const deductFromReserved = Math.min(inventory.reserved, quantity);
    const deductFromAvailable = quantity - deductFromReserved;

    if (deductFromAvailable > inventory.available) {
      throw new BadRequestException('Insufficient inventory');
    }

    const updatedInventory = await this.prisma.productInventory.update({
      where: { productId },
      data: {
        quantity: inventory.quantity - quantity,
        reserved: inventory.reserved - deductFromReserved,
        available: inventory.available - deductFromAvailable,
      },
      include: {
        product: {
          select: { id: true, name: true, sku: true },
        },
      },
    });

    // Record transaction
    await this.prisma.inventoryTransaction.create({
      data: {
        productId,
        type: 'SALE',
        quantity: -quantity,
        reason: 'Inventory deduction for order',
        reference,
      },
    });

    // Check for low stock
    if (updatedInventory.available <= updatedInventory.lowStockThreshold && updatedInventory.isTracked) {
      await this.eventService.publishLowStockAlert({
        productId,
        sku: updatedInventory.product.sku,
        productName: updatedInventory.product.name,
        currentQuantity: updatedInventory.available,
        threshold: updatedInventory.lowStockThreshold,
        timestamp: new Date(),
      });
    }

    this.logger.log(`Deducted ${quantity} units from product ${productId}`);
    return updatedInventory;
  }

  async getTransactionHistory(productId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.inventoryTransaction.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.inventoryTransaction.count({ where: { productId } }),
    ]);

    return {
      data: transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getLowStockProducts(threshold?: number) {
    const products = await this.prisma.productInventory.findMany({
      where: {
        isTracked: true,
        available: {
          lte: threshold ?? this.prisma.productInventory.fields.lowStockThreshold,
        },
      },
      include: {
        product: {
          select: { id: true, name: true, sku: true, status: true },
        },
      },
      orderBy: { available: 'asc' },
    });

    // Filter to only include products where available <= their individual threshold
    return products.filter((inv) => inv.available <= inv.lowStockThreshold);
  }
}
