'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Mail, Shield, HardDrive, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { formatRelativeTime } from '@/lib/date-utils';

interface SystemService {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  icon: React.ComponentType<{ className?: string }>;
  lastChecked?: Date;
  message?: string;
}

interface SystemStatusProps {
  loading?: boolean;
}

export function SystemStatus({ loading = false }: SystemStatusProps) {
  // In a real implementation, these would come from actual health checks
  const [services, setServices] = React.useState<SystemService[]>([
    {
      name: 'Database',
      status: 'operational',
      icon: Database,
      lastChecked: new Date(),
      message: 'All queries executing normally',
    },
    {
      name: 'Email Service',
      status: 'operational',
      icon: Mail,
      lastChecked: new Date(),
      message: 'Messages sending successfully',
    },
    {
      name: 'Clerk Auth',
      status: 'operational',
      icon: Shield,
      lastChecked: new Date(),
      message: 'Authentication service active',
    },
    {
      name: 'Backup System',
      status: 'operational',
      icon: HardDrive,
      lastChecked: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
      message: 'Last backup completed successfully',
    },
  ]);

  React.useEffect(() => {
    // Simulate checking database connection
    const checkDatabase = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        if (response.ok) {
          setServices((prev) =>
            prev.map((service) =>
              service.name === 'Database'
                ? { ...service, status: 'operational', lastChecked: new Date() }
                : service
            )
          );
        } else {
          setServices((prev) =>
            prev.map((service) =>
              service.name === 'Database'
                ? { ...service, status: 'degraded', lastChecked: new Date() }
                : service
            )
          );
        }
      } catch {
        setServices((prev) =>
          prev.map((service) =>
            service.name === 'Database'
              ? { ...service, status: 'down', lastChecked: new Date() }
              : service
          )
        );
      }
    };

    if (!loading) {
      checkDatabase();
    }
  }, [loading]);

  const getStatusBadge = (status: SystemService['status']) => {
    switch (status) {
      case 'operational':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Operational
          </Badge>
        );
      case 'degraded':
        return (
          <Badge variant="warning" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            Degraded
          </Badge>
        );
      case 'down':
        return (
          <Badge variant="danger" className="gap-1">
            <XCircle className="w-3 h-3" />
            Down
          </Badge>
        );
    }
  };

  const getStatusDot = (status: SystemService['status']) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'down':
        return 'bg-red-500';
    }
  };

  const overallStatus = services.every((s) => s.status === 'operational')
    ? 'All Systems Operational'
    : services.some((s) => s.status === 'down')
    ? 'System Issues Detected'
    : 'Some Services Degraded';

  const overallStatusColor = services.every((s) => s.status === 'operational')
    ? 'text-green-600'
    : services.some((s) => s.status === 'down')
    ? 'text-red-600'
    : 'text-yellow-600';

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Health indicators for core services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-lg" />
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-24" />
                    <div className="h-3 bg-gray-300 rounded w-32" />
                  </div>
                </div>
                <div className="h-6 bg-gray-300 rounded w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Health indicators for core services</CardDescription>
          </div>
          <div className="text-right">
            <p className={`text-sm font-semibold ${overallStatusColor}`}>{overallStatus}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.name}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="relative p-2 rounded-lg bg-gray-50">
                    <Icon className="w-5 h-5 text-gray-700" />
                    <div
                      className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusDot(
                        service.status
                      )}`}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{service.name}</p>
                    <p className="text-xs text-gray-600">{service.message}</p>
                    {service.lastChecked && (
                      <p className="text-xs text-gray-500 mt-1">
                        Checked {formatRelativeTime(service.lastChecked)}
                      </p>
                    )}
                  </div>
                </div>
                {getStatusBadge(service.status)}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function SystemStatusSkeleton() {
  return <SystemStatus loading />;
}
