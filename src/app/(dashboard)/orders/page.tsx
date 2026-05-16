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
import { Loader2, History, FileText, Ban } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-states/empty-state';

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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order History</h1>
          <p className="text-muted-foreground mt-1 text-sm">View past transactions and manage cancellations.</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="whitespace-nowrap">Invoice #</TableHead>
                <TableHead className="whitespace-nowrap">Date</TableHead>
                <TableHead className="whitespace-nowrap">Customer</TableHead>
                <TableHead className="whitespace-nowrap">Items</TableHead>
                <TableHead className="text-right whitespace-nowrap">Total Amount</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center p-0">
                    <EmptyState 
                      icon={History}
                      title="No orders found"
                      description="You haven't processed any transactions yet."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} className={`hover:bg-muted/40 transition-colors ${order.status === 'CANCELLED' ? 'opacity-60 bg-muted/20' : ''}`}>
                    <TableCell className="font-medium">{order.invoiceNumber}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</TableCell>
                    <TableCell className="font-medium">{order.customerName || '-'}</TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-md inline-block border" title={order.items.map((i:any) => `${i.quantity}x ${i.product.name}`).join(', ')}>
                        {order.items.reduce((sum: number, item: any) => sum + item.quantity, 0)} items
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">₹{order.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      {order.status === 'COMPLETED' ? (
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 font-medium">Completed</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800 font-medium">Cancelled</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/orders/${order.id}/invoice`}>
                          <Button variant="outline" size="sm" className="shadow-sm hover:bg-primary/10 hover:text-primary transition-colors">
                            <FileText className="h-4 w-4 mr-1.5" />
                            Invoice
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleCancel(order.id)}
                          disabled={order.status === 'CANCELLED'}
                          className={`shadow-sm transition-colors ${order.status === 'COMPLETED' ? 'hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30 hover:border-rose-200 dark:hover:border-rose-800 text-destructive border-destructive/30' : ''}`}
                        >
                          <Ban className="h-4 w-4 mr-1.5" />
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
    </div>
  );
}
