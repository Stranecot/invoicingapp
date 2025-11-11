'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Settings, X, UserCog } from 'lucide-react';
import { useAuth, useIsAdmin } from '@invoice-app/auth/client';

const baseDrawerItems = [
  { href: '/customers', icon: Users, label: 'Customers', roles: ['ADMIN', 'USER', 'ACCOUNTANT'] },
  { href: '/settings', icon: Settings, label: 'Settings', roles: ['ADMIN', 'USER'] },
];

const adminDrawerItems = [
  { href: '/admin', icon: UserCog, label: 'Admin Panel', roles: ['ADMIN'] },
];

interface MoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MoreDrawer({ isOpen, onClose }: MoreDrawerProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = useIsAdmin();

  // Filter drawer items based on role
  const drawerItems = [
    ...baseDrawerItems.filter(item => user?.role && item.roles.includes(user.role)),
    ...(isAdmin ? adminDrawerItems : []),
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">More</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-2">
            {drawerItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
