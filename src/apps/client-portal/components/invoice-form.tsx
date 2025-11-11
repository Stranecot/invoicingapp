'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Textarea } from './ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { formatCurrency, formatNumber } from '@/lib/eu-format';

interface Customer {
  id: string;
  name: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceFormProps {
  invoice?: any;
}

export function InvoiceForm({ invoice }: InvoiceFormProps) {
  const router = useRouter();
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
    invoice?.items || [{ description: '', quantity: 1, unitPrice: 0, total: 0 }]
  );

  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    fetchCustomers();
    fetchCompany();
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

  const addItem = useCallback(() => {
    setItems(prev => [...prev, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);
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
    const tax = subtotal * ((company?.taxRate || 0) / 100);
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [items, company?.taxRate]);

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
      items: items.map(({ description, quantity, unitPrice, total }) => ({
        description,
        quantity,
        unitPrice,
        total,
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
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-5">
                  <Input
                    label={index === 0 ? 'Description' : ''}
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
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
                <div className="md:col-span-2">
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
            ))}
          </div>

          <div className="mt-6 border-t pt-6">
            <div className="flex flex-col items-end space-y-2">
              <div className="flex justify-between w-full md:w-64">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between w-full md:w-64">
                <span className="text-gray-600">Tax ({company?.taxRate || 0}%):</span>
                <span className="font-medium text-gray-900">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between w-full md:w-64 text-lg font-bold bg-blue-700 text-white rounded-lg py-3 px-4">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
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
