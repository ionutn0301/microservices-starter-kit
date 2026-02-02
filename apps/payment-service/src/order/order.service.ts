import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventService } from '../events/event.service';
import { CreateOrderDto, PaymentMethod, OrderStatus } from '@microservices/shared';
import { Decimal } from '@prisma/client/runtime/library';
import { v4 as uuidv4 } from 'uuid';

// Simulated product service call (in real scenario, this would be an HTTP call)
interface ProductInfo {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private prisma: PrismaService,
    private eventService: EventService,
  ) {}

  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    // In a real scenario, we would call the product service to get product info
    // For demo purposes, we'll use mock data
    const productInfos = await this.getProductInfos(createOrderDto.items.map((i) => i.productId));

    // Calculate totals
    let subtotal = 0;
    const orderItems = createOrderDto.items.map((item) => {
      const product = productInfos.find((p) => p.id === item.productId);
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }
      if (!product.available) {
        throw new BadRequestException(`Product ${product.name} is not available`);
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      return {
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        price: new Decimal(product.price),
        total: new Decimal(itemTotal),
      };
    });

    // Calculate tax and shipping (simplified)
    const tax = subtotal * 0.1; // 10% tax
    const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
    const total = subtotal + tax + shipping;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Create order with items and addresses
    const order = await this.prisma.order.create({
      data: {
        userId,
        orderNumber,
        subtotal: new Decimal(subtotal),
        tax: new Decimal(tax),
        shipping: new Decimal(shipping),
        total: new Decimal(total),
        paymentMethod: this.mapPaymentMethod(createOrderDto.paymentMethod),
        items: {
          create: orderItems,
        },
        shippingAddress: {
          create: createOrderDto.shippingAddress,
        },
        billingAddress: createOrderDto.billingAddress
          ? { create: createOrderDto.billingAddress }
          : { create: createOrderDto.shippingAddress },
      },
      include: {
        items: true,
        shippingAddress: true,
        billingAddress: true,
      },
    });

    // Publish order created event
    await this.eventService.publishOrderCreated({
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      total: order.total.toNumber(),
      currency: order.currency,
      items: order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price.toNumber(),
      })),
      timestamp: new Date(),
    });

    this.logger.log(`Created order: ${order.orderNumber}`);
    return order;
  }

  async findAllByUser(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          items: true,
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    return {
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId?: string) {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }

    const order = await this.prisma.order.findFirst({
      where,
      include: {
        items: true,
        payments: true,
        shippingAddress: true,
        billingAddress: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async findByOrderNumber(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        payments: true,
        shippingAddress: true,
        billingAddress: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.findOne(id);
    const previousStatus = order.status;

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status: this.mapOrderStatus(status) },
      include: {
        items: true,
        payments: true,
      },
    });

    // Publish status updated event
    await this.eventService.publishOrderStatusUpdated({
      orderId: order.id,
      orderNumber: order.orderNumber,
      previousStatus,
      newStatus: status,
      timestamp: new Date(),
    });

    this.logger.log(`Updated order ${order.orderNumber} status: ${previousStatus} -> ${status}`);
    return updatedOrder;
  }

  async cancelOrder(id: string, userId: string) {
    const order = await this.findOne(id, userId);

    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw new BadRequestException('Order cannot be cancelled in current status');
    }

    return this.updateStatus(id, OrderStatus.CANCELLED);
  }

  // Mock product service call
  private async getProductInfos(productIds: string[]): Promise<ProductInfo[]> {
    // In a real scenario, this would call the product service
    // For demo, returning mock data
    return productIds.map((id) => ({
      id,
      name: `Product ${id.substring(0, 8)}`,
      price: Math.floor(Math.random() * 100) + 10,
      available: true,
    }));
  }

  private mapPaymentMethod(method: PaymentMethod): any {
    const mapping: Record<PaymentMethod, string> = {
      [PaymentMethod.CREDIT_CARD]: 'CREDIT_CARD',
      [PaymentMethod.DEBIT_CARD]: 'DEBIT_CARD',
      [PaymentMethod.PAYPAL]: 'PAYPAL',
      [PaymentMethod.STRIPE]: 'STRIPE',
      [PaymentMethod.BANK_TRANSFER]: 'BANK_TRANSFER',
    };
    return mapping[method];
  }

  private mapOrderStatus(status: OrderStatus): any {
    const mapping: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'PENDING',
      [OrderStatus.CONFIRMED]: 'CONFIRMED',
      [OrderStatus.PROCESSING]: 'PROCESSING',
      [OrderStatus.SHIPPED]: 'SHIPPED',
      [OrderStatus.DELIVERED]: 'DELIVERED',
      [OrderStatus.CANCELLED]: 'CANCELLED',
      [OrderStatus.REFUNDED]: 'REFUNDED',
    };
    return mapping[status];
  }
}
