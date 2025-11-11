'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { InvoiceFormWithPreview } from '@/components/invoice-form-with-preview';
import { InvoiceDetailView } from '@/components/invoice-detail-view';

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  customerId: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  taxRate: number;
}

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
    fetchCompany();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${id}`);
      if (res.ok) {
        const data = await res.json();
        setInvoice(data);
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompany = async () => {
    try {
      const res = await fetch('/api/company');
      if (res.ok) {
        const data = await res.json();
        setCompany(data);
      }
    } catch (error) {
      console.error('Error fetching company:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/invoices" className="text-blue-700 hover:text-blue-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Loading Invoice...</h1>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-gray-600">Loading invoice details...</div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/invoices" className="text-blue-700 hover:text-blue-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Invoice Not Found</h1>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-red-600">Invoice not found</div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/invoices" className="text-blue-700 hover:text-blue-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Error</h1>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-red-600">Company settings not found</div>
        </div>
      </div>
    );
  }

  // Check if invoice can be edited (only draft and sent)
  const canEdit = invoice.status === 'draft' || invoice.status === 'sent';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/invoices"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          {canEdit ? 'Edit Invoice' : 'View Invoice'}
        </h1>
      </div>

      {canEdit ? (
        <InvoiceFormWithPreview invoice={invoice} company={company} />
      ) : (
        <InvoiceDetailView invoice={invoice} company={company} />
      )}
    </div>
  );
}
