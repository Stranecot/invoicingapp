import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth';
import { prisma } from '@invoice-app/database';

/**
 * GET /api/admin/users/[id]/stats
 * Get user statistics (invoices created, expenses, etc.)
 */
export const GET = withAdminAuth(async (req: NextRequest, adminUser, context) => {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch various statistics
    const [
      invoiceCount,
      expenseCount,
      customerCount,
      budgetCount,
      noteCount,
    ] = await Promise.all([
      prisma.invoice.count({ where: { userId: id } }),
      prisma.expense.count({ where: { userId: id } }),
      prisma.customer.count({ where: { userId: id } }),
      prisma.budget.count({ where: { userId: id } }),
      prisma.note.count({ where: { userId: id } }),
    ]);

    // Get invoice totals
    const invoices = await prisma.invoice.findMany({
      where: { userId: id },
      select: {
        total: true,
        status: true,
      },
    });

    const totalInvoiceAmount = invoices.reduce(
      (sum, inv) => sum + (inv.total || 0),
      0
    );

    const paidInvoices = invoices.filter((inv) => inv.status === 'PAID').length;
    const pendingInvoices = invoices.filter((inv) => inv.status === 'PENDING').length;

    // Get expense totals
    const expenses = await prisma.expense.findMany({
      where: { userId: id },
      select: {
        amount: true,
      },
    });

    const totalExpenseAmount = expenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );

    return NextResponse.json({
      stats: {
        invoices: {
          total: invoiceCount,
          paid: paidInvoices,
          pending: pendingInvoices,
          totalAmount: totalInvoiceAmount,
        },
        expenses: {
          total: expenseCount,
          totalAmount: totalExpenseAmount,
        },
        customers: customerCount,
        budgets: budgetCount,
        notes: noteCount,
      },
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
});
