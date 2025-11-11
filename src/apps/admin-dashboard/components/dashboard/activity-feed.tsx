import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  UserPlus,
  Mail,
  MailCheck,
  Building2,
  Activity as ActivityIcon,
  LucideIcon,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/date-utils';
import type { ActivityType, ActivityItem } from '@/app/api/admin/activity/route';

interface ActivityFeedProps {
  activities: ActivityItem[];
  loading?: boolean;
}

const activityIcons: Record<ActivityType, LucideIcon> = {
  user_signup: UserPlus,
  user_login: ActivityIcon,
  invitation_sent: Mail,
  invitation_accepted: MailCheck,
  organization_created: Building2,
  organization_status_changed: Building2,
};

const activityColors: Record<ActivityType, string> = {
  user_signup: 'text-green-500',
  user_login: 'text-blue-500',
  invitation_sent: 'text-yellow-500',
  invitation_accepted: 'text-green-500',
  organization_created: 'text-purple-500',
  organization_status_changed: 'text-orange-500',
};

export function ActivityFeed({ activities, loading = false }: ActivityFeedProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system events and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start gap-4 py-3 border-b border-gray-100 last:border-0">
                  <div className="w-10 h-10 bg-gray-300 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded mb-2 w-3/4" />
                    <div className="h-3 bg-gray-300 rounded w-1/2" />
                  </div>
                  <div className="h-3 bg-gray-300 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system events and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <ActivityIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest system events and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type];
            const iconColor = activityColors[activity.type];

            return (
              <div
                key={activity.id}
                className="flex items-start gap-4 py-3 border-b border-gray-100 last:border-0"
              >
                <div className="mt-1 p-2 rounded-full bg-gray-50">
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{activity.title}</p>
                  <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {formatRelativeTime(activity.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function ActivityFeedSkeleton() {
  return <ActivityFeed activities={[]} loading />;
}
