'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { Role } from '@invoice-app/database';

const userFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters').optional().or(z.literal('')),
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'USER', 'ACCOUNTANT']),
  organizationId: z.string().nullable(),
  isActive: z.boolean(),
});

export type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
  initialData?: Partial<UserFormData>;
  organizations: { id: string; name: string }[];
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
}

export function UserForm({
  initialData,
  organizations,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'edit',
}: UserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      role: initialData?.role || 'USER',
      organizationId: initialData?.organizationId || null,
      isActive: initialData?.isActive ?? true,
    },
  });

  const role = watch('role');
  const isActive = watch('isActive');

  const onSubmitForm = async (data: UserFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          {...register('name')}
          error={errors.name?.message}
          placeholder="John Doe"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email" required>
          Email
        </Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          error={errors.email?.message}
          placeholder="john@example.com"
          disabled={mode === 'edit'}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
        {mode === 'edit' && (
          <p className="mt-1 text-xs text-gray-500">
            Email cannot be changed after user creation
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="role" required>
          Role
        </Label>
        <Select
          id="role"
          {...register('role')}
          options={[
            { value: 'USER', label: 'User - Regular user access' },
            { value: 'ACCOUNTANT', label: 'Accountant - Financial access' },
            { value: 'ADMIN', label: 'Admin - Full system access' },
          ]}
          error={errors.role?.message}
        />
        {errors.role && (
          <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {role === 'ADMIN' && 'Admin users have full access to all features'}
          {role === 'ACCOUNTANT' && 'Accountants can view and manage financial data'}
          {role === 'USER' && 'Users have basic access to create and manage their own data'}
        </p>
      </div>

      <div>
        <Label htmlFor="organizationId">Organization</Label>
        <Select
          id="organizationId"
          {...register('organizationId')}
          options={[
            { value: '', label: 'No organization' },
            ...organizations.map((org) => ({
              value: org.id,
              label: org.name,
            })),
          ]}
          error={errors.organizationId?.message}
        />
        {errors.organizationId && (
          <p className="mt-1 text-sm text-red-600">
            {errors.organizationId.message}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Users can only access data within their organization
        </p>
      </div>

      <div>
        <Checkbox
          id="isActive"
          {...register('isActive')}
          label="Active Account"
          checked={isActive}
        />
        <p className="mt-1 text-xs text-gray-500 ml-6">
          Inactive users cannot log in or access the system
        </p>
      </div>

      {mode === 'edit' && !isActive && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Warning:</strong> Deactivating this user will immediately revoke
            their access to the system.
          </p>
        </div>
      )}

      {mode === 'edit' && role === 'ADMIN' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-800">
            <strong>Note:</strong> Admin users have unrestricted access to all
            features and data.
          </p>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading || !isDirty}
        >
          {isLoading ? 'Saving...' : mode === 'create' ? 'Create User' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
