import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, Mail, Users } from 'lucide-react';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  iconColor: string;
  iconBgColor: string;
}

const quickActions: QuickAction[] = [
  {
    title: 'Create Organization',
    description: 'Add a new organization to the system',
    icon: Building2,
    href: '/organizations?action=create',
    iconColor: 'text-blue-500',
    iconBgColor: 'bg-blue-50',
  },
  {
    title: 'Send Invitation',
    description: 'Invite users to join organizations',
    icon: Mail,
    href: '/invitations?action=create',
    iconColor: 'text-green-500',
    iconBgColor: 'bg-green-50',
  },
  {
    title: 'View All Users',
    description: 'Browse and manage all users',
    icon: Users,
    href: '/users',
    iconColor: 'text-purple-500',
    iconBgColor: 'bg-purple-50',
  },
  {
    title: 'View Organizations',
    description: 'Browse all organizations',
    icon: Building2,
    href: '/organizations',
    iconColor: 'text-orange-500',
    iconBgColor: 'bg-orange-50',
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common administrative tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className="group p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${action.iconBgColor} group-hover:scale-110 transition-transform flex-shrink-0`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${action.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm mb-0.5 truncate">
                      {action.title}
                    </h4>
                    <p className="text-xs text-gray-600 line-clamp-2">{action.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
