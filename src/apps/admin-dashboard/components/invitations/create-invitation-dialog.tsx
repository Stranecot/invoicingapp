'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface CreateInvitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateInvitationDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateInvitationDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'OWNER' | 'ACCOUNTANT'>('OWNER');
  const [organizationId, setOrganizationId] = useState('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Fetch organizations when dialog opens
  useEffect(() => {
    if (open) {
      fetchOrganizations();
      // Reset form
      setEmail('');
      setRole('OWNER');
      setOrganizationId('');
      setError('');
      setSuccess(false);
    }
  }, [open]);

  const fetchOrganizations = async () => {
    setLoadingOrgs(true);
    try {
      const response = await fetch('/api/admin/organizations?limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }
      const data = await response.json();
      setOrganizations(data.organizations || []);
      if (data.organizations && data.organizations.length > 0) {
        setOrganizationId(data.organizations[0].id);
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError('Failed to load organizations');
    } finally {
      setLoadingOrgs(false);
    }
  };

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

    if (!organizationId) {
      setError('Please select an organization');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          role,
          organizationId,
          customerIds: [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create invitation');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      console.error('Error creating invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to create invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader onClose={() => onOpenChange(false)}>
          <DialogTitle>Send Invitation</DialogTitle>
          <DialogDescription>
            Invite a new user to join an organization. They will receive an email with a link to accept the invitation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody>
            <div className="space-y-4">
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
                    Invitation created successfully! Redirecting...
                  </p>
                </div>
              )}

              <Input
                label="Email Address"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || success}
              />

              <Select
                label="Organization"
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                options={[
                  { value: '', label: loadingOrgs ? 'Loading organizations...' : 'Select an organization' },
                  ...organizations.map((org) => ({
                    value: org.id,
                    label: org.name,
                  })),
                ]}
                required
                disabled={loading || loadingOrgs || success}
              />

              <Select
                label="Role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'ADMIN' | 'OWNER' | 'ACCOUNTANT')}
                options={[
                  { value: 'OWNER', label: 'Owner - Organization owner (can invite employees)' },
                  { value: 'ACCOUNTANT', label: 'Accountant - Financial access' },
                  { value: 'ADMIN', label: 'Admin - Platform admin' },
                ]}
                required
                disabled={loading || success}
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> The invitation will expire in 7 days. The user will receive an email with instructions to accept the invitation.
                </p>
              </div>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading || success}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || success || !organizationId}
            >
              {loading ? 'Sending...' : success ? 'Success!' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
