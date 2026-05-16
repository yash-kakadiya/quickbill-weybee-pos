'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/actions/auth.actions';
import { Package, ShoppingCart, LayoutDashboard, History, LogOut, FileSpreadsheet, Tags, Menu, X, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'POS Billing', href: '/pos', icon: ShoppingCart },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Categories', href: '/categories', icon: Tags },
    { name: 'Orders History', href: '/orders', icon: History },
    { name: 'Reports', href: '/reports', icon: FileSpreadsheet },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r bg-card/50 backdrop-blur-xl flex flex-col hidden md:flex z-10 transition-all duration-300">
        <div className="h-16 flex items-center px-6 border-b font-bold text-lg gap-2 text-primary">
          <Store className="h-5 w-5" />
          QuickBill
        </div>
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href}>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start transition-all duration-200 ${isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'}`}
                >
                  <item.icon className={`mr-3 h-4 w-4 ${isActive ? 'text-primary' : ''}`} />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <form action={async () => { await logoutAction(); }}>
            <Button variant="ghost" type="submit" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors">
              <LogOut className="mr-3 h-4 w-4" />
              Logout
            </Button>
          </form>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="relative w-64 h-full bg-card border-r shadow-lg flex flex-col animate-in slide-in-from-left-full duration-200">
            <div className="h-16 flex items-center justify-between px-6 border-b font-bold text-lg text-primary">
              <div className="flex items-center gap-2"><Store className="h-5 w-5"/> QuickBill</div>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}><X className="h-5 w-5" /></Button>
            </div>
            <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button 
                      variant="ghost" 
                      className={`w-full justify-start transition-all duration-200 ${isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'}`}
                    >
                      <item.icon className={`mr-3 h-4 w-4 ${isActive ? 'text-primary' : ''}`} />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t">
              <form action={async () => { await logoutAction(); }}>
                <Button variant="ghost" type="submit" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
                  <LogOut className="mr-3 h-4 w-4" />
                  Logout
                </Button>
              </form>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-muted/20">
        <header className="h-16 border-b flex items-center justify-between px-6 bg-card/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-bold md:hidden text-lg">QuickBill</span>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          {children}
        </div>
      </main>
    </div>
  );
}
