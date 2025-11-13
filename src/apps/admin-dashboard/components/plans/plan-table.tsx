'use client';

import { Edit, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  maxUsers: number;
  maxInvoices: number;
  maxCustomers: number;
  maxExpenses: number;
  features: string[];
  isActive: boolean;
  isPublic: boolean;
  sortOrder: number;
  _count: {
    organizations: number;
  };
}

interface PlanTableProps {
  plans: Plan[];
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

export function PlanTable({ plans, onDelete, onToggleActive }: PlanTableProps) {
  const formatLimit = (value: number) => {
    return value === -1 ? 'Unlimited' : value.toLocaleString();
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Plan</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Price</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Limits</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Organizations</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {plans.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-8 text-gray-500">
                No plans found
              </td>
            </tr>
          ) : (
            plans.map((plan) => (
              <tr key={plan.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-4">
                  <Link href={`/plans/${plan.id}`} className="hover:underline">
                    <div>
                      <p className="font-medium text-gray-900">{plan.name}</p>
                      <p className="text-sm text-gray-500">{plan.description || 'No description'}</p>
                    </div>
                  </Link>
                </td>
                <td className="py-4 px-4">
                  <p className="font-medium text-gray-900">
                    {plan.price === 0 ? 'Free' : `${plan.currency} ${plan.price.toFixed(2)}`}
                  </p>
                  <p className="text-xs text-gray-500">/month</p>
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 w-20">Users:</span>
                      <span className="font-medium">{formatLimit(plan.maxUsers)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 w-20">Invoices:</span>
                      <span className="font-medium">{formatLimit(plan.maxInvoices)}</span>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <Badge variant="default">{plan._count.organizations}</Badge>
                </td>
                <td className="py-4 px-4">
                  <div className="flex flex-col gap-1">
                    <Badge variant={plan.isActive ? 'success' : 'danger'}>
                      {plan.isActive ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                    {plan.isPublic && (
                      <Badge variant="secondary" className="text-xs">
                        Public
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onToggleActive(plan.id, !plan.isActive)}
                      title={plan.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {plan.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </Button>
                    <Link href={`/plans/${plan.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (plan._count.organizations > 0) {
                          alert(`Cannot delete plan with ${plan._count.organizations} organization(s). Migrate them first.`);
                          return;
                        }
                        if (confirm(`Are you sure you want to delete the "${plan.name}" plan?`)) {
                          onDelete(plan.id);
                        }
                      }}
                      disabled={plan._count.organizations > 0}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
