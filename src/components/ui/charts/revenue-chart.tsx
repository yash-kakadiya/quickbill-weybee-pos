'use client';

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useTheme } from 'next-themes';

interface RevenueChartProps {
  data: any[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const strokeColor = isDark ? '#818cf8' : '#4f46e5'; // Indigo 400 vs 600
  const fillColor = isDark ? '#818cf8' : '#4f46e5';

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={fillColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={fillColor} stopOpacity={0} />
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
          stroke={isDark ? '#a1a1aa' : '#71717a'} 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          tickFormatter={(value) => `₹${value}`}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: isDark ? '#18181b' : '#ffffff',
            borderColor: isDark ? '#27272a' : '#e4e4e7',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
          }}
          itemStyle={{ color: strokeColor, fontWeight: 500 }}
          labelFormatter={(label) => {
            const date = new Date(label);
            return date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
          }}
          formatter={(value: any) => [`₹${Number(value || 0).toFixed(2)}`, 'Revenue']}
        />
        <Area
          type="monotone"
          dataKey="Amount"
          stroke={strokeColor}
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorRevenue)"
          animationDuration={1500}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
