import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { ProcessPaymentDto } from '@microservices/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process a payment for an order' })
  @ApiResponse({ status: 200, description: 'Payment processed' })
  @ApiResponse({ status: 400, description: 'Payment failed or order not in pending status' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async processPayment(@Body() processPaymentDto: ProcessPaymentDto) {
    return this.paymentService.processPayment(processPaymentDto);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get all payments for an order' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  async getPaymentsByOrder(@Param('orderId') orderId: string) {
    return this.paymentService.getPaymentsByOrder(orderId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPayment(@Param('id') id: string) {
    return this.paymentService.getPayment(id);
  }

  @Post(':id/refund')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a refund for a payment' })
  @ApiResponse({ status: 200, description: 'Refund processed' })
  @ApiResponse({ status: 400, description: 'Refund failed or invalid amount' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async requestRefund(
    @Param('id') id: string,
    @Body() body: { amount: number; reason: string },
  ) {
    return this.paymentService.requestRefund(id, body.amount, body.reason);
  }
}
