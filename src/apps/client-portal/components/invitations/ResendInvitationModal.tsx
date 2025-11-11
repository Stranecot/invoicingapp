'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Mail } from 'lucide-react';

interface ResendInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invitation: {
    id: string;
    email: string;
    expiresAt: string;
  };
}

export function ResendInvitationModal({
  isOpen,
  onClose,
  onSuccess,
  invitation,
}: ResendInvitationModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResend = async () => {
    setError(null);

    try {
      setSubmitting(true);
      const response = await fetch(`/api/invitations/${invitation.id}/resend`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to resend invitation');
        return;
      }

      setSuccess(true);

      // Close modal and refresh list after showing success
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Error resending invitation:', error);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (success) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Invitation Resent">
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900">
              Invitation resent successfully!
            </p>
            <p className="text-sm text-green-700 mt-1">
              A new invitation email has been sent to {invitation.email} with a fresh link
              that will expire in 7 days.
            </p>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Resend Invitation">
      <div className="space-y-4">
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-900">{error}</p>
          </div>
        )}

        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              Resend invitation to {invitation.email}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              This will generate a new invitation token and extend the expiry date.
              The old invitation link will be invalidated.
            </p>
            {invitation.expiresAt && (
              <p className="text-xs text-blue-600 mt-2">
                Current expiry: {formatDate(invitation.expiresAt)}
              </p>
            )}
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
          <Button onClick={handleResend} disabled={submitting}>
            {submitting ? 'Resending...' : 'Resend Invitation'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
