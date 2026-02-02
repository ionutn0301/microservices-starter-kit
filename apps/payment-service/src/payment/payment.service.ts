import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventService } from '../events/event.service';
import { ProcessPaymentDto, PaymentMethod, PaymentStatus, OrderStatus } from '@microservices/shared';
import { Decimal } from '@prisma/client/runtime/library';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
    private eventService: EventService,
  ) {}

  async processPayment(processPaymentDto: ProcessPaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: processPaymentDto.orderId },
      include: { payments: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Order is not in pending status');
    }

    // Check if payment already exists
    const existingPayment = order.payments.find((p) => p.status === 'COMPLETED');
    if (existingPayment) {
      throw new BadRequestException('Order already paid');
    }

    // Generate transaction ID
    const transactionId = `TXN-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Simulate payment processing
    const paymentResult = await this.simulatePaymentGateway(
      processPaymentDto.method,
      order.total.toNumber(),
      processPaymentDto.paymentDetails,
    );

    if (paymentResult.success) {
      // Create successful payment record
      const payment = await this.prisma.payment.create({
        data: {
          orderId: order.id,
          amount: order.total,
          currency: order.currency,
          status: 'COMPLETED',
          method: this.mapPaymentMethod(processPaymentDto.method),
          transactionId,
          gatewayResponse: paymentResult.gatewayResponse,
        },
      });

      // Update order status
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'CONFIRMED' },
      });

      // Publish payment processed event
      await this.eventService.publishPaymentProcessed({
        paymentId: payment.id,
        orderId: order.id,
        amount: order.total.toNumber(),
        currency: order.currency,
        method: processPaymentDto.method,
        transactionId,
        timestamp: new Date(),
      });

      this.logger.log(`Payment processed successfully for order ${order.orderNumber}`);

      return {
        success: true,
        paymentId: payment.id,
        transactionId,
        message: 'Payment processed successfully',
      };
    } else {
      // Create failed payment record
      await this.prisma.payment.create({
        data: {
          orderId: order.id,
          amount: order.total,
          currency: order.currency,
          status: 'FAILED',
          method: this.mapPaymentMethod(processPaymentDto.method),
          transactionId,
          failureReason: paymentResult.error,
          gatewayResponse: paymentResult.gatewayResponse,
        },
      });

      // Publish payment failed event
      await this.eventService.publishPaymentFailed({
        orderId: order.id,
        amount: order.total.toNumber(),
        currency: order.currency,
        method: processPaymentDto.method,
        reason: paymentResult.error || 'Payment processing failed',
        timestamp: new Date(),
      });

      this.logger.warn(`Payment failed for order ${order.orderNumber}: ${paymentResult.error}`);

      return {
        success: false,
        error: paymentResult.error,
        message: 'Payment failed',
      };
    }
  }

  async getPaymentsByOrder(orderId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { orderId },
      include: { refunds: true },
      orderBy: { createdAt: 'desc' },
    });

    return payments;
  }

  async getPayment(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        order: true,
        refunds: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async requestRefund(paymentId: string, amount: number, reason: string) {
    const payment = await this.getPayment(paymentId);

    if (payment.status !== 'COMPLETED') {
      throw new BadRequestException('Can only refund completed payments');
    }

    // Calculate total already refunded
    const totalRefunded = payment.refunds
      .filter((r) => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + r.amount.toNumber(), 0);

    const availableForRefund = payment.amount.toNumber() - totalRefunded;

    if (amount > availableForRefund) {
      throw new BadRequestException(
        `Refund amount exceeds available amount. Available: ${availableForRefund}`,
      );
    }

    const transactionId = `REF-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Simulate refund processing
    const refundResult = await this.simulateRefundGateway(amount, payment.transactionId);

    if (refundResult.success) {
      const refund = await this.prisma.refund.create({
        data: {
          paymentId: payment.id,
          amount: new Decimal(amount),
          currency: payment.currency,
          reason,
          status: 'COMPLETED',
          transactionId,
        },
      });

      // If full refund, update order status
      if (amount === payment.amount.toNumber()) {
        await this.prisma.order.update({
          where: { id: payment.orderId },
          data: { status: 'REFUNDED' },
        });
      }

      // Publish refund processed event
      await this.eventService.publishRefundProcessed({
        refundId: refund.id,
        paymentId: payment.id,
        orderId: payment.orderId,
        amount,
        currency: payment.currency,
        reason,
        timestamp: new Date(),
      });

      this.logger.log(`Refund processed: ${refund.id} for payment ${paymentId}`);

      return {
        success: true,
        refundId: refund.id,
        transactionId,
        message: 'Refund processed successfully',
      };
    } else {
      await this.prisma.refund.create({
        data: {
          paymentId: payment.id,
          amount: new Decimal(amount),
          currency: payment.currency,
          reason,
          status: 'FAILED',
          transactionId,
        },
      });

      return {
        success: false,
        error: refundResult.error,
        message: 'Refund failed',
      };
    }
  }

  // Simulate payment gateway
  private async simulatePaymentGateway(
    method: PaymentMethod,
    amount: number,
    paymentDetails?: Record<string, any>,
  ): Promise<{ success: boolean; error?: string; gatewayResponse: any }> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Simulate 95% success rate
    const success = Math.random() > 0.05;

    if (success) {
      return {
        success: true,
        gatewayResponse: {
          status: 'approved',
          authorizationCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
          processorResponse: '00',
          timestamp: new Date().toISOString(),
        },
      };
    } else {
      const errors = [
        'Insufficient funds',
        'Card declined',
        'Invalid card number',
        'Expired card',
        'Gateway timeout',
      ];
      return {
        success: false,
        error: errors[Math.floor(Math.random() * errors.length)],
        gatewayResponse: {
          status: 'declined',
          errorCode: 'E001',
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  // Simulate refund gateway
  private async simulateRefundGateway(
    amount: number,
    originalTransactionId: string,
  ): Promise<{ success: boolean; error?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Simulate 98% success rate for refunds
    const success = Math.random() > 0.02;

    if (success) {
      return { success: true };
    } else {
      return { success: false, error: 'Refund gateway error' };
    }
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
}
