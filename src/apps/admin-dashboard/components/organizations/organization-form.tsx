'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BillingPlan, OrgStatus } from '@invoice-app/database';
import { useEffect, useState } from 'react';

const organizationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  slug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .max(100, 'Slug must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens only'),
  billingEmail: z.string().email('Invalid email address'),
  plan: z.nativeEnum(BillingPlan),
  planId: z.string().optional(), // New field for subscription plan
  status: z.nativeEnum(OrgStatus),
  maxUsers: z.number().min(1, 'Must allow at least 1 user').max(1000000, 'Maximum 1,000,000 users'),
});

export type OrganizationFormData = z.infer<typeof organizationSchema>;

interface OrganizationFormProps {
  defaultValues?: Partial<OrganizationFormData>;
  onSubmit: (data: OrganizationFormData) => void | Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}

export function OrganizationForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Save',
  onCancel,
}: OrganizationFormProps) {
  const [plans, setPlans] = useState<Array<{ id: string; name: string; maxUsers: number }>>([]);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
      slug: '',
      billingEmail: '',
      plan: BillingPlan.FREE,
      planId: '',
      status: OrgStatus.ACTIVE,
      maxUsers: 5,
      ...defaultValues,
    },
  });

  const name = watch('name');
  const planId = watch('planId');

  // Fetch subscription plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/admin/plans?isActive=true&limit=100');
        if (response.ok) {
          const data = await response.json();
          setPlans(data.plans || []);
        }
      } catch (error) {
        console.error('Failed to fetch plans:', error);
      }
    };
    fetchPlans();
  }, []);

  // Auto-generate slug from name if creating new organization
  useEffect(() => {
    if (!defaultValues?.slug && name) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setValue('slug', slug);
    }
  }, [name, defaultValues?.slug, setValue]);

  // Auto-update maxUsers when plan changes
  useEffect(() => {
    if (planId) {
      const selectedPlan = plans.find(p => p.id === planId);
      if (selectedPlan) {
        setValue('maxUsers', selectedPlan.maxUsers);
      }
    }
  }, [planId, plans, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name" required>Organization Name</Label>
        <Input
          id="name"
          {...register('name')}
          error={errors.name?.message}
          placeholder="Acme Corporation"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="slug" required>Slug</Label>
        <Input
          id="slug"
          {...register('slug')}
          error={errors.slug?.message}
          placeholder="acme-corporation"
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">
          URL-friendly identifier (lowercase, alphanumeric, hyphens)
        </p>
      </div>

      <div>
        <Label htmlFor="billingEmail" required>Billing Email</Label>
        <Input
          id="billingEmail"
          type="email"
          {...register('billingEmail')}
          error={errors.billingEmail?.message}
          placeholder="billing@acme.com"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="planId" required>Subscription Plan</Label>
        <Select
          id="planId"
          {...register('planId')}
          error={errors.planId?.message}
          className="mt-1"
          options={[
            { value: '', label: 'Select a plan...' },
            ...plans.map(p => ({ value: p.id, label: `${p.name} (${p.maxUsers === 999999 ? 'Unlimited' : p.maxUsers} users)` }))
          ]}
        />
        <p className="text-xs text-gray-500 mt-1">
          Selecting a plan will automatically set the max users limit
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="plan" required>Legacy Plan (for backward compatibility)</Label>
          <Select
            id="plan"
            {...register('plan')}
            error={errors.plan?.message}
            className="mt-1"
            options={[
              { value: BillingPlan.FREE, label: 'Free' },
              { value: BillingPlan.PRO, label: 'Pro' },
              { value: BillingPlan.ENTERPRISE, label: 'Enterprise' },
            ]}
          />
        </div>

        <div>
          <Label htmlFor="status" required>Status</Label>
          <Select
            id="status"
            {...register('status')}
            error={errors.status?.message}
            className="mt-1"
            options={[
              { value: OrgStatus.ACTIVE, label: 'Active' },
              { value: OrgStatus.TRIAL, label: 'Trial' },
              { value: OrgStatus.SUSPENDED, label: 'Suspended' },
              { value: OrgStatus.CANCELLED, label: 'Cancelled' },
            ]}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="maxUsers" required>Maximum Users</Label>
        <Input
          id="maxUsers"
          type="number"
          {...register('maxUsers', { valueAsNumber: true })}
          error={errors.maxUsers?.message}
          placeholder="5"
          className="mt-1"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
