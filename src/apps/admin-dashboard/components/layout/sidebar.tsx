'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems } from './nav-items';
import dynamic from 'next/dynamic';
import { useAuth } from '@invoice-app/auth';
import { Badge } from '@/components/ui/badge';

// Dynamically import UserButton to avoid SSR issues
const UserButton = dynamic(
  () => import('@clerk/nextjs').then((mod) => mod.UserButton),
  { ssr: false }
);

export function Sidebar() {
  const pathname = usePathname();
  const { user, clerkUser } = useAuth();

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
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

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
            <UserButton
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10"
                }
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.name || clerkUser?.fullName || 'Admin User'}
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
          <p className="text-xs text-gray-500">Admin Dashboard v1.0</p>
        </div>
      </div>
    </aside>
  );
}
