import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateCategoryDto {
  name: string;
  description: string;
  parentId?: string;
  slug: string;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  parentId?: string;
  slug?: string;
}

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    // Check if slug already exists
    const existingCategory = await this.prisma.productCategory.findUnique({
      where: { slug: createCategoryDto.slug },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this slug already exists');
    }

    // If parentId provided, verify parent exists
    if (createCategoryDto.parentId) {
      const parent = await this.prisma.productCategory.findUnique({
        where: { id: createCategoryDto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }

    const category = await this.prisma.productCategory.create({
      data: createCategoryDto,
      include: {
        parent: true,
        children: true,
      },
    });

    this.logger.log(`Created category: ${category.id} (${category.slug})`);
    return category;
  }

  async findAll() {
    return this.prisma.productCategory.findMany({
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        products: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.productCategory.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id);

    if (updateCategoryDto.slug) {
      const existing = await this.prisma.productCategory.findFirst({
        where: {
          slug: updateCategoryDto.slug,
          NOT: { id },
        },
      });
      if (existing) {
        throw new ConflictException('Category with this slug already exists');
      }
    }

    const category = await this.prisma.productCategory.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        parent: true,
        children: true,
      },
    });

    this.logger.log(`Updated category: ${category.id}`);
    return category;
  }

  async delete(id: string) {
    const category = await this.findOne(id);

    // Check if category has products
    const productCount = await this.prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      throw new ConflictException('Cannot delete category with products. Move or delete products first.');
    }

    // Check if category has children
    const childCount = await this.prisma.productCategory.count({
      where: { parentId: id },
    });

    if (childCount > 0) {
      throw new ConflictException('Cannot delete category with subcategories. Delete subcategories first.');
    }

    await this.prisma.productCategory.delete({
      where: { id },
    });

    this.logger.log(`Deleted category: ${id}`);
  }

  async getTree() {
    const categories = await this.prisma.productCategory.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: true,
            _count: { select: { products: true } },
          },
        },
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });

    return categories;
  }
}
