'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const planSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  slug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .max(100, 'Slug must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens only'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be at least 0'),
  currency: z.string().min(3).max(3),
  maxUsers: z.number().min(1, 'Must allow at least 1 user').max(1000000, 'Maximum 1,000,000 users'),
  maxInvoices: z.number().min(-1, 'Use -1 for unlimited'),
  maxCustomers: z.number().min(-1, 'Use -1 for unlimited'),
  maxExpenses: z.number().min(-1, 'Use -1 for unlimited'),
  features: z.array(z.string()),
  isActive: z.boolean(),
  isPublic: z.boolean(),
  sortOrder: z.number(),
});

export type PlanFormData = z.infer<typeof planSchema>;

interface PlanFormProps {
  defaultValues?: Partial<PlanFormData>;
  onSubmit: (data: PlanFormData) => void | Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}

export function PlanForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Save',
  onCancel,
}: PlanFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      price: 0,
      currency: 'USD',
      maxUsers: 5,
      maxInvoices: 100,
      maxCustomers: 100,
      maxExpenses: 500,
      features: [],
      isActive: true,
      isPublic: true,
      sortOrder: 0,
      ...defaultValues,
    },
  });

  const name = watch('name');
  const features = watch('features');
  const [featureInput, setFeatureInput] = useState('');

  // Auto-generate slug from name if creating new plan
  useEffect(() => {
    if (!defaultValues?.slug && name) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setValue('slug', slug);
    }
  }, [name, defaultValues?.slug, setValue]);

  const addFeature = () => {
    if (featureInput.trim()) {
      const newFeatures = [...features, featureInput.trim()];
      setValue('features', newFeatures);
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    const newFeatures = features.filter((_, i) => i !== index);
    setValue('features', newFeatures);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name" required>Plan Name</Label>
        <Input
          id="name"
          {...register('name')}
          error={errors.name?.message}
          placeholder="Pro"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="slug" required>Slug</Label>
        <Input
          id="slug"
          {...register('slug')}
          error={errors.slug?.message}
          placeholder="pro"
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">
          URL-friendly identifier (lowercase, alphanumeric, hyphens)
        </p>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          error={errors.description?.message}
          placeholder="For growing businesses"
          className="mt-1"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price" required>Price</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            {...register('price', { valueAsNumber: true })}
            error={errors.price?.message}
            placeholder="29.00"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="currency" required>Currency</Label>
          <Input
            id="currency"
            {...register('currency')}
            error={errors.currency?.message}
            placeholder="USD"
            maxLength={3}
            className="mt-1"
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold text-gray-900 mb-3">Plan Limits</h3>
        <p className="text-xs text-gray-500 mb-3">Use -1 for unlimited</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="maxUsers" required>Max Users</Label>
            <Input
              id="maxUsers"
              type="number"
              {...register('maxUsers', { valueAsNumber: true })}
              error={errors.maxUsers?.message}
              placeholder="5"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="maxInvoices" required>Max Invoices</Label>
            <Input
              id="maxInvoices"
              type="number"
              {...register('maxInvoices', { valueAsNumber: true })}
              error={errors.maxInvoices?.message}
              placeholder="100 or -1 for unlimited"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="maxCustomers" required>Max Customers</Label>
            <Input
              id="maxCustomers"
              type="number"
              {...register('maxCustomers', { valueAsNumber: true })}
              error={errors.maxCustomers?.message}
              placeholder="100 or -1 for unlimited"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="maxExpenses" required>Max Expenses</Label>
            <Input
              id="maxExpenses"
              type="number"
              {...register('maxExpenses', { valueAsNumber: true })}
              error={errors.maxExpenses?.message}
              placeholder="500 or -1 for unlimited"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <Label>Features</Label>
        <div className="mt-2 flex gap-2">
          <Input
            value={featureInput}
            onChange={(e) => setFeatureInput(e.target.value)}
            placeholder="e.g., advanced_reports"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addFeature();
              }
            }}
          />
          <Button type="button" onClick={addFeature} variant="outline">
            Add
          </Button>
        </div>
        {features.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {features.map((feature, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {feature}
                <button
                  type="button"
                  onClick={() => removeFeature(index)}
                  className="hover:text-blue-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="border-t pt-4 space-y-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isActive"
            {...register('isActive')}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <Label htmlFor="isActive" className="mb-0">Is Active</Label>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isPublic"
            {...register('isPublic')}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <Label htmlFor="isPublic" className="mb-0">Show on public pricing page</Label>
        </div>
      </div>

      <div>
        <Label htmlFor="sortOrder">Sort Order</Label>
        <Input
          id="sortOrder"
          type="number"
          {...register('sortOrder', { valueAsNumber: true })}
          error={errors.sortOrder?.message}
          placeholder="0"
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">
          Lower numbers appear first
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t">
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
