'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, Users, Settings, Receipt, UserCog, LogOut, UsersRound } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const baseNavItems = [
  { href: '/', icon: Home, label: 'Dashboard', roles: ['ADMIN', 'USER', 'ACCOUNTANT', 'OWNER', 'EMPLOYEE'] },
  { href: '/invoices', icon: FileText, label: 'Invoices', roles: ['ADMIN', 'USER', 'ACCOUNTANT', 'OWNER', 'EMPLOYEE'] },
  { href: '/expenses', icon: Receipt, label: 'Expenses', roles: ['ADMIN', 'USER', 'ACCOUNTANT', 'OWNER', 'EMPLOYEE'] },
  { href: '/customers', icon: Users, label: 'Customers', roles: ['ADMIN', 'USER', 'ACCOUNTANT', 'OWNER', 'EMPLOYEE'] },
  { href: '/team', icon: UsersRound, label: 'Team', roles: ['OWNER'] },
  { href: '/settings', icon: Settings, label: 'Settings', roles: ['ADMIN', 'USER', 'OWNER'] },
];

const adminNavItems = [
  { href: '/admin', icon: UserCog, label: 'Admin Panel', roles: ['ADMIN'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Combine nav items based on role
  const navItems = [
    ...baseNavItems.filter(item => user?.role && item.roles.includes(user.role)),
    ...(isAdmin ? adminNavItems : []),
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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
              <>
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-white font-medium">
                        {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name || 'User'}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </>
            ) : null}
            <p className="text-xs text-gray-500">Invoice App v1.0</p>
          </div>
        </div>
      </aside>
    </>
  );
}
