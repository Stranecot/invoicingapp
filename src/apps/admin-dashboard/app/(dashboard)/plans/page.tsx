'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Plus, Search, Filter } from 'lucide-react';
import { PlanTable } from '@/components/plans/plan-table';
import { CreatePlanDialog } from '@/components/plans/create-plan-dialog';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  maxUsers: number;
  maxInvoices: number;
  maxCustomers: number;
  maxExpenses: number;
  features: string[];
  isActive: boolean;
  isPublic: boolean;
  sortOrder: number;
  _count: {
    organizations: number;
  };
}

interface PlansResponse {
  plans: Plan[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function PlansPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and search
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (search) params.set('search', search);
      if (isActiveFilter) params.set('isActive', isActiveFilter);

      const response = await fetch(`/api/admin/plans?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch plans');
      }

      const data: PlansResponse = await response.json();
      setPlans(data.plans);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [search, isActiveFilter, page]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/plans/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete plan');
      }

      fetchPlans();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete plan');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/plans/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update plan');
      }

      fetchPlans();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update plan');
    }
  };

  return (
    <div>
      <Header
        title="Subscription Plans"
        description="Manage subscription plans and pricing"
        action={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Plan
          </Button>
        }
      />

      <div className="p-4 md:p-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Plans</p>
                  <p className="text-2xl font-bold mt-1">{pagination.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Plans</p>
                  <p className="text-2xl font-bold mt-1">
                    {plans.filter(p => p.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Organizations</p>
                  <p className="text-2xl font-bold mt-1">
                    {plans.reduce((sum, p) => sum + p._count.organizations, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search plans..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="w-full md:w-48">
                <Select
                  value={isActiveFilter}
                  onChange={(e) => setIsActiveFilter(e.target.value)}
                  options={[
                    { value: '', label: 'All Status' },
                    { value: 'true', label: 'Active' },
                    { value: 'false', label: 'Inactive' },
                  ]}
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading plans...</div>
            ) : (
              <>
                <PlanTable
                  plans={plans}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                />

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <p className="text-sm text-gray-600">
                      Showing {((page - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} plans
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

      <CreatePlanDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={fetchPlans}
      />
    </div>
  );
}
