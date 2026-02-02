import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Gateway health check' })
  @ApiResponse({ status: 200, description: 'Gateway is healthy' })
  async check() {
    return this.healthService.check();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Gateway readiness check' })
  @ApiResponse({ status: 200, description: 'Gateway is ready' })
  async ready() {
    return this.healthService.checkReadiness();
  }

  @Get('live')
  @ApiOperation({ summary: 'Gateway liveness check' })
  @ApiResponse({ status: 200, description: 'Gateway is alive' })
  async live() {
    return this.healthService.checkLiveness();
  }

  @Get('services')
  @ApiOperation({ summary: 'Check all services health' })
  @ApiResponse({ status: 200, description: 'Services health status' })
  async services() {
    return this.healthService.checkAllServices();
  }
}
