'use server';

import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export async function getReportData(type: string, daysStr: string = '7') {
  try {
    const days = parseInt(daysStr, 10);
    const startDate = startOfDay(subDays(new Date(), days - 1));
    const endDate = endOfDay(new Date());

    if (type === 'daily_sales') {
      const orders = await prisma.order.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startDate, lte: endDate }
        },
        orderBy: { createdAt: 'desc' }
      });
      return { 
        success: true, 
        data: orders.map(o => ({
          Invoice: o.invoiceNumber,
          Customer: o.customerName || 'Walk-in',
          Amount: Number(o.totalAmount),
          Date: o.createdAt.toISOString()
        }))
      };
    }

    if (type === 'inventory') {
      const products = await prisma.product.findMany({
        include: { category: true },
        orderBy: { stock: 'asc' }
      });
      return {
        success: true,
        data: products.map(p => ({
          SKU: p.sku,
          Name: p.name,
          Category: p.category?.name || 'Uncategorized',
          Price: Number(p.price),
          Stock: p.stock,
          Status: p.isActive ? 'Active' : 'Inactive'
        }))
      };
    }

    if (type === 'low_stock') {
      const products = await prisma.$queryRaw`SELECT p.sku, p.name, c.name as category, p.price, p.stock, p."lowStockThreshold" FROM "Product" p LEFT JOIN "Category" c ON p."categoryId" = c.id WHERE p."isActive" = true AND p.stock <= p."lowStockThreshold" ORDER BY p.stock ASC`;
      return {
        success: true,
        data: (products as any[]).map(p => ({
          SKU: p.sku,
          Name: p.name,
          Category: p.category || 'Uncategorized',
          Price: Number(p.price),
          Stock: p.stock,
          Threshold: p.lowStockThreshold
        }))
      };
    }

    return { success: false, error: 'Invalid report type' };
  } catch (error) {
    console.error('getReportData error:', error);
    return { success: false, error: 'Failed to fetch report data' };
  }
}
