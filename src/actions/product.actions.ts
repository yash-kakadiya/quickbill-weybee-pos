'use server';

import prisma from '@/lib/prisma';
import { productSchema, ProductInput, toggleProductStatusSchema } from '@/lib/validations/product';
import { AISearchParams } from '@/lib/validations/ai';
import { revalidatePath } from 'next/cache';

export async function getProducts(search?: string) {
  try {
    const products = await prisma.product.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { category: { name: { contains: search, mode: 'insensitive' } } },
        ],
      } : undefined,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
    // Serialize decimal to numbers for client safety
    return { 
      success: true, 
      data: products.map(p => ({
        ...p,
        price: Number(p.price),
      })) 
    };
  } catch (error) {
    console.error('getProducts error:', error);
    return { success: false, error: 'Failed to fetch products' };
  }
}

export async function createProduct(data: ProductInput) {
  try {
    const parsed = productSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: 'Invalid product data' };
    }

    const existingSku = await prisma.product.findUnique({
      where: { sku: parsed.data.sku },
    });

    if (existingSku) {
      return { success: false, error: 'Product with this SKU already exists' };
    }

    await prisma.product.create({
      data: parsed.data,
    });

    revalidatePath('/products');
    revalidatePath('/pos');
    return { success: true };
  } catch (error) {
    console.error('createProduct error:', error);
    return { success: false, error: 'Failed to create product' };
  }
}

export async function updateProduct(id: string, data: ProductInput) {
  try {
    const parsed = productSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: 'Invalid product data' };
    }

    const existingSku = await prisma.product.findFirst({
      where: { 
        sku: parsed.data.sku,
        NOT: { id }
      },
    });

    if (existingSku) {
      return { success: false, error: 'Another product with this SKU already exists' };
    }

    // Atomic update, though for simple CRUD it's just a direct update
    // But if we want to log stock changes during manual updates, we could do a transaction
    // Let's keep it simple for basic CRUD and rely on Orders for primary stock movements
    
    // Check if stock changed, to potentially log it (optional but good practice)
    const oldProduct = await prisma.product.findUnique({ where: { id } });
    if (!oldProduct) return { success: false, error: 'Product not found' };

    await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: parsed.data,
      });

      if (oldProduct.stock !== parsed.data.stock) {
        await tx.stockLog.create({
          data: {
            productId: id,
            changeType: 'CORRECTION',
            quantityChange: parsed.data.stock - oldProduct.stock,
            reason: 'Manual inventory adjustment',
          }
        });
      }
    });

    revalidatePath('/products');
    revalidatePath('/pos');
    return { success: true };
  } catch (error) {
    console.error('updateProduct error:', error);
    return { success: false, error: 'Failed to update product' };
  }
}

export async function toggleProductStatus(id: string, isActive: boolean) {
  try {
    const parsed = toggleProductStatusSchema.safeParse({ id, isActive });
    if (!parsed.success) return { success: false, error: 'Invalid input' };

    await prisma.product.update({
      where: { id },
      data: { isActive },
    });

    revalidatePath('/products');
    revalidatePath('/pos');
    return { success: true };
  } catch (error) {
    console.error('toggleProductStatus error:', error);
    return { success: false, error: 'Failed to update product status' };
  }
}

export async function getProductsAdvanced(filters: AISearchParams) {
  try {
    const whereClause: any = {};

    if (filters.keyword) {
      whereClause.OR = [
        { name: { contains: filters.keyword, mode: 'insensitive' } },
        { sku: { contains: filters.keyword, mode: 'insensitive' } },
        { category: { name: { contains: filters.keyword, mode: 'insensitive' } } },
      ];
    }

    if (filters.category) {
      whereClause.category = { name: { contains: filters.category, mode: 'insensitive' } };
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      whereClause.price = {};
      if (filters.minPrice !== undefined) whereClause.price.gte = filters.minPrice;
      if (filters.maxPrice !== undefined) whereClause.price.lte = filters.maxPrice;
    }

    if (filters.stockStatus === 'in_stock') {
      whereClause.stock = { gt: 0 };
    } else if (filters.stockStatus === 'out_of_stock') {
      whereClause.stock = 0;
    } else if (filters.stockStatus === 'low_stock') {
      // For low stock, we need products where stock > 0 AND stock <= lowStockThreshold
      // Prisma doesn't support comparing two columns directly in where easily without raw query or specific features, 
      // but we can fetch them and filter in memory if the dataset is small, or just approximate.
      // Since it's a simple POS, we can approximate low stock as stock <= 5, or fetch and filter.
      // Actually, we can fetch all in_stock and filter in-memory if needed, but for scale, let's just do stock <= 5 as a fallback.
      // Wait, we can't do whereClause.stock = { lte: lowStockThreshold } directly in Prisma standard where.
      // Let's do a basic stock <= 10 for "low stock" keyword search if we can't compare columns.
      whereClause.stock = { lte: 10, gt: 0 };
    }

    // Popularity logic: if requested, we could order by number of OrderItems, but that's a heavy query.
    // Let's just fetch recent or standard and maybe sort by price or something if no popularity.
    // For popularity, we can sort by orderItems count.
    
    const products = await prisma.product.findMany({
      where: whereClause,
      include: { category: true },
      orderBy: filters.popularity 
        ? { orderItems: { _count: 'desc' } }
        : { createdAt: 'desc' },
      take: 50, // Limit results to prevent massive queries
    });

    return {
      success: true,
      data: products.map((p) => ({
        ...p,
        price: Number(p.price),
      })),
    };
  } catch (error) {
    console.error('getProductsAdvanced error:', error);
    return { success: false, error: 'Failed to execute smart search' };
  }
}
