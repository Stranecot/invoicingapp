'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Building2, Users, Mail, TrendingUp } from 'lucide-react';
import { StatCard, StatCardSkeleton } from '@/components/dashboard/stat-card';
import { ActivityFeed, ActivityFeedSkeleton } from '@/components/dashboard/activity-feed';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { OrgStatusChart, OrgStatusChartSkeleton } from '@/components/dashboard/org-status-chart';
import { UserGrowthChart, UserGrowthChartSkeleton } from '@/components/dashboard/user-growth-chart';
import { SystemStatus, SystemStatusSkeleton } from '@/components/dashboard/system-status';
import { formatNumber } from '@/lib/format-number';
import type { ActivityItem } from '@/app/api/admin/activity/route';

interface DashboardStats {
  organizations: {
    total: number;
    byStatus: Record<string, number>;
    newThisMonth: number;
    top: Array<{ id: string; name: string; status: string; userCount: number }>;
  };
  users: {
    total: number;
    active: number;
    inactive: number;
    activeThisWeek: number;
    newThisMonth: number;
  };
  invitations: {
    total: number;
    byStatus: Record<string, number>;
    pending: number;
    accepted: number;
    expired: number;
    revoked: number;
  };
  growth: {
    organizationsThisMonth: number;
    usersThisMonth: number;
  };
}

interface ChartDataItem {
  label: string;
  value: number;
}

interface GrowthDataPoint {
  date: string;
  count: number;
  cumulative: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [orgChartData, setOrgChartData] = useState<ChartDataItem[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<GrowthDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [statsRes, activityRes, orgChartRes, userGrowthRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/activity?limit=10'),
          fetch('/api/admin/charts/organizations'),
          fetch('/api/admin/charts/users?days=30'),
        ]);

        if (!statsRes.ok || !activityRes.ok || !orgChartRes.ok || !userGrowthRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const [statsData, activityData, orgChartData, userGrowthData] = await Promise.all([
          statsRes.json(),
          activityRes.json(),
          orgChartRes.json(),
          userGrowthRes.json(),
        ]);

        setStats(statsData.data);
        setActivities(activityData.data.activities);
        setOrgChartData(orgChartData.data.byStatus);
        setUserGrowthData(userGrowthData.data.dailyGrowth);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Optional: Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div>
        <Header title="Dashboard" description="Overview of your admin dashboard" />
        <div className="p-4 md:p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <p className="font-semibold">Error loading dashboard</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Dashboard" description="Overview of your admin dashboard" />

      <div className="p-4 md:p-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                title="Total Organizations"
                value={formatNumber(stats?.organizations.total || 0)}
                change={`+${stats?.organizations.newThisMonth || 0} this month`}
                trend={
                  (stats?.organizations.newThisMonth || 0) > 0
                    ? 'up'
                    : (stats?.organizations.newThisMonth || 0) < 0
                    ? 'down'
                    : 'neutral'
                }
                icon={Building2}
                iconColor="text-blue-500"
                iconBgColor="bg-blue-50"
              />
              <StatCard
                title="Active Users"
                value={formatNumber(stats?.users.active || 0)}
                change={`${formatNumber(stats?.users.activeThisWeek || 0)} active this week`}
                trend={
                  (stats?.users.activeThisWeek || 0) > (stats?.users.active || 0) * 0.5
                    ? 'up'
                    : 'neutral'
                }
                icon={Users}
                iconColor="text-green-500"
                iconBgColor="bg-green-50"
              />
              <StatCard
                title="Pending Invitations"
                value={formatNumber(stats?.invitations.pending || 0)}
                change={`${formatNumber(stats?.invitations.accepted || 0)} accepted`}
                trend="neutral"
                icon={Mail}
                iconColor="text-yellow-500"
                iconBgColor="bg-yellow-50"
              />
              <StatCard
                title="Growth This Month"
                value={`+${formatNumber(stats?.growth.usersThisMonth || 0)}`}
                change={`${formatNumber(stats?.growth.organizationsThisMonth || 0)} new orgs`}
                trend={(stats?.growth.usersThisMonth || 0) > 0 ? 'up' : 'neutral'}
                icon={TrendingUp}
                iconColor="text-purple-500"
                iconBgColor="bg-purple-50"
              />
            </>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            <>
              <OrgStatusChartSkeleton />
              <UserGrowthChartSkeleton />
            </>
          ) : (
            <>
              <OrgStatusChart data={orgChartData} />
              <UserGrowthChart data={userGrowthData} />
            </>
          )}
        </div>

        {/* Activity and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {loading ? <ActivityFeedSkeleton /> : <ActivityFeed activities={activities} />}
          </div>
          <div>
            <QuickActions />
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1">
          {loading ? <SystemStatusSkeleton /> : <SystemStatus />}
        </div>
      </div>
    </div>
  );
}
