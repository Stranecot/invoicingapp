'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { CountrySelect } from '@/components/ui/country-select';

interface Customer {
  id: string;
  type: 'ORGANIZATION' | 'PERSON';
  name: string;
  email: string;
  phone?: string;
  address?: string;
  country?: string;
  registrationNumber?: string;
  isBusiness?: boolean;
  vatNumber?: string;
  vatNumberValidated?: boolean;
}

function CustomersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    type: 'ORGANIZATION' as 'ORGANIZATION' | 'PERSON',
    name: '',
    email: '',
    phone: '',
    address: '',
    country: '',
    registrationNumber: '',
    isBusiness: true,
    vatNumber: '',
    vatNumberValidated: false,
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Check for action=new query parameter to open modal
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openNewCustomerModal();
      // Clear the query parameter
      router.replace('/customers');
    }
  }, [searchParams]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/customers');
      const data = await res.json();
      // Ensure data is an array before setting
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      if (editingCustomer) {
        await fetch(`/api/customers/${editingCustomer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      setIsModalOpen(false);
      setEditingCustomer(null);
      setFormData({ type: 'ORGANIZATION', name: '', email: '', phone: '', address: '', country: '', registrationNumber: '', isBusiness: true, vatNumber: '', vatNumberValidated: false });
      fetchCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Failed to save customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      type: customer.type || 'ORGANIZATION',
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      country: customer.country || '',
      registrationNumber: customer.registrationNumber || '',
      isBusiness: customer.isBusiness ?? true,
      vatNumber: customer.vatNumber || '',
      vatNumberValidated: customer.vatNumberValidated || false,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      try {
        setDeletingId(id);
        await fetch(`/api/customers/${id}`, { method: 'DELETE' });
        fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Failed to delete customer');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const openNewCustomerModal = () => {
    setEditingCustomer(null);
    setFormData({ type: 'ORGANIZATION', name: '', email: '', phone: '', address: '', country: '', registrationNumber: '', isBusiness: true, vatNumber: '', vatNumberValidated: false });
    setIsModalOpen(true);
  };

  // Handle customer type change
  const handleTypeChange = (newType: 'ORGANIZATION' | 'PERSON') => {
    setFormData({
      ...formData,
      type: newType,
      registrationNumber: newType === 'PERSON' ? '9999999999' : formData.registrationNumber,
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <Button onClick={openNewCustomerModal}>
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Add Customer</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-gray-600">Loading customers...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        <Button onClick={openNewCustomerModal}>
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Add Customer</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {customers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-gray-600">
                You don't have any customers yet. Click on '+ Add Customer' to add your first customer.
              </div>
            </CardContent>
          </Card>
        ) : (
          customers.map((customer) => (
            <Card key={customer.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">{customer.name}</h3>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(customer)}
                    disabled={deletingId === customer.id}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(customer.id)}
                    disabled={deletingId === customer.id}
                  >
                    {deletingId === customer.id ? (
                      <span className="text-xs">Deleting...</span>
                    ) : (
                      <Trash2 className="w-4 h-4 text-red-700" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start">
                  <span className="text-sm text-gray-600 w-20">Email:</span>
                  <span className="text-sm text-gray-900 flex-1">{customer.email}</span>
                </div>
                {customer.phone && (
                  <div className="flex items-start">
                    <span className="text-sm text-gray-600 w-20">Phone:</span>
                    <span className="text-sm text-gray-900 flex-1">{customer.phone}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-start">
                    <span className="text-sm text-gray-600 w-20">Address:</span>
                    <span className="text-sm text-gray-900 flex-1 whitespace-pre-line">{customer.address}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Phone</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-600">
                      You don't have any customers yet. Click on '+ Add Customer' to add your first customer.
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{customer.name}</td>
                    <td className="py-3 px-4 text-gray-900">{customer.email}</td>
                    <td className="py-3 px-4 text-gray-900">{customer.phone || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(customer)}
                          disabled={deletingId === customer.id}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(customer.id)}
                          disabled={deletingId === customer.id}
                        >
                          <Trash2 className="w-4 h-4 text-red-700" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Customer Type"
            value={formData.type}
            onChange={(e) => handleTypeChange(e.target.value as 'ORGANIZATION' | 'PERSON')}
            options={[
              { value: 'ORGANIZATION', label: 'Organization' },
              { value: 'PERSON', label: 'Person' },
            ]}
            required
          />
          <Input
            label={formData.type === 'ORGANIZATION' ? 'Company Name' : 'Full Name'}
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Company Registration Number"
            value={formData.registrationNumber}
            onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
            disabled={formData.type === 'PERSON'}
            placeholder={formData.type === 'PERSON' ? '9999999999 (auto-filled for persons)' : 'Enter registration number'}
          />
          <Input
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="Phone"
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
              showTaxRate
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Required for automatic VAT calculation
            </p>
          </div>

          {/* VAT Information Section */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-gray-900">VAT Information</h3>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isBusiness"
                checked={formData.isBusiness}
                onChange={(e) => setFormData({
                  ...formData,
                  isBusiness: e.target.checked,
                  vatNumber: e.target.checked ? formData.vatNumber : '',
                  vatNumberValidated: e.target.checked ? formData.vatNumberValidated : false,
                })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isBusiness" className="text-sm font-medium text-gray-700">
                This is a business customer (B2B)
              </label>
            </div>

            {formData.isBusiness && (
              <div className="space-y-3">
                <Input
                  label="VAT Number (Optional)"
                  placeholder="e.g., DE123456789"
                  value={formData.vatNumber}
                  onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value.toUpperCase() })}
                />
                <p className="text-xs text-gray-500">
                  Enter the customer's VAT number for EU B2B transactions (reverse charge). Format: 2-letter country code + VAT ID
                </p>

                {formData.vatNumber && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-sm text-blue-900">
                      {formData.vatNumberValidated ? '✓ VAT number validated' : 'ℹ VAT number not yet validated'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {!formData.isBusiness && (
              <p className="text-xs text-gray-500 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                This is a consumer (B2C). Distance selling rules will apply for cross-border transactions.
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : editingCustomer ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="flex justify-between items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-gray-600">Loading...</div>
          </CardContent>
        </Card>
      </div>
    }>
      <CustomersContent />
    </Suspense>
  );
}
