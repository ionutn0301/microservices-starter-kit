import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { connect, Channel, ChannelModel } from 'amqplib';
import { PAYMENT_EVENTS } from '@microservices/shared';

export interface OrderCreatedEvent {
  orderId: string;
  orderNumber: string;
  userId: string;
  total: number;
  currency: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  timestamp: Date;
}

export interface OrderStatusUpdatedEvent {
  orderId: string;
  orderNumber: string;
  previousStatus: string;
  newStatus: string;
  timestamp: Date;
}

export interface PaymentProcessedEvent {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  method: string;
  transactionId: string;
  timestamp: Date;
}

export interface PaymentFailedEvent {
  orderId: string;
  amount: number;
  currency: string;
  method: string;
  reason: string;
  timestamp: Date;
}

export interface RefundProcessedEvent {
  refundId: string;
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  reason: string;
  timestamp: Date;
}

@Injectable()
export class EventService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventService.name);
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private isConnected = false;
  private readonly exchangeName = 'microservices.events';
  private readonly retryDelay = 5000;

  async onModuleInit() {
    this.logger.log('Initializing EventService...');
    await this.connect();
  }

  async onModuleDestroy() {
    this.logger.log('Destroying EventService...');
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      const rabbitmqUrl = process.env.RABBITMQ_URL;

      if (!rabbitmqUrl) {
        this.logger.warn('RABBITMQ_URL not set, event publishing disabled');
        return;
      }

      this.logger.log(`Connecting to RabbitMQ at ${rabbitmqUrl}`);
      this.connection = await connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error:', err);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
      });

      await this.channel.assertExchange(this.exchangeName, 'topic', { durable: true });
      this.isConnected = true;
      this.logger.log('Successfully connected to RabbitMQ');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
      this.isConnected = false;
      setTimeout(() => this.connect(), this.retryDelay);
    }
  }

  private async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      this.isConnected = false;
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ:', error);
    }
  }

  private async publish(routingKey: string, data: any): Promise<boolean> {
    if (!this.isConnected || !this.channel) {
      this.logger.warn(`Cannot publish ${routingKey}: Not connected to RabbitMQ`);
      return false;
    }

    try {
      const message = Buffer.from(JSON.stringify(data));
      this.channel.publish(this.exchangeName, routingKey, message, {
        persistent: true,
        contentType: 'application/json',
      });
      this.logger.log(`Published event: ${routingKey}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to publish ${routingKey}:`, error);
      return false;
    }
  }

  async publishOrderCreated(event: OrderCreatedEvent): Promise<boolean> {
    return this.publish(PAYMENT_EVENTS.ORDER_CREATED, event);
  }

  async publishOrderStatusUpdated(event: OrderStatusUpdatedEvent): Promise<boolean> {
    return this.publish(PAYMENT_EVENTS.ORDER_STATUS_UPDATED, event);
  }

  async publishPaymentProcessed(event: PaymentProcessedEvent): Promise<boolean> {
    return this.publish(PAYMENT_EVENTS.PAYMENT_PROCESSED, event);
  }

  async publishPaymentFailed(event: PaymentFailedEvent): Promise<boolean> {
    return this.publish(PAYMENT_EVENTS.PAYMENT_FAILED, event);
  }

  async publishRefundProcessed(event: RefundProcessedEvent): Promise<boolean> {
    return this.publish(PAYMENT_EVENTS.REFUND_PROCESSED, event);
  }
}
