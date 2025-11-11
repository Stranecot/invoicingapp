import { formatDate, formatCurrency } from '@/lib/eu-format';

interface InvoicePreviewProps {
  invoiceData: {
    invoiceNumber: string;
    date: string;
    dueDate: string;
    status: string;
    subtotal: number;
    tax: number;
    total: number;
    notes?: string;
  };
  customerData: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  } | null;
  companyData: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    taxRate: number;
  } | null;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export function InvoicePreview({ invoiceData, customerData, companyData, items }: InvoicePreviewProps) {
  const statusColors = {
    draft: 'bg-gray-200 text-gray-900',
    sent: 'bg-blue-200 text-blue-900',
    paid: 'bg-green-200 text-green-900',
    overdue: 'bg-red-200 text-red-900',
  };

  if (!companyData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <p className="text-gray-500">Loading preview...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      {/* Header */}
      <div className="flex justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{companyData.name}</h1>
          <p className="text-gray-600">{companyData.email}</p>
          {companyData.phone && <p className="text-gray-600">{companyData.phone}</p>}
          {companyData.address && (
            <p className="text-gray-600 whitespace-pre-line">{companyData.address}</p>
          )}
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-bold text-gray-900">INVOICE</h2>
          <p className="text-xl text-gray-600">#{invoiceData.invoiceNumber || 'Draft'}</p>
        </div>
      </div>

      {/* Customer & Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Bill To:</h3>
          {customerData ? (
            <>
              <p className="text-gray-800 font-medium">{customerData.name}</p>
              <p className="text-gray-600">{customerData.email}</p>
              {customerData.phone && <p className="text-gray-600">{customerData.phone}</p>}
              {customerData.address && (
                <p className="text-gray-600 whitespace-pre-line">{customerData.address}</p>
              )}
            </>
          ) : (
            <p className="text-gray-400 italic">No customer selected</p>
          )}
        </div>
        <div className="text-left md:text-right">
          <div className="mb-2">
            <span className="text-gray-600">Invoice Date: </span>
            <span className="font-medium text-gray-900">
              {invoiceData.date ? formatDate(invoiceData.date) : 'Not set'}
            </span>
          </div>
          <div className="mb-2">
            <span className="text-gray-600">Due Date: </span>
            <span className="font-medium text-gray-900">
              {invoiceData.dueDate ? formatDate(invoiceData.dueDate) : 'Not set'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Status: </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[invoiceData.status as keyof typeof statusColors] || statusColors.draft}`}>
              {invoiceData.status || 'draft'}
            </span>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="mb-8">
        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          <h3 className="font-semibold text-gray-900 mb-3 pb-2 border-b-2 border-gray-300">Items</h3>
          {items.length > 0 ? (
            items.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="font-medium text-gray-900 mb-2">{item.description || 'Untitled item'}</div>
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
            ))
          ) : (
            <div className="py-4 text-center text-gray-400 italic">
              No items added yet
            </div>
          )}
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
            {items.length > 0 ? (
              items.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-3 px-2 text-gray-900">{item.description || 'Untitled item'}</td>
                  <td className="text-right py-3 px-2 text-gray-900">{item.quantity}</td>
                  <td className="text-right py-3 px-2 text-gray-900">{formatCurrency(item.unitPrice)}</td>
                  <td className="text-right py-3 px-2 text-gray-900">{formatCurrency(item.total)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-4 text-center text-gray-400 italic">
                  No items added yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-full md:w-64">
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium text-gray-900">{formatCurrency(invoiceData.subtotal)}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Tax ({companyData.taxRate}%):</span>
            <span className="font-medium text-gray-900">{formatCurrency(invoiceData.tax)}</span>
          </div>
          <div className="flex justify-between py-3 px-4 bg-blue-700 text-white rounded-lg">
            <span className="text-xl font-bold">Total:</span>
            <span className="text-xl font-bold">{formatCurrency(invoiceData.total)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoiceData.notes && (
        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-900 mb-2">Notes:</h3>
          <p className="text-gray-600 whitespace-pre-line">{invoiceData.notes}</p>
        </div>
      )}
    </div>
  );
}
