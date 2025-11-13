'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { navItems } from './nav-items';
import { useAuth } from '@invoice-app/auth/client';
import { Badge } from '@/components/ui/badge';
import { LogOut, User } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getRoleBadgeColor = (role?: string | null) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-600 text-white border-purple-500';
      case 'ACCOUNTANT':
        return 'bg-blue-600 text-white border-blue-500';
      case 'USER':
        return 'bg-green-600 text-white border-green-500';
      default:
        return 'bg-gray-600 text-white border-gray-500';
    }
  };

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-gray-900 text-white fixed h-full">
      <div className="flex flex-col h-full">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-xs text-gray-400 mt-1">Invoice App</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            // For root path, only match exactly. For others, match prefix too
            const isActive = item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname?.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-6 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.name || 'Admin User'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {user?.role && (
                  <Badge className={`text-xs ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </Badge>
                )}
              </div>
              {user?.email && (
                <p className="text-xs text-gray-400 truncate mt-1">{user.email}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
          <p className="text-xs text-gray-500 mt-4">Admin Dashboard v1.0</p>
        </div>
      </div>
    </aside>
  );
}
