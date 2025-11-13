'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatNumber } from '@/lib/format-number';
import { format } from 'date-fns';
import { CHART_COLORS } from '@/lib/chart-colors';

interface GrowthDataPoint {
  date: string;
  count: number;
  cumulative: number;
}

interface UserGrowthChartProps {
  data: GrowthDataPoint[];
  loading?: boolean;
}

export function UserGrowthChart({ data, loading = false }: UserGrowthChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
          <CardDescription>Daily user signups over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-64 bg-gray-300 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
          <CardDescription>Daily user signups over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate max value for scaling
  const maxCumulative = Math.max(...data.map((d) => d.cumulative));
  const maxDaily = Math.max(...data.map((d) => d.count));

  // Sample data points for display (show every nth point to avoid crowding)
  const displayPoints = data.length > 15 ? Math.ceil(data.length / 15) : 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Growth</CardTitle>
        <CardDescription>Daily user signups over the last {data.length} days</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Simple bar chart visualization */}
        <div className="space-y-6">
          {/* Cumulative growth line */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Total Users</span>
              <span className="text-lg font-bold text-gray-900">
                {formatNumber(data[data.length - 1]?.cumulative || 0)}
              </span>
            </div>
            <div className="relative h-32 bg-gray-50 rounded-lg p-4">
              <svg className="w-full h-full" preserveAspectRatio="none">
                <polyline
                  points={data
                    .map((point, index) => {
                      const x = (index / (data.length - 1)) * 100;
                      const y = 100 - (point.cumulative / maxCumulative) * 100;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke={CHART_COLORS.primary}
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
                {/* Fill area under line */}
                <polygon
                  points={`0,100 ${data
                    .map((point, index) => {
                      const x = (index / (data.length - 1)) * 100;
                      const y = 100 - (point.cumulative / maxCumulative) * 100;
                      return `${x},${y}`;
                    })
                    .join(' ')} 100,100`}
                  fill={CHART_COLORS.primary}
                  fillOpacity="0.1"
                />
              </svg>
            </div>
          </div>

          {/* Daily signups */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Daily Signups</span>
              <span className="text-sm text-gray-600">
                Avg: {formatNumber(Math.round(data.reduce((sum, d) => sum + d.count, 0) / data.length))}/day
              </span>
            </div>
            <div className="flex items-end gap-1 h-24">
              {data.map((point, index) => {
                const height = maxDaily > 0 ? (point.count / maxDaily) * 100 : 0;
                const showLabel = index % displayPoints === 0;

                return (
                  <div key={point.date} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t transition-all hover:opacity-75 cursor-pointer group relative"
                      style={{
                        height: `${height}%`,
                        backgroundColor: point.count > 0 ? CHART_COLORS.success : CHART_COLORS.info,
                        minHeight: point.count > 0 ? '2px' : '0',
                      }}
                      title={`${format(new Date(point.date), 'MMM dd')}: ${point.count} signups`}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                        {format(new Date(point.date), 'MMM dd')}: {point.count}
                      </div>
                    </div>
                    {showLabel && (
                      <span className="text-[10px] text-gray-500 mt-1">
                        {format(new Date(point.date), 'MM/dd')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t border-gray-200">
            <div className="text-center sm:text-left">
              <p className="text-[10px] sm:text-xs text-gray-600 mb-1">Total Signups</p>
              <p className="text-base sm:text-lg font-semibold text-gray-900">
                {formatNumber(data.reduce((sum, d) => sum + d.count, 0))}
              </p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] sm:text-xs text-gray-600 mb-1">Peak Day</p>
              <p className="text-base sm:text-lg font-semibold text-gray-900">
                {formatNumber(maxDaily)}
              </p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] sm:text-xs text-gray-600 mb-1">Active Days</p>
              <p className="text-base sm:text-lg font-semibold text-gray-900">
                {formatNumber(data.filter((d) => d.count > 0).length)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function UserGrowthChartSkeleton() {
  return <UserGrowthChart data={[]} loading />;
}
