'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, FileText, Receipt, MoreHorizontal, Plus } from 'lucide-react';
import { useState } from 'react';
import { MoreDrawer } from './more-drawer';

const navItems = [
  { href: '/', icon: Home, label: 'Dashboard' },
  { href: '/invoices', icon: FileText, label: 'Invoices' },
  { href: '/expenses', icon: Receipt, label: 'Expenses' },
  { icon: MoreHorizontal, label: 'More', isMore: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);

  // Hide bottom nav on form pages
  const shouldHideBottomNav =
    pathname === '/invoices/new' ||
    (pathname.startsWith('/invoices/') && !pathname.includes('/preview'));

  // Determine FAB action based on current page
  const handleFabClick = () => {
    if (pathname === '/expenses' || pathname.startsWith('/expenses')) {
      router.push('/expenses?action=new');
    } else if (pathname === '/customers' || pathname.startsWith('/customers')) {
      router.push('/customers?action=new');
    } else {
      // Default: Create new invoice
      router.push('/invoices/new');
    }
  };

  // Don't render if on form pages
  if (shouldHideBottomNav) {
    return null;
  }

  // Check if current page is active
  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // Check if More should be active (when on customers or settings)
  const isMoreActive = pathname === '/customers' || pathname === '/settings';

  return (
    <>
      <MoreDrawer isOpen={isMoreDrawerOpen} onClose={() => setIsMoreDrawerOpen(false)} />

      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white border-t border-gray-200 safe-area-inset-bottom">
        {/* FAB Button - Positioned absolutely above the nav bar */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-7">
          <button
            onClick={handleFabClick}
            className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors active:scale-95"
            aria-label="Create new"
          >
            <Plus className="w-6 h-6" strokeWidth={2.5} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="grid grid-cols-4 h-16">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = item.isMore ? isMoreActive : isActive(item.href);

            if (item.isMore) {
              return (
                <button
                  key={index}
                  onClick={() => setIsMoreDrawerOpen(true)}
                  className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                    active ? 'text-blue-600' : 'text-gray-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href!}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  active ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
