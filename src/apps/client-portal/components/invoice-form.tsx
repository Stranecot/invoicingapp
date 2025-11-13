'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Textarea } from './ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { VatCategorySelect } from './ui/vat-category-select';
import { VatRulePreview } from './vat-rule-preview';
import { formatCurrency, formatNumber } from '@/lib/eu-format';
import { useAuth } from '@/lib/auth-context';

interface Customer {
  id: string;
  name: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  vatCategoryCode?: string;
}

interface InvoiceFormProps {
  invoice?: any;
}

export function InvoiceForm({ invoice }: InvoiceFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customerId: invoice?.customerId || '',
    invoiceNumber: invoice?.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
    date: invoice?.date ? new Date(invoice.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    dueDate: invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: invoice?.status || 'draft',
    notes: invoice?.notes || '',
  });

  const [items, setItems] = useState<InvoiceItem[]>(
    invoice?.items || [{ description: '', quantity: 1, unitPrice: 0, total: 0, vatCategoryCode: 'STANDARD' }]
  );

  const [company, setCompany] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [vatCalculation, setVatCalculation] = useState<any>(null);
  const [calculatingVat, setCalculatingVat] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchCompany();
    fetchOrganization();
  }, []);

  const fetchCustomers = async () => {
    const res = await fetch('/api/customers');
    const data = await res.json();
    setCustomers(data);
  };

  const fetchCompany = async () => {
    const res = await fetch('/api/company');
    const data = await res.json();
    setCompany(data);
  };

  const fetchOrganization = async () => {
    try {
      console.log('[VAT DEBUG] Fetching organization...');
      const res = await fetch('/api/organizations/current');
      console.log('[VAT DEBUG] Organization response status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('[VAT DEBUG] Organization data:', data);
        setOrganization(data);
      } else {
        console.error('[VAT DEBUG] Failed to fetch organization, status:', res.status);
      }
    } catch (error) {
      console.error('[VAT DEBUG] Error fetching organization:', error);
    }
  };

  const fetchCustomer = async (customerId: string) => {
    try {
      console.log('[VAT DEBUG] Fetching customer:', customerId);
      const res = await fetch(`/api/customers/${customerId}`);
      console.log('[VAT DEBUG] Customer response status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('[VAT DEBUG] Customer data:', data);
        setSelectedCustomer(data);
      } else {
        console.error('[VAT DEBUG] Failed to fetch customer, status:', res.status);
      }
    } catch (error) {
      console.error('[VAT DEBUG] Error fetching customer:', error);
    }
  };

  // Calculate VAT preview whenever items, customer, or organization changes
  const calculateVatPreview = useCallback(async () => {
    console.log('[VAT DEBUG] calculateVatPreview called');
    console.log('[VAT DEBUG] Organization country:', organization?.country);
    console.log('[VAT DEBUG] Customer country:', selectedCustomer?.country);
    console.log('[VAT DEBUG] Items length:', items.length);

    if (!organization?.country || !selectedCustomer?.country || items.length === 0) {
      console.log('[VAT DEBUG] Skipping VAT calculation - missing required data');
      setVatCalculation(null);
      return;
    }

    // Check if all items have valid data
    const hasValidItems = items.every(
      item => item.description && item.quantity > 0 && item.unitPrice >= 0
    );
    console.log('[VAT DEBUG] Has valid items:', hasValidItems);
    if (!hasValidItems) {
      console.log('[VAT DEBUG] Skipping VAT calculation - invalid items');
      setVatCalculation(null);
      return;
    }

    const requestBody = {
      supplier: {
        country: organization.country,
        isVatRegistered: !!organization.vatId,
      },
      customer: {
        country: selectedCustomer.country,
        vatNumber: selectedCustomer.vatNumber || null,
        vatNumberValidated: selectedCustomer.vatNumberValidated || false,
        isBusiness: selectedCustomer.isBusiness || false,
      },
      lineItems: items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatCategoryCode: item.vatCategoryCode || 'STANDARD',
      })),
      invoiceDate: formData.date,
    };

    console.log('[VAT DEBUG] Calling VAT API with request:', JSON.stringify(requestBody, null, 2));
    setCalculatingVat(true);
    try {
      const res = await fetch('/api/vat/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('[VAT DEBUG] VAT API response status:', res.status);

      if (res.ok) {
        const result = await res.json();
        console.log('[VAT DEBUG] VAT API response:', JSON.stringify(result, null, 2));
        if (result.success) {
          console.log('[VAT DEBUG] Setting VAT calculation result');
          setVatCalculation(result.data);
        } else {
          console.error('[VAT DEBUG] VAT calculation failed:', result.error);
          setVatCalculation(null);
        }
      } else {
        const errorText = await res.text();
        console.error('[VAT DEBUG] VAT calculation request failed. Status:', res.status, 'Response:', errorText);
        setVatCalculation(null);
      }
    } catch (error) {
      console.error('[VAT DEBUG] Error calculating VAT:', error);
      setVatCalculation(null);
    } finally {
      setCalculatingVat(false);
    }
  }, [organization, selectedCustomer, items, formData.date]);

  // Trigger VAT calculation when dependencies change
  useEffect(() => {
    console.log('[VAT DEBUG] useEffect triggered - organization:', !!organization, 'selectedCustomer:', !!selectedCustomer, 'items:', items.length);
    if (organization && selectedCustomer && items.length > 0) {
      console.log('[VAT DEBUG] Setting timeout for VAT calculation (500ms debounce)');
      const timeoutId = setTimeout(() => {
        console.log('[VAT DEBUG] Debounce timeout completed, calling calculateVatPreview');
        calculateVatPreview();
      }, 500); // Debounce by 500ms to avoid excessive API calls

      return () => {
        console.log('[VAT DEBUG] Clearing debounce timeout');
        clearTimeout(timeoutId);
      };
    } else {
      console.log('[VAT DEBUG] Not triggering VAT calculation - missing conditions');
    }
  }, [organization, selectedCustomer, items, calculateVatPreview]);

  // Fetch customer details when customer is selected
  useEffect(() => {
    console.log('[VAT DEBUG] Customer ID changed:', formData.customerId);
    if (formData.customerId) {
      fetchCustomer(formData.customerId);
    } else {
      console.log('[VAT DEBUG] No customer selected, clearing customer and VAT calculation');
      setSelectedCustomer(null);
      setVatCalculation(null);
    }
  }, [formData.customerId]);

  const addItem = useCallback(() => {
    setItems(prev => [...prev, { description: '', quantity: 1, unitPrice: 0, total: 0, vatCategoryCode: 'STANDARD' }]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback((index: number, field: keyof InvoiceItem, value: any) => {
    setItems(prev => {
      const newItems = [...prev];

      // Handle numeric fields properly
      if (field === 'quantity' || field === 'unitPrice') {
        const numValue = value === '' ? 0 : parseFloat(value);
        newItems[index] = { ...newItems[index], [field]: isNaN(numValue) ? 0 : numValue };
        newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
      } else {
        newItems[index] = { ...newItems[index], [field]: value };
      }

      return newItems;
    });
  }, []);

  // Memoize calculations to prevent unnecessary recalculations
  const { subtotal, tax, total } = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);

    // Use VAT calculation result if available
    if (vatCalculation?.calculation) {
      return {
        subtotal: vatCalculation.calculation.subtotal,
        tax: vatCalculation.calculation.totalVAT,
        total: vatCalculation.calculation.grandTotal,
      };
    }

    // Default calculation when VAT not yet calculated
    const tax = 0;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [items, vatCalculation]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const invoiceData = {
      ...formData,
      date: new Date(formData.date).toISOString(),
      dueDate: new Date(formData.dueDate).toISOString(),
      subtotal,
      tax,
      total,
      items: items.map(({ description, quantity, unitPrice, total, vatCategoryCode }) => ({
        description,
        quantity,
        unitPrice,
        total,
        vatCategoryCode: vatCategoryCode || 'STANDARD',
      })),
    };

    const url = invoice ? `/api/invoices/${invoice.id}` : '/api/invoices';
    const method = invoice ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to save invoice:', error);
        alert(`Failed to save invoice: ${error.error || 'Unknown error'}`);
        return;
      }

      const result = await response.json();
      console.log('Invoice saved successfully:', result);
      router.push('/invoices');
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('An error occurred while saving the invoice. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [formData, subtotal, tax, total, items, invoice, router]);

  // Memoize customer options to prevent recreation on each render
  const customerOptions = useMemo(() => [
    { value: '', label: 'Select a customer' },
    ...customers.map((c) => ({ value: c.id, label: c.name })),
  ], [customers]);

  // Memoize status options
  const statusOptions = useMemo(() => [
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
  ], []);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Invoice Number"
              value={formData.invoiceNumber}
              onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
              required
            />
            <Select
              label="Customer"
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              options={customerOptions}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Invoice Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
            <Input
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
            />
          </div>

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={statusOptions}
          />

          {/* VAT Rule Preview */}
          {formData.customerId && user?.organizationId && (
            <div className="pt-4">
              <VatRulePreview
                customerId={formData.customerId}
                organizationId={user.organizationId}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Line Items</CardTitle>
            <Button type="button" onClick={addItem} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-4">
                    <Input
                      label={index === 0 ? 'Description' : ''}
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {index === 0 ? 'VAT Category' : ''}
                    </label>
                    <VatCategorySelect
                      value={item.vatCategoryCode || 'STANDARD'}
                      onChange={(value) => updateItem(index, 'vatCategoryCode', value)}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label={index === 0 ? 'Quantity' : ''}
                      type="number"
                      step="0.01"
                      value={item.quantity || ''}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label={index === 0 ? 'Unit Price' : ''}
                      type="number"
                      step="0.01"
                      value={item.unitPrice || ''}
                      onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                      required
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Input
                      label={index === 0 ? 'Total' : ''}
                      value={formatNumber(item.total)}
                      readOnly
                    />
                  </div>
                  <div className="md:col-span-1">
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t pt-6">
            <div className="flex flex-col items-end space-y-2">
              <div className="flex justify-between w-full md:w-64">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between w-full md:w-64">
                <span className="text-gray-600">VAT:</span>
                {calculatingVat ? (
                  <span className="font-medium text-gray-500 text-sm">Calculating...</span>
                ) : vatCalculation?.calculation ? (
                  <span className="font-medium text-gray-900">{formatCurrency(tax)}</span>
                ) : (
                  <span className="font-medium text-gray-500 text-sm">
                    {formData.customerId ? 'Enter items' : 'Select customer'}
                  </span>
                )}
              </div>
              <div className="flex justify-between w-full md:w-64 text-lg font-bold bg-blue-700 text-white rounded-lg py-3 px-4">
                <span>Total:</span>
                <span>{formatCurrency(vatCalculation?.calculation ? total : subtotal)}</span>
              </div>
              {vatCalculation?.vatRule && (
                <div className="w-full md:w-64 mt-2 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs font-medium text-blue-900 mb-1">
                    VAT Rule: {vatCalculation.vatRule.rule}
                  </p>
                  <p className="text-xs text-blue-700">
                    {vatCalculation.vatRule.explanation}
                  </p>
                  {vatCalculation.validation?.warnings?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      {vatCalculation.validation.warnings.map((warning: string, idx: number) => (
                        <p key={idx} className="text-xs text-yellow-700">
                          ⚠ {warning}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {formData.customerId && !vatCalculation && !calculatingVat && (
                <div className="w-full md:w-64 mt-2">
                  <p className="text-xs text-gray-500 text-right">
                    ℹ VAT will be calculated automatically based on organization and customer countries.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={4}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Add any additional notes or payment terms..."
          />
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="secondary" onClick={() => router.push('/invoices')} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : invoice ? 'Update Invoice' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  );
}
