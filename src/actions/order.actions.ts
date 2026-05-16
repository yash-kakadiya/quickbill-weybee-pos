'use server';

import prisma from '@/lib/prisma';
import { orderSchema, OrderInput } from '@/lib/validations/order';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

// Generate a random invoice number like INV-2026-XXXXX
function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `INV-${year}-${randomStr}`;
}

export async function createOrder(data: OrderInput) {
  try {
    const parsed = orderSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: 'Invalid order data' };
    }

    const { customerName, items } = parsed.data;

    // Use Prisma Interactive Transaction
    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = new Prisma.Decimal(0);
      const orderItemsData = [];
      const stockLogsData = [];

      for (const item of items) {
        // 1. Concurrency-safe atomic decrement with WHERE clause
        // This acts as a pessimistic lock: it will fail if stock is insufficient or product is inactive.
        let product;
        try {
          product = await tx.product.update({
            where: { 
              id: item.productId,
              stock: { gte: item.quantity },
              isActive: true
            },
            data: { 
              stock: { decrement: item.quantity } 
            }
          });
        } catch (error) {
          // Prisma throws P2025 if the record is not found (meaning where clause failed)
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             // We need to fetch the product just to get its name for the error message
             const badProduct = await tx.product.findUnique({ where: { id: item.productId }});
             if (!badProduct) throw new Error('A product in the cart no longer exists.');
             if (!badProduct.isActive) throw new Error(`${badProduct.name} is currently inactive.`);
             throw new Error(`Insufficient stock for ${badProduct.name}. Only ${badProduct.stock} left.`);
          }
          throw error;
        }

        // 2. Calculate subtotal
        const subtotal = product.price.mul(item.quantity);
        totalAmount = totalAmount.add(subtotal);

        // 3. Prepare OrderItem data
        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          priceAtSale: product.price,
          subtotal: subtotal,
        });

        // 4. Prepare StockLog data
        stockLogsData.push({
          productId: product.id,
          changeType: 'SALE',
          quantityChange: -item.quantity,
          reason: 'Order placement',
        });
      }

      // 5. Create the Order
      const newOrder = await tx.order.create({
        data: {
          invoiceNumber: generateInvoiceNumber(),
          customerName: customerName || null,
          totalAmount: totalAmount,
          items: {
            create: orderItemsData,
          }
        }
      });

      // 6. Create Stock Logs
      // We do this via createMany for efficiency
      await tx.stockLog.createMany({
        data: stockLogsData
      });

      return newOrder;
    });

    revalidatePath('/products');
    revalidatePath('/pos');
    revalidatePath('/orders');
    revalidatePath('/');
    
    return { success: true, orderId: result.id, invoiceNumber: result.invoiceNumber };

  } catch (error: any) {
    console.error('createOrder transaction error:', error);
    // Return the safe error message we intentionally threw inside the transaction
    return { success: false, error: error.message || 'Transaction failed due to an unexpected error' };
  }
}

export async function getOrders(dateStr?: string) {
  try {
    const whereClause: any = {};
    if (dateStr) {
      // dateStr should be in YYYY-MM-DD format
      const startDate = new Date(dateStr);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(dateStr);
      endDate.setHours(23, 59, 59, 999);
      whereClause.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Serialize decimal to numbers
    const serialized = orders.map(o => ({
      ...o,
      totalAmount: Number(o.totalAmount),
      items: o.items.map(i => ({
        ...i,
        priceAtSale: Number(i.priceAtSale),
        subtotal: Number(i.subtotal)
      }))
    }));

    return { success: true, data: serialized };
  } catch (error) {
    console.error('getOrders error:', error);
    return { success: false, error: 'Failed to fetch orders' };
  }
}

export async function cancelOrder(orderId: string) {
  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });

      if (!order) throw new Error('Order not found');
      if (order.status === 'CANCELLED') throw new Error('Order is already cancelled');

      // 1. Update order status
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' }
      });

      // 2. Restore stock for each item safely
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        });

        // 3. Log the restoration
        await tx.stockLog.create({
          data: {
            productId: item.productId,
            changeType: 'CANCELLATION',
            quantityChange: item.quantity,
            reason: `Order ${order.invoiceNumber} cancelled`,
          }
        });
      }
    });

    revalidatePath('/orders');
    revalidatePath('/products');
    revalidatePath('/pos');
    revalidatePath('/');

    return { success: true };
  } catch (error: any) {
    console.error('cancelOrder error:', error);
    return { success: false, error: error.message || 'Failed to cancel order' };
  }
}
