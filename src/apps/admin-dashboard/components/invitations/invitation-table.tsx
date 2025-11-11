'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InvitationStatusBadge } from './invitation-status-badge';
import { Mail, MoreHorizontal, Send, Ban, Eye, Copy, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

interface InvitationTableProps {
  invitations: Invitation[];
  selectedIds: string[];
  onSelectAll: (selected: boolean) => void;
  onSelectOne: (id: string, selected: boolean) => void;
  onResend: (id: string) => void;
  onRevoke: (id: string) => void;
  onViewDetails: (id: string) => void;
  loading?: boolean;
}

export function InvitationTable({
  invitations,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onResend,
  onRevoke,
  onViewDetails,
  loading = false,
}: InvitationTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const allSelected = invitations.length > 0 && selectedIds.length === invitations.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < invitations.length;

  const handleSelectAll = () => {
    onSelectAll(!allSelected);
  };

  const handleSelectOne = (id: string) => {
    onSelectOne(id, !selectedIds.includes(id));
  };

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleAction = (action: () => void) => {
    action();
    setOpenMenuId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No invitations found</h3>
        <p className="text-sm text-gray-500">
          Try adjusting your search or filter criteria
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left py-3 px-4 w-12">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) {
                    input.indeterminate = someSelected;
                  }
                }}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Email</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Organization</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Role</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Status</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Invited By</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Invited At</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Expires At</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm w-20">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invitations.map((invitation) => (
            <tr
              key={invitation.id}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td className="py-4 px-4">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(invitation.id)}
                  onChange={() => handleSelectOne(invitation.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-medium text-gray-900 text-sm">{invitation.email}</span>
                </div>
              </td>
              <td className="py-4 px-4 text-sm text-gray-600">
                {invitation.organization.name}
              </td>
              <td className="py-4 px-4">
                <Badge variant="info" className="text-xs">
                  {invitation.role}
                </Badge>
              </td>
              <td className="py-4 px-4">
                <InvitationStatusBadge
                  status={invitation.status}
                  expiresAt={invitation.expiresAt}
                />
              </td>
              <td className="py-4 px-4 text-sm text-gray-600">
                <div>
                  <div className="font-medium">{invitation.inviter.name || 'Unknown'}</div>
                  <div className="text-xs text-gray-500">{invitation.inviter.email}</div>
                </div>
              </td>
              <td className="py-4 px-4 text-sm text-gray-600">
                <div>
                  <div>{new Date(invitation.invitedAt).toLocaleDateString()}</div>
                  <div className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(invitation.invitedAt), { addSuffix: true })}
                  </div>
                </div>
              </td>
              <td className="py-4 px-4 text-sm text-gray-600">
                <div>
                  <div>{new Date(invitation.expiresAt).toLocaleDateString()}</div>
                  <div className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })}
                  </div>
                </div>
              </td>
              <td className="py-4 px-4 text-right">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleMenu(invitation.id)}
                    className="p-1"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>

                  {openMenuId === invitation.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenuId(null)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                        <div className="py-1">
                          <button
                            onClick={() => handleAction(() => onViewDetails(invitation.id))}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                          {(invitation.status === 'PENDING' || invitation.status === 'EXPIRED') && (
                            <button
                              onClick={() => handleAction(() => onResend(invitation.id))}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Send className="w-4 h-4" />
                              Resend
                            </button>
                          )}
                          {invitation.status === 'PENDING' && (
                            <button
                              onClick={() => handleAction(() => onRevoke(invitation.id))}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Ban className="w-4 h-4" />
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
