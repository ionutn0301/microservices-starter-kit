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
import { Public } from './public.decorator';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(private readonly proxyService: ProxyService) {}

  @All()
  @Public()
  @ApiOperation({ summary: 'List/Create products' })
  async products(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res);
  }

  @All('*')
  @Public()
  @ApiExcludeEndpoint()
  async catchAll(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res);
  }

  private async proxyRequest(req: FastifyRequest, res: FastifyReply) {
    try {
      const result = await this.proxyService.forward(
        'products',
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

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);

  constructor(private readonly proxyService: ProxyService) {}

  @All()
  @Public()
  @ApiOperation({ summary: 'List/Create categories' })
  async categories(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res);
  }

  @All('*')
  @Public()
  @ApiExcludeEndpoint()
  async catchAll(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res);
  }

  private async proxyRequest(req: FastifyRequest, res: FastifyReply) {
    try {
      const result = await this.proxyService.forward(
        'products',
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

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(private readonly proxyService: ProxyService) {}

  @All()
  @ApiOperation({ summary: 'Inventory operations' })
  async inventory(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
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
        'products',
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
