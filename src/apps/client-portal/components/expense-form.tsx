'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Textarea } from './ui/textarea';
import { CategoryAutocomplete } from './ui/category-autocomplete';

interface Customer {
  id: string;
  name: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
}

interface ExpenseFormProps {
  expense?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function ExpenseForm({ expense, onSubmit, onCancel }: ExpenseFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    date: expense?.date
      ? new Date(expense.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    categoryId: expense?.categoryId || '',
    amount: expense?.amount || '',
    description: expense?.description || '',
    notes: expense?.notes || '',
    paymentMethod: expense?.paymentMethod || '',
    receiptReference: expense?.receiptReference || '',
    vendorName: expense?.vendorName || '',
    status: expense?.status || 'pending',
    customerId: expense?.customerId || '',
    invoiceId: expense?.invoiceId || '',
  });

  useEffect(() => {
    fetchCustomers();
    fetchInvoices();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate category is selected
    if (!formData.categoryId) {
      alert('Please select or create a category');
      return;
    }

    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting expense:', error);
      alert('Failed to save expense. Please check all required fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />

        <CategoryAutocomplete
          label="Category"
          value={formData.categoryId}
          onChange={(categoryId) => setFormData({ ...formData, categoryId })}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Amount"
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          required
        />

        <Input
          label="Vendor Name"
          value={formData.vendorName}
          onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
        />
      </div>

      <Input
        label="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Payment Method"
          value={formData.paymentMethod}
          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
          options={[
            { value: '', label: 'Select payment method' },
            { value: 'cash', label: 'Cash' },
            { value: 'credit_card', label: 'Credit Card' },
            { value: 'debit_card', label: 'Debit Card' },
            { value: 'bank_transfer', label: 'Bank Transfer' },
            { value: 'check', label: 'Check' },
            { value: 'other', label: 'Other' },
          ]}
        />

        <Select
          label="Status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          options={[
            { value: 'pending', label: 'Pending' },
            { value: 'paid', label: 'Paid' },
            { value: 'reimbursed', label: 'Reimbursed' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Customer (Optional)"
          value={formData.customerId}
          onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
          options={[
            { value: '', label: 'None' },
            ...customers.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />

        <Select
          label="Invoice (Optional)"
          value={formData.invoiceId}
          onChange={(e) => setFormData({ ...formData, invoiceId: e.target.value })}
          options={[
            { value: '', label: 'None' },
            ...invoices.map((i) => ({ value: i.id, label: i.invoiceNumber })),
          ]}
        />
      </div>

      <Input
        label="Receipt Reference"
        value={formData.receiptReference}
        onChange={(e) => setFormData({ ...formData, receiptReference: e.target.value })}
        placeholder="e.g., RCPT-2024-001"
      />

      <Textarea
        label="Notes"
        rows={3}
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        placeholder="Add any additional notes..."
      />

      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : expense ? 'Update Expense' : 'Create Expense'}
        </Button>
      </div>
    </form>
  );
}
