import { BaseEntity } from './common.types';

export interface Product extends BaseEntity {
  name: string;
  description: string;
  price: number;
  currency: string;
  sku: string;
  categoryId: string;
  images: string[];
  specifications: Record<string, any>;
  inventory: ProductInventory;
  status: ProductStatus;
  tags: string[];
}

export interface ProductCategory extends BaseEntity {
  name: string;
  description: string;
  parentId?: string;
  slug: string;
}

export interface ProductInventory {
  quantity: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  isTracked: boolean;
}

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued',
  OUT_OF_STOCK = 'out_of_stock',
} 