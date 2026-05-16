'use client';

import { useState, useEffect } from 'react';
import { getDashboardStats } from '@/actions/dashboard.actions';
import { generateDailySummary, generateRestockInsights } from '@/actions/ai.actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Package, ShoppingCart, IndianRupee, Sparkles, Loader2, BrainCircuit } from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

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
    return <div className="flex h-[50vh] items-center justify-center text-muted-foreground">Loading dashboard...</div>;
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Business Overview</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.todayRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Out of ₹{stats.totalRevenue.toFixed(2)} lifetime</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.todayOrders}</div>
            <p className="text-xs text-muted-foreground">{stats.totalOrders} total orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProducts}</div>
            <p className="text-xs text-muted-foreground">in your catalogue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <TrendingUp className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">items need restocking</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>AI Smart Summary</CardTitle>
              <CardDescription>Get instant insights powered by Gemini.</CardDescription>
            </div>
            <Button onClick={handleGenerateSummary} disabled={isGeneratingAI} variant="outline" size="sm">
              {isGeneratingAI ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 text-blue-500" />}
              Generate Insights
            </Button>
          </CardHeader>
          <CardContent>
            {aiSummary ? (
              <div className="p-4 bg-primary/10 rounded-md border border-primary/20 text-sm leading-relaxed">
                {aiSummary}
              </div>
            ) : (
              <div className="h-[100px] flex items-center justify-center text-muted-foreground border border-dashed rounded-md">
                Click generate for a quick AI summary of today's performance.
              </div>
            )}

            <div className="mt-8 h-[300px]">
              <h3 className="text-sm font-medium mb-4 text-muted-foreground">Top Selling Products (Overall)</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topProducts}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="col-span-3 flex flex-col gap-4">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle>Needs Restock</CardTitle>
              <CardDescription>Products running below threshold.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
               {stats.lowStockProducts.length === 0 ? (
                 <p className="text-sm text-muted-foreground">All inventory levels look good!</p>
               ) : (
                 stats.lowStockProducts.map((p: any) => (
                   <div key={p.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                      <span className="font-medium text-sm">{p.name}</span>
                      <Badge variant="destructive">{p.stock} left</Badge>
                   </div>
                 ))
               )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Restock Intelligence</CardTitle>
              </div>
              <Button onClick={handleGenerateRestock} disabled={isGeneratingRestock} variant="secondary" size="sm">
                {isGeneratingRestock ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4 text-purple-500" />}
              </Button>
            </CardHeader>
            <CardContent>
              {restockInsights ? (
                <div className="text-sm leading-relaxed text-muted-foreground">
                  {restockInsights}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">
                  Click to analyze inventory health...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
