'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Download, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency } from '@/lib/eu-format';
import { downloadInvoicePDF } from '@/lib/generate-pdf';

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
  customer: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

interface Company {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  taxRate: number;
}

export default function InvoicePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    fetchInvoice();
    fetchCompany();
  }, [id]);

  const fetchInvoice = async () => {
    const res = await fetch(`/api/invoices/${id}`);
    const data = await res.json();
    setInvoice(data);
  };

  const fetchCompany = async () => {
    const res = await fetch('/api/company');
    const data = await res.json();
    setCompany(data);
  };

  const generatePDF = () => {
    if (!invoice || !company) return;

    downloadInvoicePDF(
      {
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.date,
        dueDate: invoice.dueDate,
        status: invoice.status,
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        total: invoice.total,
        notes: invoice.notes,
        customer: {
          name: invoice.customer.name,
          email: invoice.customer.email,
          phone: invoice.customer.phone,
          address: invoice.customer.address,
        },
        items: invoice.items,
      },
      {
        name: company.name,
        email: company.email,
        phone: company.phone,
        address: company.address,
        taxRate: company.taxRate,
      }
    );
  };

  if (!invoice || !company) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-700 hover:text-blue-800"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-gray-600">Loading invoice preview...</div>
        </div>
      </div>
    );
  }

  const statusColors = {
    draft: 'bg-gray-200 text-gray-900',
    sent: 'bg-blue-200 text-blue-900',
    paid: 'bg-green-200 text-green-900',
    overdue: 'bg-red-200 text-red-900',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={generatePDF}>
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
            <p className="text-gray-600">{company.email}</p>
            {company.phone && <p className="text-gray-600">{company.phone}</p>}
            {company.address && (
              <p className="text-gray-600 whitespace-pre-line">{company.address}</p>
            )}
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-bold text-gray-900">INVOICE</h2>
            <p className="text-xl text-gray-600">#{invoice.invoiceNumber}</p>
          </div>
        </div>

        {/* Customer & Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Bill To:</h3>
            <p className="text-gray-800 font-medium">{invoice.customer.name}</p>
            <p className="text-gray-600">{invoice.customer.email}</p>
            {invoice.customer.phone && <p className="text-gray-600">{invoice.customer.phone}</p>}
            {invoice.customer.address && (
              <p className="text-gray-600 whitespace-pre-line">{invoice.customer.address}</p>
            )}
          </div>
          <div className="text-left md:text-right">
            <div className="mb-2">
              <span className="text-gray-600">Invoice Date: </span>
              <span className="font-medium">{formatDate(invoice.date)}</span>
            </div>
            <div className="mb-2">
              <span className="text-gray-600">Due Date: </span>
              <span className="font-medium">{formatDate(invoice.dueDate)}</span>
            </div>
            <div>
              <span className="text-gray-600">Status: </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[invoice.status as keyof typeof statusColors]}`}>
                {invoice.status}
              </span>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-8">
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3 pb-2 border-b-2 border-gray-300">Items</h3>
            {invoice.items.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="font-medium text-gray-900 mb-2">{item.description}</div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Qty:</span>
                    <span className="ml-1 text-gray-900">{item.quantity}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Price:</span>
                    <span className="ml-1 text-gray-900">{formatCurrency(item.unitPrice)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-600">Total:</span>
                    <span className="ml-1 font-semibold text-gray-900">{formatCurrency(item.total)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <table className="hidden md:table w-full">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-3 px-2 font-semibold text-gray-900">Description</th>
                <th className="text-right py-3 px-2 font-semibold text-gray-900">Qty</th>
                <th className="text-right py-3 px-2 font-semibold text-gray-900">Price</th>
                <th className="text-right py-3 px-2 font-semibold text-gray-900">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-3 px-2 text-gray-900">{item.description}</td>
                  <td className="text-right py-3 px-2 text-gray-900">{item.quantity}</td>
                  <td className="text-right py-3 px-2 text-gray-900">{formatCurrency(item.unitPrice)}</td>
                  <td className="text-right py-3 px-2 text-gray-900">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-full md:w-64">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Tax ({company.taxRate}%):</span>
              <span className="font-medium">{formatCurrency(invoice.tax)}</span>
            </div>
            <div className="flex justify-between py-3 border-t-2 border-gray-300">
              <span className="text-xl font-bold">Total:</span>
              <span className="text-xl font-bold">{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-2">Notes:</h3>
            <p className="text-gray-600 whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
