import { InvoiceFormWithPreview } from '@/components/invoice-form-with-preview';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

async function getCompany() {
  try {
    const company = await prisma.company.findFirst();
    return company;
  } catch (error) {
    console.error('Error fetching company:', error);
    return null;
  }
}

export default async function NewInvoicePage() {
  const company = await getCompany();

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
        <h1 className="text-3xl font-bold text-gray-900">Create Invoice</h1>
      </div>
      <InvoiceFormWithPreview
        invoice={null}
        company={company}
      />
    </div>
  );
}
