'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { PlanForm, PlanFormData } from '@/components/plans/plan-form';

export default function EditPlanPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanFormData | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const response = await fetch(`/api/admin/plans/${planId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch plan');
        }
        const data = await response.json();
        setPlan(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load plan');
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [planId]);

  const handleSubmit = async (data: PlanFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to update plan');
      }

      router.push(`/plans/${planId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Header title="Edit Plan" description="Loading..." />
        <div className="p-4 md:p-8">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-500">Loading plan...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error && !plan) {
    return (
      <div>
        <Header title="Edit Plan" description="Error loading plan" />
        <div className="p-4 md:p-8">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-red-600">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Edit Plan"
        description={`Update subscription plan: ${plan?.name || ''}`}
      />

      <div className="p-4 md:p-8">
        <Card>
          <CardContent className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {plan && (
              <PlanForm
                defaultValues={plan}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                submitLabel="Update Plan"
                onCancel={() => router.push(`/plans/${planId}`)}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
