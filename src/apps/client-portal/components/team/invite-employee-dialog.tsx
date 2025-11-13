'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface InviteEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  remainingSlots: number;
}

export function InviteEmployeeDialog({
  open,
  onOpenChange,
  onSuccess,
  remainingSlots,
}: InviteEmployeeDialogProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!email) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          role: 'EMPLOYEE',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        // Reset form
        setEmail('');
        setSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('Error sending invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading && !success) {
      onOpenChange(newOpen);
      if (!newOpen) {
        // Reset form when closing
        setEmail('');
        setError('');
        setSuccess(false);
      }
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={() => handleOpenChange(false)}
      title="Invite Employee"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">
          Send an invitation to add a new employee to your team. They will receive an email with
          instructions to join.
        </p>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">
              Invitation sent successfully! Redirecting...
            </p>
          </div>
        )}

        <Input
          label="Employee Email Address"
          type="email"
          placeholder="employee@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading || success}
        />

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Remaining slots:</strong> {remainingSlots}
            <br />
            <strong>Note:</strong> The invitation will expire in 7 days. The employee will
            receive an email with instructions to accept the invitation.
          </p>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading || success}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading || success || remainingSlots <= 0}>
            {loading ? 'Sending...' : success ? 'Success!' : 'Send Invitation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
