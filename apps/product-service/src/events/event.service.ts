import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { connect, Channel, ChannelModel } from 'amqplib';
import { PRODUCT_EVENTS } from '@microservices/shared';

export interface ProductCreatedEvent {
  productId: string;
  name: string;
  sku: string;
  price: number;
  categoryId: string;
  timestamp: Date;
}

export interface ProductUpdatedEvent {
  productId: string;
  changes: Record<string, any>;
  timestamp: Date;
}

export interface ProductDeletedEvent {
  productId: string;
  sku: string;
  timestamp: Date;
}

export interface InventoryUpdatedEvent {
  productId: string;
  sku: string;
  previousQuantity: number;
  newQuantity: number;
  available: number;
  timestamp: Date;
}

export interface LowStockAlertEvent {
  productId: string;
  sku: string;
  productName: string;
  currentQuantity: number;
  threshold: number;
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

  async publishProductCreated(event: ProductCreatedEvent): Promise<boolean> {
    return this.publish(PRODUCT_EVENTS.CREATED, event);
  }

  async publishProductUpdated(event: ProductUpdatedEvent): Promise<boolean> {
    return this.publish(PRODUCT_EVENTS.UPDATED, event);
  }

  async publishProductDeleted(event: ProductDeletedEvent): Promise<boolean> {
    return this.publish(PRODUCT_EVENTS.DELETED, event);
  }

  async publishInventoryUpdated(event: InventoryUpdatedEvent): Promise<boolean> {
    return this.publish(PRODUCT_EVENTS.INVENTORY_UPDATED, event);
  }

  async publishLowStockAlert(event: LowStockAlertEvent): Promise<boolean> {
    return this.publish(PRODUCT_EVENTS.LOW_STOCK_ALERT, event);
  }
}
