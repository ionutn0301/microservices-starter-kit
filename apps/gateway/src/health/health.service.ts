import { Injectable, Logger } from '@nestjs/common';
import { ProxyService } from '../proxy/proxy.service';

interface GatewayHealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
  services: Record<string, { healthy: boolean; details?: any }>;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(private proxyService: ProxyService) {}

  async check(): Promise<GatewayHealthCheckResult> {
    const servicesHealth = await this.proxyService.checkAllServicesHealth();
    const allHealthy = Object.values(servicesHealth).every((s) => s.healthy);
    const anyHealthy = Object.values(servicesHealth).some((s) => s.healthy);

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (allHealthy) {
      status = 'healthy';
    } else if (anyHealthy) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      service: 'gateway',
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      services: servicesHealth,
    };
  }

  async checkReadiness(): Promise<{ ready: boolean; checks: Record<string, boolean> }> {
    const servicesHealth = await this.proxyService.checkAllServicesHealth();

    const checks: Record<string, boolean> = {};
    for (const [name, health] of Object.entries(servicesHealth)) {
      checks[name] = health.healthy;
    }

    // Gateway is ready if at least auth service is up
    const authHealthy = checks['auth'] ?? false;

    return {
      ready: authHealthy,
      checks,
    };
  }

  async checkLiveness(): Promise<{ alive: boolean; timestamp: string; uptime: number }> {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  async checkAllServices(): Promise<Record<string, { healthy: boolean; details?: any }>> {
    return this.proxyService.checkAllServicesHealth();
  }
}
