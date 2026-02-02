import { IsString, IsNumber, IsOptional, IsArray, IsEnum, IsObject, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '../types/product.types';

export class ProductInventoryDto {
  @ApiProperty({
    description: 'Available quantity in stock',
    example: 100,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Reserved quantity (pending orders)',
    example: 5,
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reserved?: number = 0;

  @ApiProperty({
    description: 'Threshold for low stock alerts',
    example: 10,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  lowStockThreshold: number;

  @ApiPropertyOptional({
    description: 'Whether inventory is tracked for this product',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isTracked?: boolean = true;
}

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Wireless Bluetooth Headphones',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Product description',
    example: 'High-quality wireless headphones with noise cancellation',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Product price',
    example: 99.99,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Currency code (ISO 4217)',
    example: 'USD',
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Stock Keeping Unit (unique identifier)',
    example: 'WBH-001-BLK',
  })
  @IsString()
  sku: string;

  @ApiProperty({
    description: 'Category ID',
    example: 'cat_electronics_001',
  })
  @IsString()
  categoryId: string;

  @ApiPropertyOptional({
    description: 'Product image URLs',
    example: ['https://example.com/images/product1.jpg'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({
    description: 'Product specifications',
    example: { color: 'Black', weight: '250g', batteryLife: '30 hours' },
  })
  @IsOptional()
  @IsObject()
  specifications?: Record<string, any>;

  @ApiProperty({
    description: 'Inventory information',
    type: ProductInventoryDto,
  })
  @IsObject()
  @Type(() => ProductInventoryDto)
  inventory: ProductInventoryDto;

  @ApiPropertyOptional({
    description: 'Product tags for search and filtering',
    example: ['wireless', 'bluetooth', 'audio'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateProductDto {
  @ApiPropertyOptional({
    description: 'Product name',
    example: 'Wireless Bluetooth Headphones Pro',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'Updated high-quality wireless headphones',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Product price',
    example: 129.99,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    description: 'Currency code (ISO 4217)',
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Category ID',
    example: 'cat_electronics_002',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Product image URLs',
    example: ['https://example.com/images/product1-v2.jpg'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({
    description: 'Product specifications',
    example: { color: 'Silver', weight: '240g' },
  })
  @IsOptional()
  @IsObject()
  specifications?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Inventory information',
    type: ProductInventoryDto,
  })
  @IsOptional()
  @IsObject()
  @Type(() => ProductInventoryDto)
  inventory?: ProductInventoryDto;

  @ApiPropertyOptional({
    description: 'Product status',
    enum: ProductStatus,
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({
    description: 'Product tags',
    example: ['wireless', 'premium'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Electronics',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Category description',
    example: 'Electronic devices and accessories',
  })
  @IsString()
  description: string;

  @ApiPropertyOptional({
    description: 'Parent category ID for nested categories',
    example: 'cat_root_001',
  })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({
    description: 'URL-friendly slug',
    example: 'electronics',
  })
  @IsString()
  slug: string;
} 
