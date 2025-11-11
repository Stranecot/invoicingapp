import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, getAccessibleCustomerIds } from '@/lib/auth';
import { formatDateISO, formatCurrencyForCSV } from '@/lib/eu-format';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};

    // Apply user-based filtering
    if (user.role === 'USER') {
      where.userId = user.id;
    } else if (user.role === 'ACCOUNTANT') {
      const accessibleCustomerIds = await getAccessibleCustomerIds();
      where.customerId = {
        in: accessibleCustomerIds,
      };
    }
    // Admin sees all expenses (no filter)

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        category: true,
        customer: true,
        invoice: true,
      },
      orderBy: { date: 'desc' },
    });

    // Generate CSV
    const headers = [
      'Date',
      'Category',
      'Description',
      'Vendor',
      'Amount',
      'Payment Method',
      'Status',
      'Customer',
      'Invoice',
      'Receipt Reference',
      'Notes',
    ];

    const rows = expenses.map((expense) => [
      formatDateISO(expense.date),
      expense.category.name,
      expense.description,
      expense.vendorName || '',
      formatCurrencyForCSV(expense.amount),
      expense.paymentMethod || '',
      expense.status,
      expense.customer?.name || '',
      expense.invoice?.invoiceNumber || '',
      expense.receiptReference || '',
      expense.notes || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="expenses-${formatDateISO(new Date())}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting expenses:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export expenses' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
