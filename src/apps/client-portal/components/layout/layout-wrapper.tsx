'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { BottomNav } from './bottom-nav';

// Routes that should not show navigation
const AUTH_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/accept-invitation',
];

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Check if current route is an auth route
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

  // If it's an auth route, render without navigation
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // Otherwise, render with navigation
  return (
    <>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="container mx-auto p-4 md:p-8 max-w-7xl pb-20 md:pb-8">
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
    </>
  );
}
