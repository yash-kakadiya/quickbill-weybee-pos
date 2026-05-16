'use server';

import prisma from '@/lib/prisma';
import { categorySchema, CategoryInput, toggleCategoryStatusSchema } from '@/lib/validations/category';
import { revalidatePath } from 'next/cache';

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

export async function getCategories(search?: string) {
  try {
    const categories = await prisma.category.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
        ],
      } : undefined,
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: categories };
  } catch (error) {
    console.error('getCategories error:', error);
    return { success: false, error: 'Failed to fetch categories' };
  }
}

export async function getActiveCategories() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: categories };
  } catch (error) {
    return { success: false, error: 'Failed to fetch active categories' };
  }
}

export async function createCategory(data: CategoryInput) {
  try {
    const parsed = categorySchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: 'Invalid category data' };
    }

    let baseSlug = generateSlug(parsed.data.name);
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.category.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const existingName = await prisma.category.findUnique({
      where: { name: parsed.data.name }
    });

    if (existingName) {
      return { success: false, error: 'Category with this name already exists' };
    }

    await prisma.category.create({
      data: {
        ...parsed.data,
        slug
      },
    });

    revalidatePath('/categories');
    revalidatePath('/products');
    return { success: true };
  } catch (error) {
    console.error('createCategory error:', error);
    return { success: false, error: 'Failed to create category' };
  }
}

export async function updateCategory(id: string, data: CategoryInput) {
  try {
    const parsed = categorySchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: 'Invalid category data' };
    }

    const existingName = await prisma.category.findFirst({
      where: { 
        name: parsed.data.name,
        NOT: { id }
      },
    });

    if (existingName) {
      return { success: false, error: 'Another category with this name already exists' };
    }

    let baseSlug = generateSlug(parsed.data.name);
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.category.findFirst({ where: { slug, NOT: { id } } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    await prisma.category.update({
      where: { id },
      data: {
        ...parsed.data,
        slug
      },
    });

    revalidatePath('/categories');
    revalidatePath('/products');
    return { success: true };
  } catch (error) {
    console.error('updateCategory error:', error);
    return { success: false, error: 'Failed to update category' };
  }
}

export async function toggleCategoryStatus(id: string, isActive: boolean) {
  try {
    const parsed = toggleCategoryStatusSchema.safeParse({ id, isActive });
    if (!parsed.success) return { success: false, error: 'Invalid input' };

    // Prevent deactivation if linked to active products
    if (!isActive) {
      const linkedProducts = await prisma.product.count({
        where: { categoryId: id, isActive: true }
      });
      
      if (linkedProducts > 0) {
        return { success: false, error: `Cannot deactivate: Category is linked to ${linkedProducts} active product(s)` };
      }
    }

    await prisma.category.update({
      where: { id },
      data: { isActive },
    });

    revalidatePath('/categories');
    revalidatePath('/products');
    return { success: true };
  } catch (error) {
    console.error('toggleCategoryStatus error:', error);
    return { success: false, error: 'Failed to update category status' };
  }
}
