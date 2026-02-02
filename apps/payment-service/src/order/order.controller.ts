import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from '@microservices/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or product unavailable' })
  async create(@Request() req: any, @Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createOrder(req.user.userId, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders for the current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async findAll(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.orderService.findAllByUser(req.user.userId, page || 1, limit || 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.orderService.findOne(id, req.user.userId);
  }

  @Get('number/:orderNumber')
  @ApiOperation({ summary: 'Get an order by order number' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findByOrderNumber(@Param('orderNumber') orderNumber: string) {
    return this.orderService.findByOrderNumber(orderNumber);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async cancel(@Request() req: any, @Param('id') id: string) {
    return this.orderService.cancelOrder(id, req.user.userId);
  }
}
