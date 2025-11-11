import { notFound } from 'next/navigation';
import { prisma } from '@invoice-app/database';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OrganizationStatusBadge } from '@/components/organizations/organization-status-badge';
import { OrganizationPlanBadge } from '@/components/organizations/organization-plan-badge';
import {
  Building2,
  Mail,
  Users,
  FileText,
  DollarSign,
  Settings,
  Edit,
  Calendar,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface OrganizationDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getOrganizationDetails(id: string) {
  const organization = await prisma.organization.findUnique({
    where: { id },
    include: {
      settings: true,
      _count: {
        select: {
          users: true,
          invoices: true,
          customers: true,
          invitations: true,
          expenses: true,
        },
      },
    },
  });

  if (!organization) {
    return null;
  }

  // Get additional stats
  const [users, invitations, recentUsers] = await Promise.all([
    prisma.user.findMany({
      where: { organizationId: id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.invitation.findMany({
      where: { organizationId: id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        invitedAt: true,
        expiresAt: true,
      },
      orderBy: { invitedAt: 'desc' },
      take: 10,
    }),
    prisma.user.count({
      where: {
        organizationId: id,
        isActive: true,
        lastLoginAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  return {
    organization,
    users,
    invitations,
    activeUsers: recentUsers,
  };
}

export default async function OrganizationDetailPage({ params }: OrganizationDetailPageProps) {
  const { id } = await params;
  const data = await getOrganizationDetails(id);

  if (!data) {
    notFound();
  }

  const { organization, users, invitations, activeUsers } = data;

  return (
    <div>
      <Header
        title={organization.name}
        description={`Organization details for ${organization.slug}`}
        action={
          <Link href={`/organizations/${organization.id}/edit`}>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Edit Organization
            </Button>
          </Link>
        }
      />

      <div className="p-4 md:p-8 space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold mt-1">
                    {organization._count.users} / {organization.maxUsers}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {((organization._count.users / organization.maxUsers) * 100).toFixed(0)}% utilized
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold mt-1">{activeUsers}</p>
                  <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Invoices</p>
                  <p className="text-2xl font-bold mt-1">{organization._count.invoices}</p>
                  <p className="text-xs text-gray-500 mt-1">All time</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Customers</p>
                  <p className="text-2xl font-bold mt-1">{organization._count.customers}</p>
                  <p className="text-xs text-gray-500 mt-1">Total</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Organization Information */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-base text-gray-900 mt-1">{organization.name}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Slug</p>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                  {organization.slug}
                </code>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Billing Email</p>
                <p className="text-base text-gray-900 mt-1 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {organization.billingEmail}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <div className="mt-1">
                    <OrganizationStatusBadge status={organization.status} />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Plan</p>
                  <div className="mt-1">
                    <OrganizationPlanBadge plan={organization.plan} />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Created</p>
                <p className="text-base text-gray-900 mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {new Date(organization.createdAt).toLocaleDateString()} (
                  {formatDistanceToNow(new Date(organization.createdAt), { addSuffix: true })})
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          {organization.settings && (
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Primary Color</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: organization.settings.primaryColor || '#3B82F6' }}
                    />
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {organization.settings.primaryColor || '#3B82F6'}
                    </code>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Invoice Prefix</p>
                  <p className="text-base text-gray-900 mt-1">{organization.settings.invoicePrefix}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tax Rate</p>
                    <p className="text-base text-gray-900 mt-1">{organization.settings.taxRate}%</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">Currency</p>
                    <p className="text-base text-gray-900 mt-1">{organization.settings.currency}</p>
                  </div>
                </div>

                {organization.settings.logoUrl && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Logo URL</p>
                    <a
                      href={organization.settings.logoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                    >
                      {organization.settings.logoUrl}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Users ({organization._count.users})</CardTitle>
              <Link href={`/users?organizationId=${organization.id}`}>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No users yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">User</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Role</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100">
                        <td className="py-3 px-3">
                          <div>
                            <p className="font-medium text-gray-900">{user.name || 'N/A'}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant="default">{user.role}</Badge>
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant={user.isActive ? 'success' : 'danger'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-sm text-gray-600">
                          {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Invitations ({organization._count.invitations})</CardTitle>
                <Link href={`/invitations?organizationId=${organization.id}`}>
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Email</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Role</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map((invitation) => (
                      <tr key={invitation.id} className="border-b border-gray-100">
                        <td className="py-3 px-3 text-gray-900">{invitation.email}</td>
                        <td className="py-3 px-3">
                          <Badge variant="default">{invitation.role}</Badge>
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant={
                              invitation.status === 'PENDING'
                                ? 'warning'
                                : invitation.status === 'ACCEPTED'
                                ? 'success'
                                : 'danger'
                            }
                          >
                            {invitation.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-sm text-gray-600">
                          {formatDistanceToNow(new Date(invitation.invitedAt), { addSuffix: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
