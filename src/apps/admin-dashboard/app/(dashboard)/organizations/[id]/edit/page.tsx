'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrganizationForm, OrganizationFormData } from '@/components/organizations/organization-form';
import { OrganizationSettingsForm, OrganizationSettingsFormData } from '@/components/organizations/organization-settings-form';
import { Organization, OrganizationSettings } from '@invoice-app/database';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface OrganizationEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface OrganizationWithSettings extends Organization {
  settings: OrganizationSettings | null;
}

export default function OrganizationEditPage({ params }: OrganizationEditPageProps) {
  const router = useRouter();
  const [orgId, setOrgId] = useState<string>('');
  const [organization, setOrganization] = useState<OrganizationWithSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingSettings, setIsSubmittingSettings] = useState(false);

  useEffect(() => {
    params.then(p => setOrgId(p.id));
  }, [params]);

  useEffect(() => {
    if (orgId) {
      fetchOrganization();
    }
  }, [orgId]);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/organizations/${orgId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch organization');
      }

      const data = await response.json();
      setOrganization(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOrganization = async (data: OrganizationFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/organizations/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update organization');
      }

      // Redirect to detail page
      router.push(`/organizations/${orgId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitSettings = async (data: OrganizationSettingsFormData) => {
    setIsSubmittingSettings(true);

    try {
      // Update organization settings via the organization API
      const response = await fetch(`/api/admin/organizations/${orgId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update settings');
      }

      // Refresh organization data
      await fetchOrganization();
      alert('Settings updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmittingSettings(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Header title="Edit Organization" description="Loading..." />
        <div className="p-4 md:p-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading organization...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !organization) {
    return (
      <div>
        <Header title="Edit Organization" description="Error" />
        <div className="p-4 md:p-8">
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-red-600">{error}</p>
                <Link href="/organizations">
                  <Button variant="outline" className="mt-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Organizations
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!organization) {
    return null;
  }

  return (
    <div>
      <Header
        title={`Edit ${organization.name}`}
        description="Update organization details and settings"
        action={
          <Link href={`/organizations/${organization.id}`}>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Details
            </Button>
          </Link>
        }
      />

      <div className="p-4 md:p-8 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Organization Details */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
          </CardHeader>
          <CardContent>
            <OrganizationForm
              defaultValues={{
                name: organization.name,
                slug: organization.slug,
                billingEmail: organization.billingEmail,
                plan: organization.plan,
                status: organization.status,
                maxUsers: organization.maxUsers,
              }}
              onSubmit={handleSubmitOrganization}
              isSubmitting={isSubmitting}
              submitLabel="Update Organization"
              onCancel={() => router.push(`/organizations/${organization.id}`)}
            />
          </CardContent>
        </Card>

        {/* Organization Settings */}
        {organization.settings && (
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <OrganizationSettingsForm
                defaultValues={{
                  primaryColor: organization.settings.primaryColor || '#3B82F6',
                  logoUrl: organization.settings.logoUrl || '',
                  companyName: organization.settings.companyName || '',
                  invoicePrefix: organization.settings.invoicePrefix,
                  taxRate: organization.settings.taxRate,
                  currency: organization.settings.currency,
                }}
                onSubmit={handleSubmitSettings}
                isSubmitting={isSubmittingSettings}
                onCancel={() => router.push(`/organizations/${organization.id}`)}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
