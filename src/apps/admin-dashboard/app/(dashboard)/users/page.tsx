'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { UserTable, UserTableData } from '@/components/users/user-table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Role } from '@invoice-app/database';

interface Organization {
  id: string;
  name: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserTableData[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL');
  const [orgFilter, setOrgFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'ALL'>('ALL');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId: string | null;
    action: 'activate' | 'deactivate' | null;
  }>({
    open: false,
    userId: null,
    action: null,
  });

  // Fetch users with filters
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sortBy: sortField,
        sortOrder,
        ...(searchQuery && { search: searchQuery }),
        ...(roleFilter !== 'ALL' && { role: roleFilter }),
        ...(orgFilter !== 'ALL' && { organizationId: orgFilter }),
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/users?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, roleFilter, orgFilter, statusFilter, sortField, sortOrder]);

  // Fetch organizations
  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/admin/organizations');
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
    }
  };

  // Load data on mount and when filters change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset to first page on search
      fetchUsers();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterRole = (role: Role | 'ALL') => {
    setRoleFilter(role);
    setCurrentPage(1);
  };

  const handleFilterOrganization = (orgId: string) => {
    setOrgFilter(orgId);
    setCurrentPage(1);
  };

  const handleFilterStatus = (status: 'active' | 'inactive' | 'ALL') => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleToggleStatus = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    setConfirmDialog({
      open: true,
      userId,
      action: user.isActive ? 'deactivate' : 'activate',
    });
  };

  const confirmToggleStatus = async () => {
    if (!confirmDialog.userId || !confirmDialog.action) return;

    try {
      const isActive = confirmDialog.action === 'activate';

      const response = await fetch(
        `/api/admin/users/${confirmDialog.userId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isActive }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      // Refresh users
      await fetchUsers();

      // Close dialog
      setConfirmDialog({
        open: false,
        userId: null,
        action: null,
      });
    } catch (err) {
      console.error('Error updating user status:', err);
      alert('Failed to update user status. Please try again.');
    }
  };

  return (
    <div>
      <Header
        title="Users"
        description="Manage all users across organizations"
      />

      <div className="p-4 md:p-8">
        {error ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-red-600">
                <p>{error}</p>
                <Button onClick={fetchUsers} className="mt-4" variant="outline">
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              {isLoading && users.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Loading users...
                </div>
              ) : (
                <UserTable
                  users={users}
                  organizations={organizations}
                  onSearch={handleSearch}
                  onFilterRole={handleFilterRole}
                  onFilterOrganization={handleFilterOrganization}
                  onFilterStatus={handleFilterStatus}
                  onSort={handleSort}
                  onPageChange={handlePageChange}
                  onToggleStatus={handleToggleStatus}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  sortField={sortField}
                  sortOrder={sortOrder}
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          !open &&
          setConfirmDialog({ open: false, userId: null, action: null })
        }
      >
        <DialogContent>
          <DialogHeader onClose={() => setConfirmDialog({ open: false, userId: null, action: null })}>
            <DialogTitle>
              {confirmDialog.action === 'activate' ? 'Activate User' : 'Deactivate User'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to{' '}
              {confirmDialog.action === 'activate' ? 'activate' : 'deactivate'}{' '}
              this user?
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-gray-600">
              {confirmDialog.action === 'activate'
                ? 'This user will be able to log in and access the system.'
                : 'This user will be logged out and unable to access the system until reactivated.'}
            </p>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog({ open: false, userId: null, action: null })
              }
            >
              Cancel
            </Button>
            <Button
              variant={confirmDialog.action === 'deactivate' ? 'danger' : 'primary'}
              onClick={confirmToggleStatus}
            >
              {confirmDialog.action === 'activate' ? 'Activate' : 'Deactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
