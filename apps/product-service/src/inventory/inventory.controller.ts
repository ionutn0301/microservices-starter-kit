import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  InventoryService,
  UpdateInventoryDto,
  ReserveInventoryDto,
  ReleaseInventoryDto,
} from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get(':productId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get inventory for a product' })
  @ApiResponse({ status: 200, description: 'Inventory retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Inventory not found' })
  async getInventory(@Param('productId') productId: string) {
    return this.inventoryService.getInventory(productId);
  }

  @Patch(':productId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update inventory for a product' })
  @ApiResponse({ status: 200, description: 'Inventory updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateInventory(
    @Param('productId') productId: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ) {
    return this.inventoryService.updateInventory(productId, updateInventoryDto);
  }

  @Post('reserve')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Reserve inventory for an order' })
  @ApiResponse({ status: 200, description: 'Inventory reserved successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient inventory' })
  async reserveInventory(@Body() reserveDto: ReserveInventoryDto) {
    return this.inventoryService.reserveInventory(reserveDto);
  }

  @Post('release')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Release reserved inventory' })
  @ApiResponse({ status: 200, description: 'Inventory released successfully' })
  @ApiResponse({ status: 400, description: 'Invalid release quantity' })
  async releaseInventory(@Body() releaseDto: ReleaseInventoryDto) {
    return this.inventoryService.releaseInventory(releaseDto);
  }

  @Get(':productId/transactions')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get inventory transaction history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  async getTransactionHistory(
    @Param('productId') productId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.inventoryService.getTransactionHistory(productId, page || 1, limit || 20);
  }

  @Get('alerts/low-stock')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get products with low stock' })
  @ApiQuery({ name: 'threshold', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Low stock products retrieved successfully' })
  async getLowStockProducts(@Query('threshold') threshold?: number) {
    return this.inventoryService.getLowStockProducts(threshold);
  }
}
