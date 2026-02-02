import {
  Controller,
  All,
  Req,
  Res,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { FastifyRequest, FastifyReply } from 'fastify';
import { ProxyService } from '../proxy/proxy.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Public } from './public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly proxyService: ProxyService) {}

  @All('register')
  @Public()
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest('auth', req, res);
  }

  @All('login')
  @Public()
  @ApiOperation({ summary: 'User login' })
  async login(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest('auth', req, res);
  }

  @All('refresh')
  @Public()
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest('auth', req, res);
  }

  @All('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  async logout(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest('auth', req, res);
  }

  @All('forgot-password')
  @Public()
  @ApiOperation({ summary: 'Request password reset' })
  async forgotPassword(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest('auth', req, res);
  }

  @All('reset-password')
  @Public()
  @ApiOperation({ summary: 'Reset password' })
  async resetPassword(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest('auth', req, res);
  }

  @All('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  async me(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest('auth', req, res);
  }

  @All('*')
  @ApiExcludeEndpoint()
  async catchAll(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.proxyRequest('auth', req, res);
  }

  private async proxyRequest(service: string, req: FastifyRequest, res: FastifyReply) {
    try {
      const path = req.url.replace(/^\/auth/, '/auth');
      const result = await this.proxyService.forward(
        service,
        req.method,
        path,
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
