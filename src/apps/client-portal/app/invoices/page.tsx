'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Eye, Edit, Trash2, Download, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency } from '@/lib/eu-format';

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  status: string;
  total: number;
  customer: {
    name: string;
  };
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/invoices');
      const data = await res.json();
      // Ensure data is an array before setting
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleDelete = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      try {
        setDeletingId(id);
        await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
        fetchInvoices();
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Failed to delete invoice');
      } finally {
        setDeletingId(null);
      }
    }
  }, [fetchInvoices]);

  const handleDownloadPDF = useCallback(async (id: string, invoiceNumber: string) => {
    try {
      setDownloadingId(id);
      const response = await fetch(`/api/invoices/${id}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('An error occurred while downloading the PDF');
    } finally {
      setDownloadingId(null);
    }
  }, []);

  // Memoize status colors
  const statusColors = useMemo(() => ({
    draft: 'bg-gray-200 text-gray-900',
    sent: 'bg-blue-200 text-blue-900',
    paid: 'bg-green-200 text-green-900',
    overdue: 'bg-red-200 text-red-900',
  }), []);

  // Memoize filtered invoices
  const filteredInvoices = useMemo(() =>
    filter === 'all' ? invoices : invoices.filter(inv => inv.status === filter),
    [filter, invoices]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <Link href="/invoices/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Create Invoice</span>
              <span className="sm:hidden">New</span>
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-gray-600">Loading invoices...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
        <Link href="/invoices/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Create Invoice</span>
            <span className="sm:hidden">New</span>
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={filter === 'all' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'draft' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('draft')}
        >
          Draft
        </Button>
        <Button
          variant={filter === 'sent' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('sent')}
        >
          Sent
        </Button>
        <Button
          variant={filter === 'paid' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('paid')}
        >
          Paid
        </Button>
        <Button
          variant={filter === 'overdue' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('overdue')}
        >
          Overdue
        </Button>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredInvoices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-gray-600">
                {filter === 'all'
                  ? "You don't have any invoices yet. Click on '+ Create Invoice' to add your first invoice."
                  : `No ${filter} invoices found. Try a different filter.`}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredInvoices.map((invoice) => (
            <Card key={invoice.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[invoice.status as keyof typeof statusColors]}`}>
                      {invoice.status}
                    </span>
                    <span className="text-xs text-gray-600">#{invoice.invoiceNumber}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg">{invoice.customer.name}</h3>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(invoice.total)}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-sm text-gray-600 w-24">Date:</span>
                  <span className="text-sm text-gray-900 flex-1">{formatDate(invoice.date)}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-sm text-gray-600 w-24">Due Date:</span>
                  <span className="text-sm text-gray-900 flex-1">{formatDate(invoice.dueDate)}</span>
                </div>
              </div>
              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <Link href={`/invoices/${invoice.id}/preview`} className="flex-1">
                  <Button variant="secondary" size="sm" className="w-full">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownloadPDF(invoice.id, invoice.invoiceNumber)}
                  title="Download PDF"
                  disabled={downloadingId === invoice.id}
                >
                  <Download className="w-4 h-4" />
                </Button>
                {(invoice.status === 'draft' || invoice.status === 'sent') ? (
                  <>
                    <Link href={`/invoices/${invoice.id}`}>
                      <Button variant="ghost" size="sm" title="Edit" disabled={deletingId === invoice.id}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(invoice.id)}
                      title="Delete"
                      disabled={deletingId === invoice.id}
                    >
                      {deletingId === invoice.id ? (
                        <span className="text-xs">Deleting...</span>
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-700" />
                      )}
                    </Button>
                  </>
                ) : (
                  <Button variant="ghost" size="sm" disabled title="Locked - Cannot edit or delete">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </Button>
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
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Invoice #</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Due Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-600">
                      {filter === 'all'
                        ? "You don't have any invoices yet. Click on '+ Create Invoice' to add your first invoice."
                        : `No ${filter} invoices found. Try a different filter.`}
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{invoice.invoiceNumber}</td>
                    <td className="py-3 px-4 text-gray-900">{invoice.customer.name}</td>
                    <td className="py-3 px-4 text-gray-900">{formatDate(invoice.date)}</td>
                    <td className="py-3 px-4 text-gray-900">{formatDate(invoice.dueDate)}</td>
                    <td className="py-3 px-4 text-gray-900">{formatCurrency(invoice.total)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[invoice.status as keyof typeof statusColors]}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Link href={`/invoices/${invoice.id}/preview`}>
                          <Button variant="ghost" size="sm" title="Preview">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>

                        {/* Show PDF download for all invoices */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPDF(invoice.id, invoice.invoiceNumber)}
                          title={downloadingId === invoice.id ? 'Downloading...' : 'Download PDF'}
                          disabled={downloadingId === invoice.id}
                        >
                          <Download className="w-4 h-4 text-blue-700" />
                        </Button>

                        {/* Show edit button only for draft and sent, lock icon for others */}
                        {(invoice.status === 'draft' || invoice.status === 'sent') ? (
                          <Link href={`/invoices/${invoice.id}`}>
                            <Button variant="ghost" size="sm" title="Edit" disabled={deletingId === invoice.id}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                        ) : (
                          <Button variant="ghost" size="sm" disabled title="Locked - Cannot edit">
                            <Lock className="w-4 h-4 text-gray-400" />
                          </Button>
                        )}

                        {/* Show delete button only for draft and sent */}
                        {(invoice.status === 'draft' || invoice.status === 'sent') ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(invoice.id)}
                            title={deletingId === invoice.id ? 'Deleting...' : 'Delete'}
                            disabled={deletingId === invoice.id}
                          >
                            <Trash2 className="w-4 h-4 text-red-700" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" disabled title="Cannot delete">
                            <Trash2 className="w-4 h-4 text-gray-400" />
                          </Button>
                        )}
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
    </div>
  );
}
