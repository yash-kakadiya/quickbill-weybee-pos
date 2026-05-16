'use server';

import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export async function getDashboardStats(days: number = 7) {
  try {
    const today = new Date();
    const startOfTodayDate = startOfDay(today);
    const endOfTodayDate = endOfDay(today);

    const currentPeriodStart = startOfDay(subDays(today, days - 1));
    const previousPeriodStart = startOfDay(subDays(today, (days * 2) - 1));
    const previousPeriodEnd = startOfDay(subDays(today, days));

    const [
      totalOrders,
      todayOrders,
      currentPeriodOrders,
      previousPeriodOrders,
      totalRevenueRaw,
      todayRevenueRaw,
      currentPeriodRevenueRaw,
      previousPeriodRevenueRaw,
      activeProducts,
      inventoryHealthRaw,
      lowStockProducts,
      recentOrders,
      topSellingRaw,
      trendOrdersRaw,
      categoryDistributionRaw
    ] = await Promise.all([
      // 0. Total Orders
      prisma.order.count({ where: { status: 'COMPLETED' } }),
      // 1. Today Orders
      prisma.order.count({ where: { status: 'COMPLETED', createdAt: { gte: startOfTodayDate, lte: endOfTodayDate } } }),
      // 2. Current Period Orders
      prisma.order.count({ where: { status: 'COMPLETED', createdAt: { gte: currentPeriodStart } } }),
      // 3. Previous Period Orders
      prisma.order.count({ where: { status: 'COMPLETED', createdAt: { gte: previousPeriodStart, lte: previousPeriodEnd } } }),
      
      // 4. Total Revenue
      prisma.order.aggregate({ where: { status: 'COMPLETED' }, _sum: { totalAmount: true } }),
      // 5. Today Revenue
      prisma.order.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: startOfTodayDate, lte: endOfTodayDate } }, _sum: { totalAmount: true } }),
      // 6. Current Period Revenue
      prisma.order.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: currentPeriodStart } }, _sum: { totalAmount: true } }),
      // 7. Previous Period Revenue
      prisma.order.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: previousPeriodStart, lte: previousPeriodEnd } }, _sum: { totalAmount: true } }),
      
      // 8. Active Products
      prisma.product.count({ where: { isActive: true } }),
      // 9. Inventory Health
      prisma.$queryRaw`
        SELECT 
          CAST(COUNT(CASE WHEN stock > "lowStockThreshold" THEN 1 END) AS INTEGER) as "healthy",
          CAST(COUNT(CASE WHEN stock <= "lowStockThreshold" AND stock > 0 THEN 1 END) AS INTEGER) as "low",
          CAST(COUNT(CASE WHEN stock = 0 THEN 1 END) AS INTEGER) as "outOfStock"
        FROM "Product"
        WHERE "isActive" = true
      `,
      // 10. Low Stock Products list
      prisma.$queryRaw`SELECT id, name, stock, "lowStockThreshold" FROM "Product" WHERE "isActive" = true AND stock <= "lowStockThreshold" LIMIT 5`,
      
      // 11. Recent Orders
      prisma.order.findMany({
        where: { status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { items: true }
      }),
      
      // 12. Top Selling Products (Revenue and Quantity) - Top 5
      prisma.$queryRaw`
        SELECT p.name, CAST(SUM(oi.quantity) AS INTEGER) as quantity, CAST(SUM(oi.subtotal) AS FLOAT) as revenue
        FROM "OrderItem" oi
        JOIN "Order" o ON oi."orderId" = o.id
        JOIN "Product" p ON oi."productId" = p.id
        WHERE o.status = 'COMPLETED'
        GROUP BY p.id, p.name
        ORDER BY revenue DESC
        LIMIT 5
      `,
      
      // 13. Trend data for Sales vs Orders
      prisma.order.findMany({
        where: { status: 'COMPLETED', createdAt: { gte: currentPeriodStart } },
        select: { createdAt: true, totalAmount: true }
      }),
      
      // 14. Category Distribution by Sales Revenue
      prisma.$queryRaw`
        SELECT c.name, CAST(SUM(oi.subtotal) AS FLOAT) as revenue
        FROM "OrderItem" oi
        JOIN "Order" o ON oi."orderId" = o.id
        JOIN "Product" p ON oi."productId" = p.id
        JOIN "Category" c ON p."categoryId" = c.id
        WHERE o.status = 'COMPLETED' AND p."isActive" = true
        GROUP BY c.id, c.name
        ORDER BY revenue DESC
        LIMIT 5
      `
    ]);

    // Process Trend Data (Sales vs Orders)
    const trendMap = new Map();
    for (let i = days - 1; i >= 0; i--) {
      const d = startOfDay(subDays(today, i)).toISOString();
      trendMap.set(d, { Date: d, Revenue: 0, Orders: 0 });
    }
    
    for (const order of trendOrdersRaw) {
      const dayStr = startOfDay(order.createdAt).toISOString();
      if (trendMap.has(dayStr)) {
        const current = trendMap.get(dayStr);
        current.Revenue += Number(order.totalAmount);
        current.Orders += 1;
      }
    }
    
    const trendData = Array.from(trendMap.values());

    // Calculate Trends (%)
    const currRev = Number(currentPeriodRevenueRaw._sum.totalAmount || 0);
    const prevRev = Number(previousPeriodRevenueRaw._sum.totalAmount || 0);
    const revenueTrend = prevRev === 0 ? 100 : ((currRev - prevRev) / prevRev) * 100;

    const currOrd = currentPeriodOrders;
    const prevOrd = previousPeriodOrders;
    const ordersTrend = prevOrd === 0 ? 100 : ((currOrd - prevOrd) / prevOrd) * 100;

    // Process Category Distribution
    const categoryDistribution = (categoryDistributionRaw as any[]).map(c => ({
      name: c.name,
      value: Number(c.revenue || 0)
    }));

    // Process Top Products
    const topProducts = (topSellingRaw as any[]).map(p => ({
      name: p.name,
      quantity: Number(p.quantity || 0),
      revenue: Number(p.revenue || 0)
    }));

    const inventoryHealth = Array.isArray(inventoryHealthRaw) && inventoryHealthRaw.length > 0 
      ? inventoryHealthRaw[0] 
      : { healthy: 0, low: 0, outOfStock: 0 };

    return {
      success: true,
      data: {
        totalOrders,
        todayOrders,
        ordersTrend,
        totalRevenue: Number(totalRevenueRaw._sum.totalAmount || 0),
        todayRevenue: Number(todayRevenueRaw._sum.totalAmount || 0),
        revenueTrend,
        activeProducts,
        inventoryHealth: {
          healthy: Number(inventoryHealth.healthy),
          low: Number(inventoryHealth.low),
          outOfStock: Number(inventoryHealth.outOfStock)
        },
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
        topProducts,
        trendData,
        categoryDistribution
      }
    };
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return { success: false, error: 'Failed to fetch dashboard stats' };
  }
}

