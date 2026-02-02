import { Injectable, Logger } from '@nestjs/common';

export interface HealthIndicator {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  details?: Record<string, any>;
  responseTime?: number;
}

export interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'unhealthy';
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
  indicators: HealthIndicator[];
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();
  private readonly serviceName: string;
  private readonly version: string;

  constructor(serviceName: string, version: string = '1.0.0') {
    this.serviceName = serviceName;
    this.version = version;
  }

  async checkHealth(indicators: HealthIndicator[]): Promise<HealthCheckResult> {
    const hasUnhealthy = indicators.some((i) => i.status === 'unhealthy');
    const hasDegraded = indicators.some((i) => i.status === 'degraded');

    let status: 'ok' | 'degraded' | 'unhealthy' = 'ok';
    if (hasUnhealthy) {
      status = 'unhealthy';
    } else if (hasDegraded) {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      version: this.version,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      indicators,
    };
  }

  async checkDatabase(
    prisma: any,
    name: string = 'database',
  ): Promise<HealthIndicator> {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        name,
        status: 'healthy',
        responseTime: Date.now() - start,
        details: { connected: true },
      };
    } catch (error) {
      this.logger.error(`Database health check failed: ${error.message}`);
      return {
        name,
        status: 'unhealthy',
        responseTime: Date.now() - start,
        details: { error: error.message },
      };
    }
  }

  async checkRedis(redis: any, name: string = 'redis'): Promise<HealthIndicator> {
    const start = Date.now();
    try {
      await redis.ping();
      return {
        name,
        status: 'healthy',
        responseTime: Date.now() - start,
        details: { connected: true },
      };
    } catch (error) {
      this.logger.error(`Redis health check failed: ${error.message}`);
      return {
        name,
        status: 'unhealthy',
        responseTime: Date.now() - start,
        details: { error: error.message },
      };
    }
  }

  async checkRabbitMQ(
    connection: any,
    name: string = 'rabbitmq',
  ): Promise<HealthIndicator> {
    const start = Date.now();
    try {
      if (connection && connection.isConnected && connection.isConnected()) {
        return {
          name,
          status: 'healthy',
          responseTime: Date.now() - start,
          details: { connected: true },
        };
      }
      return {
        name,
        status: 'degraded',
        responseTime: Date.now() - start,
        details: { connected: false, message: 'Connection not established' },
      };
    } catch (error) {
      this.logger.error(`RabbitMQ health check failed: ${error.message}`);
      return {
        name,
        status: 'unhealthy',
        responseTime: Date.now() - start,
        details: { error: error.message },
      };
    }
  }

  async checkExternalService(
    url: string,
    name: string,
    timeoutMs: number = 5000,
  ): Promise<HealthIndicator> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${url}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        return {
          name,
          status: 'healthy',
          responseTime: Date.now() - start,
          details: { statusCode: response.status },
        };
      }
      return {
        name,
        status: 'degraded',
        responseTime: Date.now() - start,
        details: { statusCode: response.status },
      };
    } catch (error) {
      this.logger.error(`External service ${name} health check failed: ${error.message}`);
      return {
        name,
        status: 'unhealthy',
        responseTime: Date.now() - start,
        details: { error: error.message },
      };
    }
  }

  getReadiness(): { status: string; timestamp: string } {
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }

  getLiveness(): { status: string; timestamp: string } {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }
}

export function createHealthService(
  serviceName: string,
  version?: string,
): HealthService {
  return new HealthService(serviceName, version);
}
