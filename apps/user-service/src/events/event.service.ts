import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { connect, Channel, ChannelModel } from 'amqplib';
import { 
  UserProfileUpdatedEvent, 
  UserDeletedEvent, 
  UserPreferencesUpdatedEvent,
  USER_EVENTS 
} from '@microservices/shared';

@Injectable()
export class EventService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventService.name);
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private isConnected = false;
  private readonly exchangeName = 'microservices.events';
  private readonly maxRetries = 3;
  private readonly retryDelay = 5000; // 5 seconds

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
      
      if(!rabbitmqUrl) {
        this.logger.error('RABBITMQ_URL environment variable is not set');
        
        return;
      }
      this.logger.log(`Connecting to RabbitMQ at ${rabbitmqUrl}`);
      
      this.connection = await connect(rabbitmqUrl);
      
      this.channel = await this.connection.createChannel();

      // Setup connection error handlers
      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error:', err);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
      });

      this.channel.on('error', (err) => {
        this.logger.error('RabbitMQ channel error:', err);
      });

      // Declare exchange
      await this.channel.assertExchange(this.exchangeName, 'topic', { durable: true });
      
      this.isConnected = true;
      this.logger.log('Successfully connected to RabbitMQ');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
      this.isConnected = false;
      
      // Retry connection after delay
      setTimeout(() => {
        this.connect();
      }, this.retryDelay);
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
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ:', error);
    }
  }

  private async ensureConnection(): Promise<boolean> {
    if (!this.isConnected || !this.channel) {
      this.logger.warn('RabbitMQ not connected, attempting to reconnect...');
      await this.connect();
    }
    return this.isConnected && this.channel !== null;
  }

  async publishUserProfileUpdated(event: UserProfileUpdatedEvent): Promise<boolean> {
    return this.publishEvent(USER_EVENTS.PROFILE_UPDATED, event);
  }

  async publishUserDeleted(event: UserDeletedEvent): Promise<boolean> {
    return this.publishEvent(USER_EVENTS.DELETED, event);
  }

  async publishUserPreferencesUpdated(event: UserPreferencesUpdatedEvent): Promise<boolean> {
    return this.publishEvent(USER_EVENTS.PREFERENCES_UPDATED, event);
  }

  private async publishEvent(eventType: string, data: any, retries = 0): Promise<boolean> {
    try {
      const isReady = await this.ensureConnection();
      if (!isReady) {
        throw new Error('RabbitMQ connection not available');
      }

      const message = {
        eventType,
        data,
        timestamp: new Date().toISOString(),
        service: 'user-service',
        version: '1.0.0',
      };

      const messageBuffer = Buffer.from(JSON.stringify(message));

      const published = await this.channel!.publish(
        this.exchangeName,
        eventType,
        messageBuffer,
        { 
          persistent: true,
          messageId: `${eventType}-${Date.now()}`,
          timestamp: Date.now(),
        }
      );

      if (published) {
        this.logger.log(`Successfully published event: ${eventType}`);
        return true;
      } else {
        throw new Error('Failed to publish message to exchange');
      }
    } catch (error) {
      this.logger.error(`Failed to publish event ${eventType}:`, error);
      
      // Retry logic
      if (retries < this.maxRetries) {
        this.logger.log(`Retrying event publication... Attempt ${retries + 1}/${this.maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.publishEvent(eventType, data, retries + 1);
      }
      
      this.logger.error(`Max retries reached for event ${eventType}. Event lost.`);
      return false;
    }
  }

  // Health check method
  async isHealthy(): Promise<boolean> {
    return this.isConnected && this.channel !== null;
  }

  // Get connection status
  getConnectionStatus(): { connected: boolean; exchange: string } {
    return {
      connected: this.isConnected,
      exchange: this.exchangeName,
    };
  }
}
