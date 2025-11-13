'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Plus, Search, Filter } from 'lucide-react';
import { OrganizationTable } from '@/components/organizations/organization-table';
import { CreateOrganizationDialog } from '@/components/organizations/create-organization-dialog';
import { Organization, OrgStatus, BillingPlan } from '@invoice-app/database';
import { useRouter } from 'next/navigation';

interface OrganizationWithCounts extends Organization {
  _count?: {
    users: number;
    invoices: number;
    customers: number;
  };
}

interface OrganizationsResponse {
  organizations: OrganizationWithCounts[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function OrganizationsPage() {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [organizations, setOrganizations] = useState<OrganizationWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrgStatus | ''>('');
  const [planFilter, setPlanFilter] = useState<BillingPlan | ''>('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (planFilter) params.set('plan', planFilter);

      const response = await fetch(`/api/admin/organizations?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }

      const data: OrganizationsResponse = await response.json();
      setOrganizations(data.organizations);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, planFilter, page]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/organizations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update organization status');
      }

      // Refresh the list
      fetchOrganizations();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this organization?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/organizations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete organization');
      }

      // Refresh the list
      fetchOrganizations();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div>
      <Header
        title="Organizations"
        description="Manage all organizations in the system"
        action={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Organization
          </Button>
        }
      />

      <div className="p-4 md:p-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>All Organizations ({pagination.total})</CardTitle>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search organizations..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 w-full md:w-64"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as OrgStatus | '')}
                  options={[
                    { value: '', label: 'All Statuses' },
                    { value: OrgStatus.ACTIVE, label: 'Active' },
                    { value: OrgStatus.TRIAL, label: 'Trial' },
                    { value: OrgStatus.SUSPENDED, label: 'Suspended' },
                    { value: OrgStatus.CANCELLED, label: 'Cancelled' },
                  ]}
                  className="w-full md:w-40"
                />
                <Select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value as BillingPlan | '')}
                  options={[
                    { value: '', label: 'All Plans' },
                    { value: BillingPlan.FREE, label: 'Free' },
                    { value: BillingPlan.PRO, label: 'Pro' },
                    { value: BillingPlan.ENTERPRISE, label: 'Enterprise' },
                  ]}
                  className="w-full md:w-40"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-500">Loading organizations...</p>
              </div>
            ) : organizations.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No organizations found</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Organization
                </Button>
              </div>
            ) : (
              <>
                <OrganizationTable
                  organizations={organizations}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                />

                {pagination.totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Showing {(page - 1) * pagination.limit + 1} to{' '}
                      {Math.min(page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} organizations
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page === pagination.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateOrganizationDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={fetchOrganizations}
      />
    </div>
  );
}
