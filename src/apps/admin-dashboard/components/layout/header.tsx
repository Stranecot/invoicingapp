'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@invoice-app/auth';

interface HeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  showUserInfo?: boolean;
}

export function Header({ title, description, action, showUserInfo = false }: HeaderProps) {
  const { user, clerkUser } = useAuth();

  const getRoleBadgeColor = (role?: string | null) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ACCOUNTANT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'USER':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => {
                // This will be connected to a mobile menu in the future
                console.log('Toggle mobile menu');
              }}
            >
              <Menu className="w-5 h-5" />
            </Button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {showUserInfo && user?.role && (
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {user.role}
                  </Badge>
                )}
              </div>
              {description && (
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              )}
              {showUserInfo && (user?.name || clerkUser?.fullName) && (
                <p className="text-xs text-gray-500 mt-1">
                  {user?.name || clerkUser?.fullName}
                </p>
              )}
            </div>
          </div>

          {action && <div>{action}</div>}
        </div>
      </div>
    </div>
  );
}
