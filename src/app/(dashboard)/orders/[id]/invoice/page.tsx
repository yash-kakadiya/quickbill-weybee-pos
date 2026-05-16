import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import Link from 'next/link';

import { PrintButton } from '@/components/pos/print-button';

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const order = await prisma.order.findUnique({
    where: { id: resolvedParams.id },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8 print:hidden">
        <Link href="/orders">
          <Button variant="outline">Back to Orders</Button>
        </Link>
        <PrintButton />
      </div>

      <div className="bg-white p-10 border rounded-lg shadow-sm print:shadow-none print:border-none print:p-0">
        <div className="flex justify-between items-start border-b pb-8 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">INVOICE</h1>
            <p className="text-sm text-slate-500 mt-1">{order.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <h2 className="font-bold text-xl text-slate-900">QuickBill POS</h2>
            <p className="text-sm text-slate-500">123 Retail Lane</p>
            <p className="text-sm text-slate-500">Business City, 10001</p>
          </div>
        </div>

        <div className="flex justify-between mb-8">
          <div>
            <p className="text-sm font-semibold text-slate-900">Billed To:</p>
            <p className="text-sm text-slate-600">{order.customerName || 'Walk-in Customer'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">Date of Issue:</p>
            <p className="text-sm text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</p>
            <p className="text-sm font-semibold text-slate-900 mt-2">Status:</p>
            <p className={`text-sm font-bold ${order.status === 'COMPLETED' ? 'text-green-600' : 'text-red-600'}`}>
              {order.status}
            </p>
          </div>
        </div>

        <table className="w-full text-left border-collapse mb-8">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="py-3 font-semibold text-slate-900">Description</th>
              <th className="py-3 font-semibold text-slate-900 text-center">Qty</th>
              <th className="py-3 font-semibold text-slate-900 text-right">Unit Price</th>
              <th className="py-3 font-semibold text-slate-900 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="py-4">
                  <p className="font-medium text-slate-900">{item.product.name}</p>
                  <p className="text-xs text-slate-500">{item.product.sku}</p>
                </td>
                <td className="py-4 text-center text-slate-600">{item.quantity}</td>
                <td className="py-4 text-right text-slate-600">₹{Number(item.priceAtSale).toFixed(2)}</td>
                <td className="py-4 text-right font-medium text-slate-900">₹{Number(item.subtotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-1/2">
            <div className="flex justify-between py-2 border-b border-slate-200">
              <span className="font-semibold text-slate-900">Subtotal</span>
              <span className="text-slate-900">₹{Number(order.totalAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-4 text-xl font-bold border-b-2 border-slate-900">
              <span className="text-slate-900">Total</span>
              <span className="text-slate-900">₹{Number(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center text-sm text-slate-500">
          <p>Thank you for your business!</p>
          <p>QuickBill POS - Fast & Reliable</p>
        </div>
      </div>
      
      {/* Print CSS specific for Next.js app router */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .max-w-3xl, .max-w-3xl * {
            visibility: visible;
          }
          .max-w-3xl {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}} />
    </div>
  );
}
