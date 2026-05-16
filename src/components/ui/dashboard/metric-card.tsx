'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: LucideIcon;
  trendText?: string;
  trendValue?: number;
  trendUp?: boolean; // legacy fallback
}

export function MetricCard({ title, value, prefix = '', suffix = '', icon: Icon, trendText, trendValue, trendUp }: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  // Subtle animated counter effect
  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 800; // ms
    const startValue = 0;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutQuart
      const ease = 1 - Math.pow(1 - progress, 4);
      
      setDisplayValue(startValue + ease * (value - startValue));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    window.requestAnimationFrame(step);
  }, [value]);

  // Format based on whether it's currency or whole number
  const formattedValue = value % 1 !== 0 || prefix === '₹' 
    ? displayValue.toFixed(2) 
    : Math.round(displayValue).toString();

  const isPositive = trendValue !== undefined ? trendValue > 0 : trendUp;
  const isNeutral = trendValue === 0;

  return (
    <Card className="transition-all duration-300 hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5 group bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">
          {prefix}{formattedValue}{suffix}
        </div>
        {(trendText || trendValue !== undefined) && (
          <div className="flex items-center gap-2 mt-2">
            {trendValue !== undefined && (
              <span className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs font-semibold ${
                isNeutral ? 'bg-muted text-muted-foreground' : 
                isPositive ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
              }`}>
                {isPositive && !isNeutral && <ArrowUpRight className="mr-0.5 h-3 w-3" />}
                {!isPositive && !isNeutral && <ArrowDownRight className="mr-0.5 h-3 w-3" />}
                {isNeutral ? '0%' : `${Math.abs(trendValue).toFixed(1)}%`}
              </span>
            )}
            {trendText && (
              <span className="text-xs text-muted-foreground">{trendText}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
