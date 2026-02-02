import {
  Controller,
  All,
  Req,
  Res,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { FastifyRequest, FastifyReply } from 'fastify';
import { ProxyService } from '../proxy/proxy.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(private readonly proxyService: ProxyService) {}

  @All()
  @ApiOperation({ summary: 'List/Create orders' })
  async orders(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res);
  }

  @All('*')
  @ApiExcludeEndpoint()
  async catchAll(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res);
  }

  private async proxyRequest(req: FastifyRequest, res: FastifyReply) {
    try {
      const result = await this.proxyService.forward(
        'payments',
        req.method,
        req.url,
        req.body,
        req.headers as Record<string, string>,
      );
      return res.send(result);
    } catch (error: any) {
      this.logger.error(`Proxy error: ${error.message}`);
      return res.status(error.status || 500).send(error.response || { message: error.message });
    }
  }
}

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly proxyService: ProxyService) {}

  @All()
  @ApiOperation({ summary: 'Payment operations' })
  async payments(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res);
  }

  @All('*')
  @ApiExcludeEndpoint()
  async catchAll(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res);
  }

  private async proxyRequest(req: FastifyRequest, res: FastifyReply) {
    try {
      const result = await this.proxyService.forward(
        'payments',
        req.method,
        req.url,
        req.body,
        req.headers as Record<string, string>,
      );
      return res.send(result);
    } catch (error: any) {
      this.logger.error(`Proxy error: ${error.message}`);
      return res.status(error.status || 500).send(error.response || { message: error.message });
    }
  }
}
