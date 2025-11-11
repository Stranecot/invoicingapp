'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Ban } from 'lucide-react';

interface RevokeInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invitation: {
    id: string;
    email: string;
    role: string;
  };
}

export function RevokeInvitationModal({
  isOpen,
  onClose,
  onSuccess,
  invitation,
}: RevokeInvitationModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRevoke = async () => {
    setError(null);

    try {
      setSubmitting(true);
      const response = await fetch(`/api/invitations/${invitation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REVOKED' }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to revoke invitation');
        return;
      }

      setSuccess(true);

      // Close modal and refresh list after showing success
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Error revoking invitation:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (success) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Invitation Revoked">
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900">
              Invitation revoked successfully!
            </p>
            <p className="text-sm text-green-700 mt-1">
              The invitation link for {invitation.email} has been revoked and can no longer be used.
            </p>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Revoke Invitation">
      <div className="space-y-4">
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-900">{error}</p>
          </div>
        )}

        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <Ban className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-900">
              Are you sure you want to revoke this invitation?
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              This will permanently invalidate the invitation link for:
            </p>
            <div className="mt-3 p-3 bg-white border border-yellow-200 rounded">
              <p className="text-sm font-medium text-gray-900">{invitation.email}</p>
              <p className="text-xs text-gray-600 mt-1">Role: {invitation.role}</p>
            </div>
            <p className="text-sm text-yellow-700 mt-3">
              The user will not be able to accept the invitation. If you want to invite
              this user again, you will need to create a new invitation.
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleRevoke}
            disabled={submitting}
          >
            {submitting ? 'Revoking...' : 'Revoke Invitation'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
