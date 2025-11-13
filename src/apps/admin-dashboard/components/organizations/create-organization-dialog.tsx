'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from '@/components/ui/dialog';
import { OrganizationForm, OrganizationFormData } from './organization-form';
import { useRouter } from 'next/navigation';

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateOrganizationDialog({ open, onOpenChange, onSuccess }: CreateOrganizationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (data: OrganizationFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create organization');
      }

      const result = await response.json();

      // Close dialog and refresh the list
      onOpenChange(false);

      // Call the onSuccess callback to refresh the list
      if (onSuccess) {
        onSuccess();
      }

      // Optionally navigate to the new organization
      // router.push(`/organizations/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader onClose={() => onOpenChange(false)}>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>
            Add a new organization to the system
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
          <OrganizationForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitLabel="Create Organization"
            onCancel={() => onOpenChange(false)}
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
