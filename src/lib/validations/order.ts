import * as z from 'zod';

export const orderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive('Quantity must be greater than zero'),
});

export const orderSchema = z.object({
  customerName: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one item'),
});

export type OrderInput = z.infer<typeof orderSchema>;
