import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/users/user-avatar';
import { UserRoleBadge } from '@/components/users/user-role-badge';
import { UserStatusBadge } from '@/components/users/user-status-badge';
import { UserActivityTimeline } from '@/components/users/user-activity-timeline';
import {
  Edit,
  Mail,
  Building2,
  Calendar,
  Clock,
  FileText,
  Receipt,
  Users,
  Wallet,
  StickyNote,
} from 'lucide-react';

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getUserData(userId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

  const [userRes, activityRes, statsRes] = await Promise.all([
    fetch(`${baseUrl}/api/admin/users/${userId}`, {
      cache: 'no-store',
    }),
    fetch(`${baseUrl}/api/admin/users/${userId}/activity`, {
      cache: 'no-store',
    }),
    fetch(`${baseUrl}/api/admin/users/${userId}/stats`, {
      cache: 'no-store',
    }),
  ]);

  if (!userRes.ok) {
    return null;
  }

  const [userData, activityData, statsData] = await Promise.all([
    userRes.json(),
    activityRes.ok ? activityRes.json() : { activities: [] },
    statsRes.ok ? statsRes.json() : { stats: null },
  ]);

  return {
    user: userData.user,
    activities: activityData.activities,
    stats: statsData.stats,
  };
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;
  const data = await getUserData(id);

  if (!data) {
    notFound();
  }

  const { user, activities, stats } = data;

  return (
    <div>
      <Header
        title="User Details"
        description={`Viewing details for ${user.name || user.email}`}
        action={
          <Link href={`/users/${id}/edit`}>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Edit User
            </Button>
          </Link>
        }
      />

      <div className="p-4 md:p-8 space-y-6">
        {/* User Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <UserAvatar name={user.name} size="xl" />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {user.name || 'Unnamed User'}
                    </h2>
                    <div className="flex items-center gap-2 mt-1 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <UserRoleBadge role={user.role} />
                    <UserStatusBadge isActive={user.isActive} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="w-4 h-4" />
                    <span className="font-medium">Organization:</span>
                    <span>
                      {user.organization?.name || (
                        <span className="italic">No organization</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Last Login:</span>
                    <span>
                      {user.lastLoginAt ? (
                        formatDistanceToNow(new Date(user.lastLoginAt), {
                          addSuffix: true,
                        })
                      ) : (
                        <span className="italic">Never</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">Created:</span>
                    <span>{format(new Date(user.createdAt), 'PPP')}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">Updated:</span>
                    <span>
                      {formatDistanceToNow(new Date(user.updatedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Invoices</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.invoices.total}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Receipt className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Expenses</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.expenses.total}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Customers</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.customers}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <Wallet className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Budgets</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.budgets}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <StickyNote className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.notes}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Additional Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-600">User ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">{user.id}</dd>
                </div>
                {user.invitationId && (
                  <div>
                    <dt className="text-sm font-medium text-gray-600">
                      Invitation ID
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono">
                      {user.invitationId}
                    </dd>
                  </div>
                )}
                {user.organization && (
                  <div>
                    <dt className="text-sm font-medium text-gray-600">
                      Organization ID
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono">
                      {user.organizationId}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Activity Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              <UserActivityTimeline events={activities} />
            </CardContent>
          </Card>
        </div>

        {/* Data Summary Card */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>Associated Data Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Invoices</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Total</p>
                      <p className="font-semibold">{stats.invoices.total}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Paid</p>
                      <p className="font-semibold text-green-600">
                        {stats.invoices.paid}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Pending</p>
                      <p className="font-semibold text-yellow-600">
                        {stats.invoices.pending}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Financial Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Total Invoice Amount</p>
                      <p className="font-semibold text-lg">
                        ${stats.invoices.totalAmount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Expenses</p>
                      <p className="font-semibold text-lg">
                        ${stats.expenses.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
