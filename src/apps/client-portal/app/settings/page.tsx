'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CountrySelect } from '@/components/ui/country-select';
import { useAuth } from '@/lib/auth-context';
import { getVATRatePercentage } from '@invoice-app/database';

interface OrganizationData {
  id?: string;
  name: string;
  billingEmail: string;
  phone: string;
  address: string;
  country: string;
  registrationNumber: string;
  isVatRegistered: boolean;
  vatId: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<OrganizationData>({
    name: '',
    billingEmail: '',
    phone: '',
    address: '',
    country: '',
    registrationNumber: '',
    isVatRegistered: false,
    vatId: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.organizationId) {
      fetchOrganization();
    }
  }, [user]);

  const fetchOrganization = async () => {
    try {
      const res = await fetch('/api/organizations/current');
      if (res.ok) {
        const data = await res.json();
        setFormData({
          name: data.name || '',
          billingEmail: data.billingEmail || '',
          phone: data.phone || '',
          address: data.address || '',
          country: data.country || '',
          registrationNumber: data.registrationNumber || '',
          isVatRegistered: data.isVatRegistered || false,
          vatId: data.vatId || '',
        });
        setError(null);
      } else {
        setError('Failed to load organization details');
      }
    } catch (error) {
      console.error('Failed to fetch organization:', error);
      setError('Failed to load organization details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/organizations/current', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert('Settings saved successfully!');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Organization Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Organization Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Billing Email"
              type="email"
              required
              value={formData.billingEmail}
              onChange={(e) => setFormData({ ...formData, billingEmail: e.target.value })}
            />
            <Input
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Textarea
              label="Address"
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country <span className="text-red-500">*</span>
              </label>
              <CountrySelect
                value={formData.country}
                onChange={(value) => setFormData({ ...formData, country: value })}
                required
                showTaxRate
              />
              {formData.country && (
                <p className="mt-1 text-xs text-gray-500">
                  Standard VAT rate: {getVATRatePercentage(formData.country)}%
                </p>
              )}
            </div>

            <Input
              label="Company Registration Number"
              placeholder="Enter company registration number"
              value={formData.registrationNumber}
              onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
            />

            {/* VAT Registration Section */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isVatRegistered"
                  checked={formData.isVatRegistered}
                  onChange={(e) => setFormData({
                    ...formData,
                    isVatRegistered: e.target.checked,
                    vatId: e.target.checked ? formData.vatId : ''
                  })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isVatRegistered" className="text-sm font-medium text-gray-700">
                  Company is VAT Registered
                </label>
              </div>

              {formData.isVatRegistered && (
                <Input
                  label="VAT ID"
                  placeholder="Enter VAT identification number"
                  required={formData.isVatRegistered}
                  value={formData.vatId}
                  onChange={(e) => setFormData({ ...formData, vatId: e.target.value })}
                />
              )}
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
