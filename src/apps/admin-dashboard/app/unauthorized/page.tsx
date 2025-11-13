'use client';

import { useRouter } from 'next/navigation';
import { ShieldAlert, Home, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function UnauthorizedPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 rounded-full p-4">
            <ShieldAlert className="w-12 h-12 text-red-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Access Denied
        </h1>

        <p className="text-gray-600 mb-6">
          You don't have permission to access the admin dashboard. This area is restricted to administrators only.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Need admin access?</strong>
            <br />
            Please contact your system administrator to request admin privileges.
          </p>
        </div>

        <div className="space-y-3">
          <Link href={process.env.NEXT_PUBLIC_CLIENT_URL || '/'} className="block">
            <Button className="w-full" variant="primary">
              <Home className="w-4 h-4 mr-2" />
              Go to Client Portal
            </Button>
          </Link>

          <Button onClick={handleSignOut} className="w-full" variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </Card>
    </div>
  );
}
