'use client';

import { useState, useEffect } from 'react';
import { getDashboardStats } from '@/actions/dashboard.actions';
import { generateDailySummary, generateRestockInsights } from '@/actions/ai.actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Package, ShoppingCart, IndianRupee, Sparkles, Loader2, BrainCircuit, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { MetricCard } from '@/components/ui/dashboard/metric-card';
import { RevenueChart } from '@/components/ui/charts/revenue-chart';
import { CategoryDistribution } from '@/components/ui/charts/category-distribution';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const [isGeneratingRestock, setIsGeneratingRestock] = useState(false);
  const [restockInsights, setRestockInsights] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      const res = await getDashboardStats();
      if (res.success) {
        setStats(res.data);
      } else {
        toast.error('Failed to load dashboard data');
      }
      setIsLoading(false);
    }
    loadStats();
  }, []);

  async function handleGenerateSummary() {
    setIsGeneratingAI(true);
    const res = await generateDailySummary();
    if (res.success) {
      setAiSummary(res.summary!);
      toast.success('AI Summary generated!');
    } else {
      toast.error(res.error);
    }
    setIsGeneratingAI(false);
  }

  async function handleGenerateRestock() {
    setIsGeneratingRestock(true);
    const res = await generateRestockInsights();
    if (res.success) {
      setRestockInsights(res.insights!);
      toast.success('Restock Insights generated!');
    } else {
      toast.error(res.error);
    }
    setIsGeneratingRestock(false);
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading dashboard metrics...</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Business Overview</h1>
        <p className="text-muted-foreground">Monitor your store's performance and AI insights.</p>
      </div>

      {/* 1. Top KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Today's Revenue" 
          value={stats.todayRevenue} 
          prefix="₹" 
          icon={IndianRupee} 
          trend="vs lifetime avg" 
          trendUp={true} 
        />
        <MetricCard 
          title="Today's Orders" 
          value={stats.todayOrders} 
          icon={ShoppingCart} 
          trend={`${stats.totalOrders} total lifetime`} 
          trendUp={true} 
        />
        <MetricCard 
          title="Active Products" 
          value={stats.activeProducts} 
          icon={Package} 
        />
        <MetricCard 
          title="Low Stock Alerts" 
          value={stats.lowStockProducts.length} 
          icon={TrendingUp} 
          trend="needs attention" 
          trendUp={false} 
        />
      </div>

      {/* 2. Revenue Charts & Category Distribution */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                7-Day Revenue Trend
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <RevenueChart data={stats.weeklyRevenue} />
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Category Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <CategoryDistribution data={stats.categoryDistribution} />
          </CardContent>
        </Card>
      </div>

      {/* 3. AI Insights (Premium Container) */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="relative overflow-hidden border-indigo-500/20 shadow-md group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 -z-10 transition-opacity group-hover:opacity-100 opacity-50" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                Daily AI Summary
              </CardTitle>
              <CardDescription>Instant business performance analysis.</CardDescription>
            </div>
            <Button onClick={handleGenerateSummary} disabled={isGeneratingAI} variant="secondary" size="sm" className="bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-400">
              {isGeneratingAI ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Generate'}
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {aiSummary ? (
              <div className="text-sm leading-relaxed text-foreground/90 font-medium">
                {aiSummary}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic flex items-center gap-2">
                Click generate to synthesize today's data...
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-emerald-500/20 shadow-md group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 -z-10 transition-opacity group-hover:opacity-100 opacity-50" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-emerald-500" />
                Restock Intelligence
              </CardTitle>
              <CardDescription>AI-driven inventory forecasting.</CardDescription>
            </div>
            <Button onClick={handleGenerateRestock} disabled={isGeneratingRestock} variant="secondary" size="sm" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400">
              {isGeneratingRestock ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Analyze'}
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {restockInsights ? (
              <div className="text-sm leading-relaxed text-foreground/90 font-medium">
                {restockInsights}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic">
                Click to scan inventory health levels...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Recent Activity & Inventory Health */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm border-border/50 flex flex-col">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Needs Restock</CardTitle>
            <CardDescription>Products running below minimum threshold.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {stats.lowStockProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-lg bg-muted/10">
                <Package className="h-8 w-8 text-muted-foreground mb-3 opacity-50" />
                <p className="text-sm font-medium">All inventory levels look good!</p>
                <p className="text-xs text-muted-foreground mt-1">No products are currently below their low stock threshold.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.lowStockProducts.map((p: any) => (
                  <div key={p.id} className="flex justify-between items-center p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{p.name}</span>
                      <span className="text-xs text-muted-foreground">Threshold: {p.lowStockThreshold}</span>
                    </div>
                    <Badge variant="destructive" className="bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800">
                      {p.stock} left
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
            <CardDescription>Latest completed transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-lg bg-muted/10">
                 <ShoppingCart className="h-8 w-8 text-muted-foreground mb-3 opacity-50" />
                 <p className="text-sm font-medium">No recent orders found.</p>
               </div>
            ) : (
              <div className="space-y-3">
                {stats.recentOrders.map((order: any) => (
                  <div key={order.id} className="flex justify-between items-center p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{order.invoiceNumber}</span>
                      <span className="text-xs text-muted-foreground">{order.customerName || 'Walk-in'} • {order.itemsCount} items</span>
                    </div>
                    <div className="font-bold">₹{order.totalAmount.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
