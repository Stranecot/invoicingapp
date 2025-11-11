'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const settingsSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  logoUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  companyName: z.string().min(1).max(100).optional().or(z.literal('')),
  invoicePrefix: z.string().min(1).max(10),
  taxRate: z.number().min(0).max(100),
  currency: z.string().length(3, 'Currency code must be 3 characters'),
});

export type OrganizationSettingsFormData = z.infer<typeof settingsSchema>;

interface OrganizationSettingsFormProps {
  defaultValues?: Partial<OrganizationSettingsFormData>;
  onSubmit: (data: OrganizationSettingsFormData) => void | Promise<void>;
  isSubmitting?: boolean;
  onCancel?: () => void;
}

export function OrganizationSettingsForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  onCancel,
}: OrganizationSettingsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrganizationSettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      primaryColor: '#3B82F6',
      logoUrl: '',
      companyName: '',
      invoicePrefix: 'INV',
      taxRate: 0,
      currency: 'USD',
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="primaryColor">Primary Color</Label>
          <Input
            id="primaryColor"
            type="color"
            {...register('primaryColor')}
            error={errors.primaryColor?.message}
            className="mt-1 h-10"
          />
        </div>

        <div>
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input
            id="logoUrl"
            {...register('logoUrl')}
            error={errors.logoUrl?.message}
            placeholder="https://example.com/logo.png"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="companyName">Company Name</Label>
        <Input
          id="companyName"
          {...register('companyName')}
          error={errors.companyName?.message}
          placeholder="Company Name (optional)"
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
          <Input
            id="invoicePrefix"
            {...register('invoicePrefix')}
            error={errors.invoicePrefix?.message}
            placeholder="INV"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="taxRate">Tax Rate (%)</Label>
          <Input
            id="taxRate"
            type="number"
            step="0.01"
            {...register('taxRate', { valueAsNumber: true })}
            error={errors.taxRate?.message}
            placeholder="0"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            {...register('currency')}
            error={errors.currency?.message}
            placeholder="USD"
            className="mt-1"
            maxLength={3}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </form>
  );
}
