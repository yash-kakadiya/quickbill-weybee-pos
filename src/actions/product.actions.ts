'use server';

import prisma from '@/lib/prisma';
import { productSchema, ProductInput, toggleProductStatusSchema } from '@/lib/validations/product';
import { revalidatePath } from 'next/cache';

export async function getProducts(search?: string) {
  try {
    const products = await prisma.product.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      } : undefined,
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
