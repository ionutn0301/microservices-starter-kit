import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface ServiceConfig {
  name: string;
  baseUrl: string;
  healthEndpoint?: string;
}

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private readonly clients: Map<string, AxiosInstance> = new Map();

  private readonly services: ServiceConfig[] = [
    {
      name: 'auth',
      baseUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
      healthEndpoint: '/health',
    },
    {
      name: 'users',
      baseUrl: process.env.USER_SERVICE_URL || 'http://localhost:3002',
      healthEndpoint: '/health',
    },
    {
      name: 'products',
      baseUrl: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003',
      healthEndpoint: '/health',
    },
    {
      name: 'payments',
      baseUrl: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
      healthEndpoint: '/health',
    },
  ];

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    for (const service of this.services) {
      const client = axios.create({
        baseURL: service.baseUrl,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Request interceptor for logging
      client.interceptors.request.use(
        (config) => {
          this.logger.debug(`Proxying request to ${service.name}: ${config.method?.toUpperCase()} ${config.url}`);
          return config;
        },
        (error) => {
          this.logger.error(`Request error for ${service.name}:`, error);
          return Promise.reject(error);
        },
      );

      // Response interceptor for logging
      client.interceptors.response.use(
        (response) => {
          this.logger.debug(`Response from ${service.name}: ${response.status}`);
          return response;
        },
        (error) => {
          this.logger.error(`Response error from ${service.name}:`, error.message);
          return Promise.reject(error);
        },
      );

      this.clients.set(service.name, client);
    }
  }

  async forward(
    serviceName: string,
    method: string,
    path: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<any> {
    const client = this.clients.get(serviceName);

    if (!client) {
      throw new HttpException(
        `Service '${serviceName}' not found`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    try {
      const config: AxiosRequestConfig = {
        method: method as any,
        url: path,
        headers: this.sanitizeHeaders(headers),
      };

      if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        config.data = data;
      }

      if (method.toUpperCase() === 'GET' && data) {
        config.params = data;
      }

      const response = await client.request(config);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        // Service responded with an error
        throw new HttpException(
          error.response.data || 'Service error',
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      } else if (error.request) {
        // Service didn't respond
        this.logger.error(`Service ${serviceName} is not responding`);
        throw new HttpException(
          `Service '${serviceName}' is not available`,
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      } else {
        throw new HttpException(
          'Gateway error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async checkServiceHealth(serviceName: string): Promise<{ healthy: boolean; details?: any }> {
    const service = this.services.find((s) => s.name === serviceName);
    const client = this.clients.get(serviceName);

    if (!service || !client) {
      return { healthy: false };
    }

    try {
      const response = await client.get(service.healthEndpoint || '/health', {
        timeout: 5000,
      });
      return { healthy: true, details: response.data };
    } catch {
      return { healthy: false };
    }
  }

  async checkAllServicesHealth(): Promise<Record<string, { healthy: boolean; details?: any }>> {
    const results: Record<string, { healthy: boolean; details?: any }> = {};

    await Promise.all(
      this.services.map(async (service) => {
        results[service.name] = await this.checkServiceHealth(service.name);
      }),
    );

    return results;
  }

  private sanitizeHeaders(headers?: Record<string, string>): Record<string, string> {
    if (!headers) return {};

    // Pass through authorization and relevant headers
    const allowedHeaders = ['authorization', 'x-request-id', 'x-correlation-id', 'content-type'];
    const sanitized: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
      if (allowedHeaders.includes(key.toLowerCase())) {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  getServiceUrl(serviceName: string): string | undefined {
    const service = this.services.find((s) => s.name === serviceName);
    return service?.baseUrl;
  }
}
