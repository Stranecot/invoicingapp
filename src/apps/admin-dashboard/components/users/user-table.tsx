'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { UserAvatar } from './user-avatar';
import { UserRoleBadge } from './user-role-badge';
import { UserStatusBadge } from './user-status-badge';
import {
  Search,
  MoreVertical,
  Eye,
  Edit,
  Power,
  PowerOff,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Role } from '@invoice-app/database';

export interface UserTableData {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  isActive: boolean;
  organizationId: string | null;
  organizationName?: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
}

interface UserTableProps {
  users: UserTableData[];
  organizations: { id: string; name: string }[];
  onSearch: (query: string) => void;
  onFilterRole: (role: Role | 'ALL') => void;
  onFilterOrganization: (orgId: string | 'ALL') => void;
  onFilterStatus: (status: 'active' | 'inactive' | 'ALL') => void;
  onSort: (field: string) => void;
  onPageChange: (page: number) => void;
  onToggleStatus: (userId: string) => void;
  currentPage: number;
  totalPages: number;
  sortField: string;
  sortOrder: 'asc' | 'desc';
}

export function UserTable({
  users,
  organizations,
  onSearch,
  onFilterRole,
  onFilterOrganization,
  onFilterStatus,
  onSort,
  onPageChange,
  onToggleStatus,
  currentPage,
  totalPages,
  sortField,
  sortOrder,
}: UserTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(users.map((u) => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return '↕';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          options={[
            { value: 'ALL', label: 'All Roles' },
            { value: 'ADMIN', label: 'Admin' },
            { value: 'USER', label: 'User' },
            { value: 'ACCOUNTANT', label: 'Accountant' },
          ]}
          onChange={(e) => onFilterRole(e.target.value as Role | 'ALL')}
          defaultValue="ALL"
        />

        <Select
          options={[
            { value: 'ALL', label: 'All Organizations' },
            ...organizations.map((org) => ({
              value: org.id,
              label: org.name,
            })),
          ]}
          onChange={(e) => onFilterOrganization(e.target.value)}
          defaultValue="ALL"
        />

        <Select
          options={[
            { value: 'ALL', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
          onChange={(e) =>
            onFilterStatus(e.target.value as 'active' | 'inactive' | 'ALL')
          }
          defaultValue="ALL"
        />
      </div>

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-blue-800">
            {selectedUsers.size} user(s) selected
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              Activate Selected
            </Button>
            <Button size="sm" variant="outline">
              Deactivate Selected
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    selectedUsers.size === users.length && users.length > 0
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </TableHead>
              <TableHead
                sortable
                sorted={sortField === 'name' ? sortOrder : false}
                onClick={() => onSort('name')}
              >
                User {getSortIcon('name')}
              </TableHead>
              <TableHead>Organization</TableHead>
              <TableHead
                sortable
                sorted={sortField === 'role' ? sortOrder : false}
                onClick={() => onSort('role')}
              >
                Role {getSortIcon('role')}
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead
                sortable
                sorted={sortField === 'lastLoginAt' ? sortOrder : false}
                onClick={() => onSort('lastLoginAt')}
              >
                Last Login {getSortIcon('lastLoginAt')}
              </TableHead>
              <TableHead
                sortable
                sorted={sortField === 'createdAt' ? sortOrder : false}
                onClick={() => onSort('createdAt')}
              >
                Created {getSortIcon('createdAt')}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.has(user.id)}
                      onChange={(e) =>
                        handleSelectUser(user.id, e.target.checked)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar name={user.name} size="sm" />
                      <div>
                        <Link
                          href={`/users/${user.id}`}
                          className="font-medium text-gray-900 hover:text-blue-600"
                        >
                          {user.name || 'Unnamed User'}
                        </Link>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {user.organizationName || (
                      <span className="text-gray-400 italic">No organization</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <UserRoleBadge role={user.role} />
                  </TableCell>
                  <TableCell>
                    <UserStatusBadge isActive={user.isActive} />
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {user.lastLoginAt ? (
                      formatDistanceToNow(new Date(user.lastLoginAt), {
                        addSuffix: true,
                      })
                    ) : (
                      <span className="text-gray-400 italic">Never</span>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {formatDistanceToNow(new Date(user.createdAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu
                      align="right"
                      trigger={
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      }
                    >
                      <DropdownMenuItem>
                        <Link
                          href={`/users/${user.id}`}
                          className="flex items-center gap-2 w-full"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link
                          href={`/users/${user.id}/edit`}
                          className="flex items-center gap-2 w-full"
                        >
                          <Edit className="w-4 h-4" />
                          Edit User
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onToggleStatus(user.id)}
                      >
                        {user.isActive ? (
                          <>
                            <PowerOff className="w-4 h-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Power className="w-4 h-4" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
