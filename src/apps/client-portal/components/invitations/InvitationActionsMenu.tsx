'use client';

import React, { useState } from 'react';
import { MoreVertical, Send, Ban, Trash2, Copy, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResendInvitationModal } from './ResendInvitationModal';
import { RevokeInvitationModal } from './RevokeInvitationModal';
import { CopyInvitationLinkButton } from './CopyInvitationLinkButton';

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  acceptedBy?: string;
}

interface InvitationActionsMenuProps {
  invitation: Invitation;
  onRefresh: () => void;
}

export function InvitationActionsMenu({
  invitation,
  onRefresh,
}: InvitationActionsMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [resendModalOpen, setResendModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this invitation? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`/api/invitations/${invitation.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to delete invitation');
        return;
      }

      onRefresh();
      setMenuOpen(false);
    } catch (error) {
      console.error('Error deleting invitation:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleViewUser = () => {
    if (invitation.acceptedBy) {
      // Navigate to user profile page
      window.location.href = `/users/${invitation.acceptedBy}`;
    }
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);

  // Actions based on status
  const canResend = invitation.status === 'PENDING' || invitation.status === 'EXPIRED';
  const canRevoke = invitation.status === 'PENDING';
  const canCopyLink = invitation.status === 'PENDING';
  const canDelete = invitation.status === 'PENDING';
  const canViewUser = invitation.status === 'ACCEPTED' && invitation.acceptedBy;

  return (
    <div className="relative inline-block">
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleMenu}
        title="Actions"
        aria-label="Open actions menu"
      >
        <MoreVertical className="w-4 h-4" />
      </Button>

      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setMenuOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="py-1">
              {canResend && (
                <button
                  onClick={() => {
                    setResendModalOpen(true);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Resend Invitation
                </button>
              )}

              {canCopyLink && (
                <button
                  onClick={() => {
                    // Trigger copy action - this would need the token
                    // For now, just close menu as CopyInvitationLinkButton handles this
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 flex items-center gap-2"
                  disabled
                  title="Copy link from the main table"
                >
                  <Copy className="w-4 h-4" />
                  Copy Link
                </button>
              )}

              {canRevoke && (
                <button
                  onClick={() => {
                    setRevokeModalOpen(true);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Ban className="w-4 h-4" />
                  Revoke Invitation
                </button>
              )}

              {canViewUser && (
                <button
                  onClick={handleViewUser}
                  className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  View User Profile
                </button>
              )}

              {(canResend || canRevoke || canViewUser) && canDelete && (
                <div className="border-t border-gray-200 my-1" />
              )}

              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? 'Deleting...' : 'Delete Invitation'}
                </button>
              )}

              {!canResend && !canRevoke && !canDelete && !canViewUser && (
                <div className="px-4 py-2 text-sm text-gray-500 italic">
                  No actions available
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <ResendInvitationModal
        isOpen={resendModalOpen}
        onClose={() => setResendModalOpen(false)}
        onSuccess={onRefresh}
        invitation={invitation}
      />

      <RevokeInvitationModal
        isOpen={revokeModalOpen}
        onClose={() => setRevokeModalOpen(false)}
        onSuccess={onRefresh}
        invitation={invitation}
      />
    </div>
  );
}
