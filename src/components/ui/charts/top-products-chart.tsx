'use client';

import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell
} from 'recharts';
import { useTheme } from 'next-themes';

interface TopProductsChartProps {
  data: any[];
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const baseColor = isDark ? '#818cf8' : '#4f46e5';

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed p-8 bg-muted/10">
        <div className="flex flex-col items-center text-center">
          <p className="text-sm font-medium text-muted-foreground">No product data available.</p>
        </div>
      </div>
    );
  }

  // Reverse data so the highest is on top in a vertical bar chart
  const chartData = [...data].reverse();

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isDark ? '#3f3f46' : '#e4e4e7'} />
        <XAxis 
          type="number"
          stroke={isDark ? '#a1a1aa' : '#71717a'} 
          fontSize={12} 
          tickLine={false} 
          axisLine={false}
          tickFormatter={(value) => `₹${value}`}
        />
        <YAxis 
          type="category" 
          dataKey="name"
          stroke={isDark ? '#a1a1aa' : '#71717a'} 
          fontSize={12} 
          tickLine={false} 
          axisLine={false}
          width={100}
          tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
        />
        <Tooltip 
          cursor={{ fill: isDark ? '#27272a' : '#f4f4f5' }}
          contentStyle={{ 
            backgroundColor: isDark ? '#18181b' : '#ffffff',
            borderColor: isDark ? '#27272a' : '#e4e4e7',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
          }}
          labelStyle={{ fontWeight: 600, color: isDark ? '#e4e4e7' : '#27272a', marginBottom: '4px' }}
          formatter={(value: any, name: any, props: any) => {
            const strName = String(name);
            if (strName === 'revenue') return [`₹${Number(value || 0).toFixed(2)}`, 'Revenue'];
            return [value, strName];
          }}
        />
        <Bar 
          dataKey="revenue" 
          radius={[0, 4, 4, 0]}
          barSize={24}
          animationDuration={1500}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={baseColor} fillOpacity={0.7 + (index * 0.1)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
