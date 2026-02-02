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

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly proxyService: ProxyService) {}

  @All('profile')
  @ApiOperation({ summary: 'User profile operations' })
  async profile(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res);
  }

  @All('profile/*')
  @ApiExcludeEndpoint()
  async profileSubRoutes(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res);
  }

  @All('address')
  @ApiOperation({ summary: 'User address operations' })
  async address(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res);
  }

  @All('address/*')
  @ApiExcludeEndpoint()
  async addressSubRoutes(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res);
  }

  @All('preferences')
  @ApiOperation({ summary: 'User preferences operations' })
  async preferences(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest(req, res);
  }

  @All('preferences/*')
  @ApiExcludeEndpoint()
  async preferencesSubRoutes(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
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
        'users',
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
