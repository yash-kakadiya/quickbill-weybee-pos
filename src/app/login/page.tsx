'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { loginSchema, LoginInput } from '@/lib/validations/auth';
import { loginAction } from '@/actions/auth.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Store } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginInput) {
    setIsLoading(true);
    try {
      const result = await loginAction(data);
      if (result.success) {
        toast.success('Logged in successfully');
        router.push('/');
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10 opacity-50 dark:opacity-20" />
      
      <Card className="w-full max-w-sm shadow-xl border-border/50 animate-in zoom-in-95 duration-500 fade-in bg-card/80 backdrop-blur-xl">
        <CardHeader className="space-y-3 pb-6 text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">QuickBill POS</CardTitle>
            <CardDescription className="mt-1.5">Enter your credentials to access the system.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5 text-left">
              <label htmlFor="username" className="text-sm font-medium text-foreground">Username</label>
              <Input 
                id="username" 
                placeholder="admin" 
                {...form.register('username')} 
                disabled={isLoading} 
                className="transition-all focus-visible:ring-primary shadow-sm"
              />
              {form.formState.errors.username && (
                <p className="text-xs font-medium text-destructive mt-1">{form.formState.errors.username.message}</p>
              )}
            </div>
            <div className="space-y-1.5 text-left">
              <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                {...form.register('password')} 
                disabled={isLoading} 
                className="transition-all focus-visible:ring-primary shadow-sm"
              />
              {form.formState.errors.password && (
                <p className="text-xs font-medium text-destructive mt-1">{form.formState.errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full shadow-sm mt-2" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
