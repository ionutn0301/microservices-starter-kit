import { IsString, IsNumber, IsOptional, IsArray, IsEnum, IsObject, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from '../types/product.types';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  currency: string;

  @IsString()
  sku: string;

  @IsString()
  categoryId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsObject()
  specifications?: Record<string, any>;

  @IsObject()
  @Type(() => ProductInventoryDto)
  inventory: ProductInventoryDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsObject()
  specifications?: Record<string, any>;

  @IsOptional()
  @IsObject()
  @Type(() => ProductInventoryDto)
  inventory?: ProductInventoryDto;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class ProductInventoryDto {
  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reserved?: number = 0;

  @IsNumber()
  @Min(0)
  lowStockThreshold: number;

  @IsOptional()
  @IsBoolean()
  isTracked?: boolean = true;
}

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsString()
  slug: string;
} 