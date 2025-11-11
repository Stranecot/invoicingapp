'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, Users, Settings, Receipt, UserCog } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { useAuth, useIsAdmin } from '@invoice-app/auth/client';

const baseNavItems = [
  { href: '/', icon: Home, label: 'Dashboard', roles: ['ADMIN', 'USER', 'ACCOUNTANT'] },
  { href: '/invoices', icon: FileText, label: 'Invoices', roles: ['ADMIN', 'USER', 'ACCOUNTANT'] },
  { href: '/expenses', icon: Receipt, label: 'Expenses', roles: ['ADMIN', 'USER', 'ACCOUNTANT'] },
  { href: '/customers', icon: Users, label: 'Customers', roles: ['ADMIN', 'USER', 'ACCOUNTANT'] },
  { href: '/settings', icon: Settings, label: 'Settings', roles: ['ADMIN', 'USER'] },
];

const adminNavItems = [
  { href: '/admin', icon: UserCog, label: 'Admin Panel', roles: ['ADMIN'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin();

  // Combine nav items based on role
  const navItems = [
    ...baseNavItems.filter(item => user?.role && item.roles.includes(user.role)),
    ...(isAdmin ? adminNavItems : []),
  ];

  if (loading) {
    return (
      <aside className="hidden md:flex md:flex-col w-64 bg-gray-900 text-white">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-800">
            <h1 className="text-2xl font-bold">Invoice App</h1>
          </div>
          <div className="flex-1 p-4 flex items-center justify-center">
            <div className="text-gray-400">Loading...</div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Sidebar - Hidden on mobile (< 768px), visible on desktop (>= 768px) */}
      <aside className="hidden md:flex md:flex-col w-64 bg-gray-900 text-white">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-800">
            <h1 className="text-2xl font-bold">Invoice App</h1>
            {user && (
              <p className="text-xs text-gray-400 mt-1">
                {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
              </p>
            )}
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navItems.length > 0 ? (
              navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })
            ) : (
              // Show all nav items when not authenticated (development mode)
              baseNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })
            )}
          </nav>

          <div className="p-6 border-t border-gray-800">
            {user ? (
              <div className="flex items-center gap-3 mb-4">
                <UserButton
                  afterSignOutUrl="/sign-in"
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10"
                    }
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name || 'User'}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <p className="text-sm text-gray-400">Development Mode</p>
                <p className="text-xs text-gray-500">Configure Clerk to enable auth</p>
              </div>
            )}
            <p className="text-xs text-gray-500">Invoice App v1.0</p>
          </div>
        </div>
      </aside>
    </>
  );
}
