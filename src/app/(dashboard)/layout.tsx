'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/actions/auth.actions';
import { Package, ShoppingCart, LayoutDashboard, History, LogOut, FileSpreadsheet, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'POS Billing', href: '/pos', icon: ShoppingCart },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Categories', href: '/categories', icon: Tags },
    { name: 'Orders History', href: '/orders', icon: History },
    { name: 'Reports', href: '/reports', icon: FileSpreadsheet },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-muted/40">
      <aside className="w-64 border-r bg-background flex flex-col hidden md:flex">
        <div className="h-14 flex items-center px-6 border-b font-bold text-lg">
          QuickBill POS
        </div>
        <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href}>
                <Button variant={isActive ? 'secondary' : 'ghost'} className="w-full justify-start">
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <form action={async () => { await logoutAction(); }}>
            <Button variant="ghost" type="submit" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <header className="h-14 border-b flex items-center px-6 bg-background md:hidden">
           <span className="font-bold">QuickBill POS</span>
        </header>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
