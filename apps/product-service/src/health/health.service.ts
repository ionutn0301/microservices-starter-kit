import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  service: string;
  version: string;
  checks: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private prisma: PrismaService) {}

  async check(): Promise<HealthCheckResult> {
    const dbCheck = await this.checkDatabase();

    return {
      status: dbCheck.status === 'up' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'product-service',
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: dbCheck,
      },
    };
  }

  async checkReadiness(): Promise<{ ready: boolean; checks: Record<string, boolean> }> {
    const dbCheck = await this.checkDatabase();

    const checks = {
      database: dbCheck.status === 'up',
    };

    return {
      ready: Object.values(checks).every(Boolean),
      checks,
    };
  }

  async checkLiveness(): Promise<{ alive: boolean; timestamp: string }> {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<{
    status: 'up' | 'down';
    responseTime?: number;
    error?: string;
  }> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'up',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
