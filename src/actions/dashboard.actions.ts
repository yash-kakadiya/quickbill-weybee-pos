'use server';

import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export async function getDashboardStats() {
  try {
    const today = new Date();
    const startOfTodayDate = startOfDay(today);
    const endOfTodayDate = endOfDay(today);

    const [
      totalOrders,
      todayOrders,
      totalRevenueRaw,
      todayRevenueRaw,
      activeProducts,
      lowStockProducts,
      recentOrders,
      topSellingItems
    ] = await Promise.all([
      prisma.order.count({ where: { status: 'COMPLETED' } }),
      prisma.order.count({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startOfTodayDate, lte: endOfTodayDate }
        }
      }),
      prisma.order.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { totalAmount: true }
      }),
      prisma.order.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startOfTodayDate, lte: endOfTodayDate }
        },
        _sum: { totalAmount: true }
      }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.$queryRaw`SELECT id, name, stock, "lowStockThreshold" FROM "Product" WHERE "isActive" = true AND stock <= "lowStockThreshold" LIMIT 5`,
      prisma.order.findMany({
        where: { status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { items: true }
      }),
      // Simple aggregation for top selling in last 30 days
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
      })
    ]);

    // Fetch product details for top selling
    const topProductsWithNames = await Promise.all(
      topSellingItems.map(async (item) => {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        return {
          name: product?.name || 'Unknown Product',
          quantity: item._sum.quantity || 0
        };
      })
    );

    return {
      success: true,
      data: {
        totalOrders,
        todayOrders,
        totalRevenue: Number(totalRevenueRaw._sum.totalAmount || 0),
        todayRevenue: Number(todayRevenueRaw._sum.totalAmount || 0),
        activeProducts,
        lowStockProducts: lowStockProducts as any[],
        recentOrders: recentOrders.map(o => ({
          id: o.id,
          invoiceNumber: o.invoiceNumber,
          customerName: o.customerName,
          status: o.status,
          createdAt: o.createdAt.toISOString(),
          totalAmount: Number(o.totalAmount),
          itemsCount: o.items.reduce((sum, item) => sum + item.quantity, 0)
        })),
        topProducts: topProductsWithNames
      }
    };
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return { success: false, error: 'Failed to fetch dashboard stats' };
  }
}
