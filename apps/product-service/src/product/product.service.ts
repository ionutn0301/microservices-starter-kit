import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventService } from '../events/event.service';
import { Product, ProductInventory, ProductStatus as PrismaProductStatus } from '@prisma/client';
import { CreateProductDto, UpdateProductDto, ProductStatus } from '@microservices/shared';
import { Decimal } from '@prisma/client/runtime/library';

export interface ProductWithInventory extends Product {
  inventory: ProductInventory | null;
}

export interface PaginatedProducts {
  data: ProductWithInventory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductFilters {
  categoryId?: string;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  tags?: string[];
}

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    private prisma: PrismaService,
    private eventService: EventService,
  ) {}

  async createProduct(createProductDto: CreateProductDto): Promise<ProductWithInventory> {
    // Check if SKU already exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { sku: createProductDto.sku },
    });

    if (existingProduct) {
      throw new ConflictException('Product with this SKU already exists');
    }

    // Verify category exists
    const category = await this.prisma.productCategory.findUnique({
      where: { id: createProductDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const product = await this.prisma.product.create({
      data: {
        name: createProductDto.name,
        description: createProductDto.description,
        price: new Decimal(createProductDto.price),
        currency: createProductDto.currency,
        sku: createProductDto.sku,
        categoryId: createProductDto.categoryId,
        images: createProductDto.images || [],
        specifications: createProductDto.specifications || {},
        tags: createProductDto.tags || [],
        status: PrismaProductStatus.ACTIVE,
        inventory: {
          create: {
            quantity: createProductDto.inventory.quantity,
            reserved: createProductDto.inventory.reserved || 0,
            available: createProductDto.inventory.quantity - (createProductDto.inventory.reserved || 0),
            lowStockThreshold: createProductDto.inventory.lowStockThreshold,
            isTracked: createProductDto.inventory.isTracked ?? true,
          },
        },
      },
      include: {
        inventory: true,
        category: true,
      },
    });

    // Publish event
    await this.eventService.publishProductCreated({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price.toNumber(),
      categoryId: product.categoryId,
      timestamp: new Date(),
    });

    this.logger.log(`Created product: ${product.id} (${product.sku})`);
    return product;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: ProductFilters,
  ): Promise<PaginatedProducts> {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.status) {
      where.status = this.mapStatusToPrisma(filters.status);
    }

    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price.gte = new Decimal(filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = new Decimal(filters.maxPrice);
      }
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          inventory: true,
          category: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<ProductWithInventory> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        inventory: true,
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findBySku(sku: string): Promise<ProductWithInventory> {
    const product = await this.prisma.product.findUnique({
      where: { sku },
      include: {
        inventory: true,
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductWithInventory> {
    const existingProduct = await this.findOne(id);

    const updateData: any = {};

    if (updateProductDto.name) updateData.name = updateProductDto.name;
    if (updateProductDto.description) updateData.description = updateProductDto.description;
    if (updateProductDto.price !== undefined) updateData.price = new Decimal(updateProductDto.price);
    if (updateProductDto.currency) updateData.currency = updateProductDto.currency;
    if (updateProductDto.categoryId) updateData.categoryId = updateProductDto.categoryId;
    if (updateProductDto.images) updateData.images = updateProductDto.images;
    if (updateProductDto.specifications) updateData.specifications = updateProductDto.specifications;
    if (updateProductDto.tags) updateData.tags = updateProductDto.tags;
    if (updateProductDto.status) updateData.status = this.mapStatusToPrisma(updateProductDto.status);

    const product = await this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        inventory: true,
        category: true,
      },
    });

    // Publish event
    await this.eventService.publishProductUpdated({
      productId: product.id,
      changes: updateProductDto,
      timestamp: new Date(),
    });

    this.logger.log(`Updated product: ${product.id}`);
    return product;
  }

  async delete(id: string): Promise<void> {
    const product = await this.findOne(id);

    await this.prisma.product.delete({
      where: { id },
    });

    // Publish event
    await this.eventService.publishProductDeleted({
      productId: product.id,
      sku: product.sku,
      timestamp: new Date(),
    });

    this.logger.log(`Deleted product: ${id}`);
  }

  private mapStatusToPrisma(status: ProductStatus): PrismaProductStatus {
    const mapping: Record<ProductStatus, PrismaProductStatus> = {
      [ProductStatus.ACTIVE]: PrismaProductStatus.ACTIVE,
      [ProductStatus.INACTIVE]: PrismaProductStatus.INACTIVE,
      [ProductStatus.DISCONTINUED]: PrismaProductStatus.DISCONTINUED,
      [ProductStatus.OUT_OF_STOCK]: PrismaProductStatus.OUT_OF_STOCK,
    };
    return mapping[status];
  }
}
