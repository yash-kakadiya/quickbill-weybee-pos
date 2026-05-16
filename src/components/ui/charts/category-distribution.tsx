'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { useTheme } from 'next-themes';

interface CategoryDistributionProps {
  data: any[];
}

export function CategoryDistribution({ data }: CategoryDistributionProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const COLORS = isDark 
    ? ['#818cf8', '#34d399', '#fbbf24', '#fb7185', '#22d3ee']
    : ['#4f46e5', '#10b981', '#f59e0b', '#e11d48', '#06b6d4'];

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed p-8 bg-muted/10">
        <div className="flex flex-col items-center text-center">
          <p className="text-sm font-medium text-muted-foreground">No category data available.</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={90}
          paddingAngle={5}
          dataKey="value"
          nameKey="name"
          stroke="none"
          animationDuration={1500}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: isDark ? '#18181b' : '#ffffff',
            borderColor: isDark ? '#27272a' : '#e4e4e7',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
          }}
          labelStyle={{ display: 'none' }}
          itemStyle={{ fontWeight: 600, color: isDark ? '#e4e4e7' : '#27272a' }}
          formatter={(value: any, name: any) => [`₹${Number(value || 0).toFixed(2)}`, String(name)]}
        />
        <Legend 
          verticalAlign="bottom" 
          height={36} 
          iconType="circle"
          wrapperStyle={{ fontSize: '12px', color: isDark ? '#a1a1aa' : '#71717a' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
