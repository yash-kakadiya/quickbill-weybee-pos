'use client';

import { useState, useEffect } from 'react';
import { getOrders, cancelOrder } from '@/actions/order.actions';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setIsLoading(true);
    const result = await getOrders();
    if (result.success && result.data) {
      setOrders(result.data);
    } else {
      toast.error('Failed to load orders');
    }
    setIsLoading(false);
  }

  async function handleCancel(orderId: string) {
    if (!confirm('Are you sure you want to cancel this order? This will restore inventory and cannot be undone.')) {
      return;
    }
    
    const result = await cancelOrder(orderId);
    if (result.success) {
      toast.success('Order cancelled successfully. Inventory restored.');
      fetchOrders();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Order History</h1>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading orders...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} className={order.status === 'CANCELLED' ? 'bg-muted/50' : ''}>
                  <TableCell className="font-medium">{order.invoiceNumber}</TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{order.customerName || '-'}</TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate text-sm text-muted-foreground" title={order.items.map((i:any) => `${i.quantity}x ${i.product.name}`).join(', ')}>
                      {order.items.reduce((sum: number, item: any) => sum + item.quantity, 0)} items
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">₹{order.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    {order.status === 'COMPLETED' ? (
                      <Badge className="bg-green-600">Completed</Badge>
                    ) : (
                      <Badge variant="destructive">Cancelled</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/orders/${order.id}/invoice`}>
                        <Button variant="outline" size="sm">
                          Invoice
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleCancel(order.id)}
                        disabled={order.status === 'CANCELLED'}
                        className={order.status === 'COMPLETED' ? 'text-destructive hover:text-destructive' : ''}
                      >
                        {order.status === 'CANCELLED' ? 'Cancelled' : 'Cancel'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
