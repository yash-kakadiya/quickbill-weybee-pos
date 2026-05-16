'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { logoutAction } from '@/actions/auth.actions';

export default function Dashboard() {
  const router = useRouter();

  async function handleLogout() {
    await logoutAction();
    router.push('/login');
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </div>
      <p>Welcome to QuickBill POS.</p>
    </div>
  );
}
