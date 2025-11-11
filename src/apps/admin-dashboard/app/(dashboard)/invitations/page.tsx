'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Plus, Search, Filter } from 'lucide-react';
import { InvitationTable } from '@/components/invitations/invitation-table';
import { CreateInvitationDialog } from '@/components/invitations/create-invitation-dialog';
import { InvitationDetailModal } from '@/components/invitations/invitation-detail-modal';
import { BulkActionsBar } from '@/components/invitations/bulk-actions-bar';

type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: InvitationStatus;
  invitedAt: string;
  expiresAt: string;
  acceptedAt?: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  inviter: {
    id: string;
    name: string;
    email: string;
  };
}

interface Stats {
  pending: number;
  accepted: number;
  expired: number;
  revoked: number;
  total: number;
  recentInvitations: number;
  expiringSoon: number;
}

export default function InvitationsPage() {
  // State
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedInvitationId, setSelectedInvitationId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 20;

  // Fetch invitations
  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (currentPage * limit).toString(),
        sortBy: 'invitedAt',
        sortOrder: 'desc',
      });

      if (searchTerm) {
        params.append('email', searchTerm);
      }

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      if (roleFilter) {
        params.append('role', roleFilter);
      }

      const response = await fetch(`/api/admin/invitations?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch invitations');
      }

      const data = await response.json();
      setInvitations(data.data || []);
      setTotalCount(data.pagination?.total || 0);
      setHasMore(data.pagination?.hasMore || false);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, roleFilter]);

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/invitations/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchInvitations();
    fetchStats();
  }, [fetchInvitations]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(0);
      fetchInvitations();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle filter changes
  useEffect(() => {
    setCurrentPage(0);
    fetchInvitations();
  }, [statusFilter, roleFilter]);

  // Selection handlers
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedIds(invitations.map((inv) => inv.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // Action handlers
  const handleResend = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/invitations/${id}/resend`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to resend invitation');
      }

      alert('Invitation resent successfully!');
      fetchInvitations();
      fetchStats();
    } catch (error) {
      console.error('Error resending invitation:', error);
      alert('Failed to resend invitation');
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/invitations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke invitation');
      }

      alert('Invitation revoked successfully!');
      fetchInvitations();
      fetchStats();
    } catch (error) {
      console.error('Error revoking invitation:', error);
      alert('Failed to revoke invitation');
    }
  };

  const handleBulkResend = async () => {
    if (!confirm(`Are you sure you want to resend ${selectedIds.length} invitation(s)?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/invitations/bulk-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'resend',
          invitationIds: selectedIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to resend invitations');
      }

      const data = await response.json();
      alert(data.message);
      setSelectedIds([]);
      fetchInvitations();
      fetchStats();
    } catch (error) {
      console.error('Error resending invitations:', error);
      alert('Failed to resend invitations');
    }
  };

  const handleBulkRevoke = async () => {
    if (!confirm(`Are you sure you want to revoke ${selectedIds.length} invitation(s)?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/invitations/bulk-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'revoke',
          invitationIds: selectedIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to revoke invitations');
      }

      const data = await response.json();
      alert(data.message);
      setSelectedIds([]);
      fetchInvitations();
      fetchStats();
    } catch (error) {
      console.error('Error revoking invitations:', error);
      alert('Failed to revoke invitations');
    }
  };

  const handleViewDetails = (id: string) => {
    setSelectedInvitationId(id);
    setDetailModalOpen(true);
  };

  const handleCreateSuccess = () => {
    fetchInvitations();
    fetchStats();
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div>
      <Header
        title="Invitations"
        description="Manage user invitations across all organizations"
        action={
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Send Invitation
          </Button>
        }
      />

      <div className="p-4 md:p-8 space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                  <p className="text-sm text-gray-600 mt-1">Pending</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{stats.accepted}</p>
                  <p className="text-sm text-gray-600 mt-1">Accepted</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">{stats.expired}</p>
                  <p className="text-sm text-gray-600 mt-1">Expired</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-600">{stats.total}</p>
                  <p className="text-sm text-gray-600 mt-1">Total</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search by email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'ACCEPTED', label: 'Accepted' },
                  { value: 'EXPIRED', label: 'Expired' },
                  { value: 'REVOKED', label: 'Revoked' },
                ]}
              />

              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Roles' },
                  { value: 'ADMIN', label: 'Admin' },
                  { value: 'USER', label: 'User' },
                  { value: 'ACCOUNTANT', label: 'Accountant' },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Invitations Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              All Invitations
              {!loading && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({totalCount} total)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InvitationTable
              invitations={invitations}
              selectedIds={selectedIds}
              onSelectAll={handleSelectAll}
              onSelectOne={handleSelectOne}
              onResend={handleResend}
              onRevoke={handleRevoke}
              onViewDetails={handleViewDetails}
              loading={loading}
            />

            {/* Pagination */}
            {!loading && invitations.length > 0 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {currentPage * limit + 1} to {Math.min((currentPage + 1) * limit, totalCount)} of {totalCount} invitations
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={!hasMore}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <CreateInvitationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      <InvitationDetailModal
        invitationId={selectedInvitationId}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onResend={handleResend}
        onRevoke={handleRevoke}
      />

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        onResendAll={handleBulkResend}
        onRevokeAll={handleBulkRevoke}
        onClearSelection={handleClearSelection}
      />
    </div>
  );
}
