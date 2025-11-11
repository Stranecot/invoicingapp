'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getStatusColor } from '@/lib/chart-colors';
import { formatNumber } from '@/lib/format-number';

interface ChartDataItem {
  label: string;
  value: number;
}

interface OrgStatusChartProps {
  data: ChartDataItem[];
  loading?: boolean;
}

export function OrgStatusChart({ data, loading = false }: OrgStatusChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organizations by Status</CardTitle>
          <CardDescription>Distribution of organization statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-8 bg-gray-300 rounded flex-1" />
                <div className="h-8 bg-gray-300 rounded w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organizations by Status</CardTitle>
          <CardDescription>Distribution of organization statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organizations by Status</CardTitle>
        <CardDescription>Distribution of organization statuses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            const color = getStatusColor(item.label as keyof typeof import('@/lib/chart-colors').STATUS_COLORS);

            return (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatNumber(item.value)}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Total Organizations</span>
            <span className="text-lg font-bold text-gray-900">{formatNumber(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function OrgStatusChartSkeleton() {
  return <OrgStatusChart data={[]} loading />;
}
