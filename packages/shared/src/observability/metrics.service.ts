import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

export interface RequestLog {
  requestId: string;
  method: string;
  url: string;
  statusCode?: number;
  responseTime?: number;
  userAgent?: string;
  ip?: string;
  userId?: string;
  error?: string;
}

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
    const startTime = Date.now();
    const requestId = uuidv4();

    // Add request ID to headers
    (req as any).requestId = requestId;

    const log: RequestLog = {
      requestId,
      method: req.method || 'UNKNOWN',
      url: req.url || '',
      userAgent: req.headers['user-agent'],
      ip: req.socket?.remoteAddress,
    };

    // Log when response finishes
    res.on('finish', () => {
      log.statusCode = res.statusCode;
      log.responseTime = Date.now() - startTime;

      if (res.statusCode >= 500) {
        this.logger.error(JSON.stringify(log));
      } else if (res.statusCode >= 400) {
        this.logger.warn(JSON.stringify(log));
      } else {
        this.logger.log(JSON.stringify(log));
      }
    });

    next();
  }
}

export interface MetricsData {
  requests: {
    total: number;
    success: number;
    errors: number;
    byMethod: Record<string, number>;
    byStatusCode: Record<string, number>;
  };
  responseTime: {
    avg: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  };
  uptime: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
}

@Injectable()
export class MetricsService {
  private readonly startTime = Date.now();
  private requestCount = 0;
  private successCount = 0;
  private errorCount = 0;
  private responseTimes: number[] = [];
  private methodCounts: Record<string, number> = {};
  private statusCodeCounts: Record<string, number> = {};

  recordRequest(method: string, statusCode: number, responseTime: number) {
    this.requestCount++;
    this.responseTimes.push(responseTime);

    if (statusCode >= 400) {
      this.errorCount++;
    } else {
      this.successCount++;
    }

    this.methodCounts[method] = (this.methodCounts[method] || 0) + 1;
    this.statusCodeCounts[statusCode.toString()] =
      (this.statusCodeCounts[statusCode.toString()] || 0) + 1;

    // Keep only last 1000 response times for percentile calculations
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }
  }

  getMetrics(): MetricsData {
    const sortedTimes = [...this.responseTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);

    return {
      requests: {
        total: this.requestCount,
        success: this.successCount,
        errors: this.errorCount,
        byMethod: { ...this.methodCounts },
        byStatusCode: { ...this.statusCodeCounts },
      },
      responseTime: {
        avg:
          sortedTimes.length > 0
            ? sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length
            : 0,
        min: sortedTimes[0] || 0,
        max: sortedTimes[sortedTimes.length - 1] || 0,
        p95: sortedTimes[p95Index] || 0,
        p99: sortedTimes[p99Index] || 0,
      },
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    };
  }

  getPrometheusMetrics(): string {
    const metrics = this.getMetrics();
    const lines: string[] = [];

    lines.push('# HELP http_requests_total Total HTTP requests');
    lines.push('# TYPE http_requests_total counter');
    lines.push(`http_requests_total ${metrics.requests.total}`);

    lines.push('# HELP http_requests_success_total Successful HTTP requests');
    lines.push('# TYPE http_requests_success_total counter');
    lines.push(`http_requests_success_total ${metrics.requests.success}`);

    lines.push('# HELP http_requests_errors_total Failed HTTP requests');
    lines.push('# TYPE http_requests_errors_total counter');
    lines.push(`http_requests_errors_total ${metrics.requests.errors}`);

    lines.push('# HELP http_request_duration_ms HTTP request duration in milliseconds');
    lines.push('# TYPE http_request_duration_ms summary');
    lines.push(`http_request_duration_ms{quantile="0.5"} ${metrics.responseTime.avg}`);
    lines.push(`http_request_duration_ms{quantile="0.95"} ${metrics.responseTime.p95}`);
    lines.push(`http_request_duration_ms{quantile="0.99"} ${metrics.responseTime.p99}`);

    lines.push('# HELP process_uptime_seconds Process uptime in seconds');
    lines.push('# TYPE process_uptime_seconds gauge');
    lines.push(`process_uptime_seconds ${metrics.uptime}`);

    lines.push('# HELP process_memory_heap_bytes Process memory heap in bytes');
    lines.push('# TYPE process_memory_heap_bytes gauge');
    lines.push(`process_memory_heap_bytes ${metrics.memoryUsage.heapUsed}`);

    return lines.join('\n');
  }

  reset() {
    this.requestCount = 0;
    this.successCount = 0;
    this.errorCount = 0;
    this.responseTimes = [];
    this.methodCounts = {};
    this.statusCodeCounts = {};
  }
}

export const createMetricsService = (): MetricsService => new MetricsService();
