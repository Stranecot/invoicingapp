import { notFound } from 'next/navigation';
import { prisma } from '@invoice-app/database';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Users,
  FileText,
  Building2,
  DollarSign,
  Edit,
  Calendar,
  Check,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface PlanDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getPlanDetails(id: string) {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          organizations: true,
        },
      },
      organizations: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          createdAt: true,
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      },
    },
  });

  return plan;
}

export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
  const { id } = await params;
  const plan = await getPlanDetails(id);

  if (!plan) {
    notFound();
  }

  const formatLimit = (value: number) => {
    return value === -1 ? 'Unlimited' : value.toLocaleString();
  };

  return (
    <div>
      <Header
        title={plan.name}
        description={`Subscription plan details for ${plan.slug}`}
        action={
          <Link href={`/plans/${plan.id}/edit`}>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Edit Plan
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
                  <p className="text-sm text-gray-600">Price</p>
                  <p className="text-2xl font-bold mt-1">
                    {plan.price === 0 ? 'Free' : `${plan.currency} ${plan.price.toFixed(2)}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">/month</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Organizations</p>
                  <p className="text-2xl font-bold mt-1">{plan._count.organizations}</p>
                  <p className="text-xs text-gray-500 mt-1">Using this plan</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Max Users</p>
                  <p className="text-2xl font-bold mt-1">{formatLimit(plan.maxUsers)}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Max Invoices</p>
                  <p className="text-2xl font-bold mt-1">{formatLimit(plan.maxInvoices)}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Plan Information */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-base text-gray-900 mt-1">{plan.name}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Slug</p>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                  {plan.slug}
                </code>
              </div>

              {plan.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p className="text-base text-gray-900 mt-1">{plan.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <div className="mt-1">
                    <Badge variant={plan.isActive ? 'success' : 'danger'}>
                      {plan.isActive ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Visibility</p>
                  <div className="mt-1">
                    <Badge variant={plan.isPublic ? 'default' : 'secondary'}>
                      {plan.isPublic ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Created</p>
                <p className="text-base text-gray-900 mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {new Date(plan.createdAt).toLocaleDateString()} (
                  {formatDistanceToNow(new Date(plan.createdAt), { addSuffix: true })})
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Limits */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Maximum Users</p>
                <p className="text-base text-gray-900 mt-1">{formatLimit(plan.maxUsers)}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Maximum Invoices</p>
                <p className="text-base text-gray-900 mt-1">{formatLimit(plan.maxInvoices)}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Maximum Customers</p>
                <p className="text-base text-gray-900 mt-1">{formatLimit(plan.maxCustomers)}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Maximum Expenses</p>
                <p className="text-base text-gray-900 mt-1">{formatLimit(plan.maxExpenses)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        {plan.features.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {plan.features.map((feature, index) => (
                  <Badge key={index} variant="default">
                    {feature.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Organizations using this plan */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Organizations ({plan._count.organizations})</CardTitle>
              <Link href={`/organizations?plan=${plan.slug}`}>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {plan.organizations.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No organizations using this plan yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Organization</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Users</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.organizations.map((org) => (
                      <tr key={org.id} className="border-b border-gray-100">
                        <td className="py-3 px-3">
                          <Link href={`/organizations/${org.id}`} className="hover:underline">
                            <div>
                              <p className="font-medium text-gray-900">{org.name}</p>
                              <p className="text-sm text-gray-500">{org.slug}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant="default">{org._count.users}</Badge>
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant={org.status === 'ACTIVE' ? 'success' : 'danger'}>
                            {org.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-sm text-gray-600">
                          {formatDistanceToNow(new Date(org.createdAt), { addSuffix: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
