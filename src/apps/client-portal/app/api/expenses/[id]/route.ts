import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, canAccessCustomer } from '@invoice-app/auth/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        category: true,
        customer: true,
        invoice: true,
        user: user.role === 'ADMIN' ? {
          select: {
            name: true,
            email: true,
          },
        } : false,
      },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // CRITICAL SECURITY: Expense must belong to user's organization
    if (user.organizationId && expense.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this expense' },
        { status: 403 }
      );
    }

    // Check access
    const hasAccess = user.role === 'ADMIN' ||
                      (user.role === 'USER' && expense.userId === user.id) ||
                      (user.role === 'ACCOUNTANT' && expense.customerId && await canAccessCustomer(expense.customerId));

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this expense' },
        { status: 403 }
      );
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch expense' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    // Accountants cannot edit expenses
    if (user.role === 'ACCOUNTANT') {
      return NextResponse.json(
        { error: 'Forbidden: Accountants cannot edit expenses' },
        { status: 403 }
      );
    }

    const data = await request.json();

    console.log('Updating expense:', id, 'with data:', data);

    // Get current expense
    const currentExpense = await prisma.expense.findUnique({
      where: { id },
      select: { userId: true, organizationId: true },
    });

    if (!currentExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // CRITICAL SECURITY: Expense must belong to user's organization
    if (user.organizationId && currentExpense.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this expense' },
        { status: 403 }
      );
    }

    // Users can only edit their own expenses
    if (user.role === 'USER' && currentExpense.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only edit your own expenses' },
        { status: 403 }
      );
    }

    // Remove userId and organizationId from data if present (security)
    delete data.userId;
    delete data.organizationId;

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        date: data.date ? new Date(data.date) : undefined,
        categoryId: data.categoryId,
        amount: data.amount ? parseFloat(data.amount) : undefined,
        description: data.description,
        notes: data.notes || null,
        paymentMethod: data.paymentMethod || null,
        receiptReference: data.receiptReference || null,
        vendorName: data.vendorName || null,
        status: data.status,
        customerId: data.customerId || null,
        invoiceId: data.invoiceId || null,
      },
      include: {
        category: true,
        customer: true,
        invoice: true,
      },
    });

    console.log('Expense updated successfully:', expense.id);
    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { error: 'Failed to update expense', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    // Accountants cannot delete expenses
    if (user.role === 'ACCOUNTANT') {
      return NextResponse.json(
        { error: 'Forbidden: Accountants cannot delete expenses' },
        { status: 403 }
      );
    }

    console.log('Deleting expense:', id);

    const expense = await prisma.expense.findUnique({
      where: { id },
      select: { userId: true, organizationId: true },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // CRITICAL SECURITY: Expense must belong to user's organization
    if (user.organizationId && expense.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this expense' },
        { status: 403 }
      );
    }

    // Users can only delete their own expenses
    if (user.role === 'USER' && expense.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own expenses' },
        { status: 403 }
      );
    }

    await prisma.expense.delete({
      where: { id },
    });

    console.log('Expense deleted successfully:', id);
    return NextResponse.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: 'Failed to delete expense', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
