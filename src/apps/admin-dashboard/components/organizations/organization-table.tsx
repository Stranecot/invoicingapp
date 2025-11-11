'use client';

import { useState } from 'react';
import { Organization } from '@invoice-app/database';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { OrganizationStatusBadge } from './organization-status-badge';
import { OrganizationPlanBadge } from './organization-plan-badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Eye, Edit, Ban, CheckCircle, Trash2, Building2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

interface OrganizationWithCounts extends Organization {
  _count?: {
    users: number;
  };
}

interface OrganizationTableProps {
  organizations: OrganizationWithCounts[];
  onStatusChange?: (id: string, status: string) => void;
  onDelete?: (id: string) => void;
}

export function OrganizationTable({ organizations, onStatusChange, onDelete }: OrganizationTableProps) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'users'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (column: 'name' | 'createdAt' | 'users') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const sortedOrganizations = [...organizations].sort((a, b) => {
    let compareValue = 0;

    if (sortBy === 'name') {
      compareValue = a.name.localeCompare(b.name);
    } else if (sortBy === 'createdAt') {
      compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === 'users') {
      compareValue = (a._count?.users || 0) - (b._count?.users || 0);
    }

    return sortOrder === 'asc' ? compareValue : -compareValue;
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead sortable onClick={() => handleSort('name')}>
            <div className="flex items-center gap-2">
              Organization
              {sortBy === 'name' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
            </div>
          </TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead sortable onClick={() => handleSort('users')}>
            <div className="flex items-center gap-2">
              Users
              {sortBy === 'users' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
            </div>
          </TableHead>
          <TableHead sortable onClick={() => handleSort('createdAt')}>
            <div className="flex items-center gap-2">
              Created
              {sortBy === 'createdAt' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
            </div>
          </TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedOrganizations.map((org) => (
          <TableRow key={org.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{org.name}</p>
                  <p className="text-sm text-gray-500">{org.billingEmail}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">{org.slug}</code>
            </TableCell>
            <TableCell>
              <OrganizationStatusBadge status={org.status} />
            </TableCell>
            <TableCell>
              <OrganizationPlanBadge plan={org.plan} />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span>{org._count?.users || 0} / {org.maxUsers}</span>
              </div>
            </TableCell>
            <TableCell className="text-gray-600 text-sm">
              {formatDistanceToNow(new Date(org.createdAt), { addSuffix: true })}
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/organizations/${org.id}`)}>
                    <Eye className="w-4 h-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(`/organizations/${org.id}/edit`)}>
                    <Edit className="w-4 h-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {org.status === 'ACTIVE' ? (
                    <DropdownMenuItem onClick={() => onStatusChange?.(org.id, 'SUSPENDED')}>
                      <Ban className="w-4 h-4" />
                      Suspend
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => onStatusChange?.(org.id, 'ACTIVE')}>
                      <CheckCircle className="w-4 h-4" />
                      Activate
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem destructive onClick={() => onDelete?.(org.id)}>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
