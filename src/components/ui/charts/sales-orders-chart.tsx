'use client';

import {
  ComposedChart,
  Area,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useTheme } from 'next-themes';

interface SalesOrdersChartProps {
  data: any[];
}

export function SalesOrdersChart({ data }: SalesOrdersChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const revenueColor = isDark ? '#818cf8' : '#4f46e5'; // Indigo
  const ordersColor = isDark ? '#34d399' : '#10b981'; // Emerald

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed p-8 bg-muted/10">
        <div className="flex flex-col items-center text-center">
          <p className="text-sm font-medium text-muted-foreground">No trend data available.</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={revenueColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={revenueColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#3f3f46' : '#e4e4e7'} />
        <XAxis 
          dataKey="Date" 
          tickFormatter={(value) => {
            const date = new Date(value);
            return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`;
          }}
          stroke={isDark ? '#a1a1aa' : '#71717a'} 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          dy={10}
        />
        <YAxis 
          yAxisId="left"
          stroke={isDark ? '#a1a1aa' : '#71717a'} 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          tickFormatter={(value) => `₹${value}`}
        />
        <YAxis 
          yAxisId="right"
          orientation="right"
          stroke={isDark ? '#a1a1aa' : '#71717a'} 
          fontSize={12} 
          tickLine={false} 
          axisLine={false}
          hide={true} // Hide the secondary axis to keep it clean, but keep scaling
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: isDark ? '#18181b' : '#ffffff',
            borderColor: isDark ? '#27272a' : '#e4e4e7',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
          }}
          labelStyle={{ fontWeight: 600, color: isDark ? '#e4e4e7' : '#27272a', marginBottom: '4px' }}
          labelFormatter={(label) => {
            const date = new Date(label);
            return date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
          }}
          formatter={(value: any, name: any) => {
            const strName = String(name);
            if (strName === 'Revenue') return [`₹${Number(value || 0).toFixed(2)}`, 'Revenue'];
            if (strName === 'Orders') return [value, 'Orders'];
            return [value, strName];
          }}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
        <Bar 
          yAxisId="right"
          dataKey="Orders" 
          barSize={20} 
          fill={ordersColor} 
          radius={[4, 4, 0, 0]}
          opacity={0.8}
          animationDuration={1500}
        />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="Revenue"
          stroke={revenueColor}
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorRevenue)"
          animationDuration={1500}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
