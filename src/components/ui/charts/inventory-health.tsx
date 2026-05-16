'use client';

import { PackageCheck, AlertTriangle, PackageX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface InventoryHealthProps {
  data: {
    healthy: number;
    low: number;
    outOfStock: number;
  };
}

export function InventoryHealth({ data }: InventoryHealthProps) {
  const total = data.healthy + data.low + data.outOfStock;
  
  if (total === 0) {
    return (
      <div className="flex h-[120px] items-center justify-center rounded-md border border-dashed bg-muted/10">
        <p className="text-sm text-muted-foreground">No inventory data.</p>
      </div>
    );
  }

  const healthyPct = (data.healthy / total) * 100;
  const lowPct = (data.low / total) * 100;
  const outOfStockPct = (data.outOfStock / total) * 100;

  return (
    <div className="space-y-5">
      {/* Segmented Progress Bar */}
      <div className="h-4 w-full flex rounded-full overflow-hidden shadow-sm">
        <div style={{ width: `${healthyPct}%` }} className="bg-emerald-500 transition-all duration-1000" title={`Healthy: ${data.healthy}`} />
        <div style={{ width: `${lowPct}%` }} className="bg-amber-400 transition-all duration-1000" title={`Low Stock: ${data.low}`} />
        <div style={{ width: `${outOfStockPct}%` }} className="bg-rose-500 transition-all duration-1000" title={`Out of Stock: ${data.outOfStock}`} />
      </div>

      {/* Legend Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-emerald-500/10 border-emerald-500/20 shadow-none">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-800 dark:text-emerald-400">Healthy</p>
              <p className="text-xl font-bold text-emerald-900 dark:text-emerald-300">{data.healthy}</p>
            </div>
            <PackageCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="bg-amber-500/10 border-amber-500/20 shadow-none">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-800 dark:text-amber-400">Low Stock</p>
              <p className="text-xl font-bold text-amber-900 dark:text-amber-300">{data.low}</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="bg-rose-500/10 border-rose-500/20 shadow-none">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-rose-800 dark:text-rose-400">Out of Stock</p>
              <p className="text-xl font-bold text-rose-900 dark:text-rose-300">{data.outOfStock}</p>
            </div>
            <PackageX className="h-5 w-5 text-rose-600 dark:text-rose-500 opacity-80" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
