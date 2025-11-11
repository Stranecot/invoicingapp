'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserForm, UserFormData } from '@/components/users/user-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

interface UserEditPageProps {
  params: Promise<{ id: string }>;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'USER' | 'ACCOUNTANT';
  isActive: boolean;
  organizationId: string | null;
}

interface Organization {
  id: string;
  name: string;
}

export default function UserEditPage({ params }: UserEditPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<UserFormData | null>(null);

  useEffect(() => {
    fetchUser();
    fetchOrganizations();
  }, [resolvedParams.id]);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/users/${resolvedParams.id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError('Failed to load user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/admin/organizations');
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
    }
  };

  const handleSubmit = async (data: UserFormData) => {
    // Check if this is a critical action
    const isCriticalChange =
      (user?.isActive && !data.isActive) || // Deactivating
      user?.role !== data.role || // Role change
      user?.organizationId !== data.organizationId; // Organization change

    if (isCriticalChange) {
      setPendingData(data);
      setShowConfirmDialog(true);
      return;
    }

    await saveUser(data);
  };

  const saveUser = async (data: UserFormData) => {
    try {
      setIsSaving(true);

      const response = await fetch(`/api/admin/users/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      // Success - redirect to user detail page
      router.push(`/users/${resolvedParams.id}`);
    } catch (err) {
      console.error('Error updating user:', err);
      alert(err instanceof Error ? err.message : 'Failed to update user. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmSave = async () => {
    if (pendingData) {
      setShowConfirmDialog(false);
      await saveUser(pendingData);
      setPendingData(null);
    }
  };

  const handleCancel = () => {
    router.push(`/users/${resolvedParams.id}`);
  };

  if (error) {
    return (
      <div>
        <Header title="Edit User" description="Update user information" />
        <div className="p-4 md:p-8">
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-red-600">
                <p>{error}</p>
                <Button onClick={fetchUser} className="mt-4" variant="outline">
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading || !user) {
    return (
      <div>
        <Header title="Edit User" description="Update user information" />
        <div className="p-4 md:p-8">
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-gray-500">Loading user...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Edit User"
        description={`Update information for ${user.name || user.email}`}
      />

      <div className="p-4 md:p-8">
        <div className="mb-4">
          <Link
            href={`/users/${resolvedParams.id}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to User Details
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <UserForm
              initialData={{
                name: user.name || '',
                email: user.email,
                role: user.role,
                organizationId: user.organizationId,
                isActive: user.isActive,
              }}
              organizations={organizations}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={isSaving}
              mode="edit"
            />
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onOpenChange={(open) => !open && setShowConfirmDialog(false)}
      >
        <DialogContent>
          <DialogHeader onClose={() => setShowConfirmDialog(false)}>
            <DialogTitle>Confirm Changes</DialogTitle>
            <DialogDescription>
              You are about to make critical changes to this user
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-3">
              {pendingData && user && (
                <>
                  {user.isActive && !pendingData.isActive && (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <p className="text-sm text-red-800 font-medium">
                        Deactivating User
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        The user will be immediately logged out and unable to
                        access the system.
                      </p>
                    </div>
                  )}

                  {user.role !== pendingData.role && (
                    <div className="bg-purple-50 border border-purple-200 rounded p-3">
                      <p className="text-sm text-purple-800 font-medium">
                        Changing Role
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        From <strong>{user.role}</strong> to{' '}
                        <strong>{pendingData.role}</strong>
                      </p>
                    </div>
                  )}

                  {user.organizationId !== pendingData.organizationId && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <p className="text-sm text-yellow-800 font-medium">
                        Changing Organization
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        The user may lose access to their current organization's
                        data.
                      </p>
                    </div>
                  )}
                </>
              )}

              <p className="text-sm text-gray-600 mt-4">
                Are you sure you want to proceed with these changes?
              </p>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setPendingData(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmSave}>
              Confirm Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
