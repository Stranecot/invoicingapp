'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { CopyInvitationLinkButton } from './CopyInvitationLinkButton';

interface CreateInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface InvitationCreatedData {
  id: string;
  email: string;
  role: string;
  invitationLink?: string;
}

export function CreateInvitationModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateInvitationModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    role: 'USER' as 'ADMIN' | 'USER' | 'ACCOUNTANT',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdInvitation, setCreatedInvitation] = useState<InvitationCreatedData | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailError(null);

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError(data.error || 'A user or invitation with this email already exists');
        } else if (response.status === 403) {
          setError('You do not have permission to create invitations');
        } else {
          setError(data.error || 'Failed to create invitation');
        }
        return;
      }

      // Show success with invitation link
      setCreatedInvitation({
        id: data.id,
        email: data.email,
        role: data.role,
      });

      // Reset form
      setFormData({ email: '', role: 'USER' });

      // Call onSuccess to refresh the list
      onSuccess();
    } catch (error) {
      console.error('Error creating invitation:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ email: '', role: 'USER' });
    setError(null);
    setEmailError(null);
    setCreatedInvitation(null);
    onClose();
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, email: e.target.value });
    setEmailError(null);
    setError(null);
  };

  // Show success view if invitation was created
  if (createdInvitation) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Invitation Sent Successfully">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">
                Invitation sent to {createdInvitation.email}
              </p>
              <p className="text-sm text-green-700 mt-1">
                An invitation email has been sent with instructions to accept.
                The invitation will expire in 7 days.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">
              Invitation Link
            </label>
            <p className="text-sm text-gray-600 mb-2">
              You can also copy and share this link manually:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/accept-invitation?token=[secure-token]`}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClose}
              >
                Done
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Note: The actual secure token is sent via email to the recipient.
            </p>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite User">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-900">{error}</p>
          </div>
        )}

        <div>
          <Input
            label="Email Address"
            type="email"
            required
            value={formData.email}
            onChange={handleEmailChange}
            placeholder="user@example.com"
            disabled={submitting}
          />
          {emailError && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {emailError}
            </p>
          )}
          <p className="text-sm text-gray-600 mt-1">
            The user will receive an email with instructions to join your organization.
          </p>
        </div>

        <div>
          <Select
            label="Role"
            required
            value={formData.role}
            onChange={(e) =>
              setFormData({
                ...formData,
                role: e.target.value as 'ADMIN' | 'USER' | 'ACCOUNTANT',
              })
            }
            disabled={submitting}
          >
            <option value="USER">User - Can create and manage their own invoices</option>
            <option value="ACCOUNTANT">Accountant - Can view and manage all invoices</option>
            <option value="ADMIN">Admin - Full access to all features and settings</option>
          </Select>
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
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Sending Invitation...' : 'Send Invitation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
