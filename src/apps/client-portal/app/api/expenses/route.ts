import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, getAccessibleCustomerIds } from '@invoice-app/auth/server';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};

    // CRITICAL SECURITY: Add organization filter for all roles
    if (user.organizationId) {
      where.organizationId = user.organizationId;
    }

    // Apply user-based filtering
    if (user.role === 'USER') {
      where.userId = user.id;
    } else if (user.role === 'ACCOUNTANT') {
      // Accountants see expenses for their assigned customers only
      const accessibleCustomerIds = await getAccessibleCustomerIds();
      where.customerId = {
        in: accessibleCustomerIds,
      };
    }
    // Admin sees all expenses in their organization

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status) {
      where.status = status;
    }

    if (customerId) {
      // Verify accountant has access to this customer
      if (user.role === 'ACCOUNTANT') {
        const accessibleCustomerIds = await getAccessibleCustomerIds();
        if (!accessibleCustomerIds.includes(customerId)) {
          return NextResponse.json(
            { error: 'Forbidden: You do not have access to this customer' },
            { status: 403 }
          );
        }
      }
      where.customerId = customerId;
    }

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
        user: user.role === 'ADMIN' ? {
          select: {
            name: true,
            email: true,
          },
        } : false,
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch expenses' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    // Accountants cannot create expenses
    if (user.role === 'ACCOUNTANT') {
      return NextResponse.json(
        { error: 'Forbidden: Accountants cannot create expenses' },
        { status: 403 }
      );
    }

    const data = await request.json();

    console.log('Creating expense with data:', data);

    // Remove userId and organizationId from data if present (security)
    delete data.userId;
    delete data.organizationId;

    // CRITICAL SECURITY: Verify customer belongs to user's organization (if provided)
    if (data.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: data.customerId },
        select: { id: true, userId: true, organizationId: true },
      });

      if (!customer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }

      // CRITICAL SECURITY: Customer must belong to user's organization
      if (user.organizationId && customer.organizationId !== user.organizationId) {
        return NextResponse.json(
          { error: 'Forbidden: Customer does not belong to your organization' },
          { status: 403 }
        );
      }

      if (user.role === 'USER' && customer.userId !== user.id) {
        return NextResponse.json(
          { error: 'Forbidden: You can only create expenses for your own customers' },
          { status: 403 }
        );
      }
    }

    // CRITICAL SECURITY: Create expense with organizationId from current user
    const expense = await prisma.expense.create({
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        date: new Date(data.date),
        categoryId: data.categoryId,
        amount: parseFloat(data.amount),
        description: data.description,
        notes: data.notes || null,
        paymentMethod: data.paymentMethod || null,
        receiptReference: data.receiptReference || null,
        vendorName: data.vendorName || null,
        status: data.status || 'pending',
        customerId: data.customerId || null,
        invoiceId: data.invoiceId || null,
      },
      include: {
        category: true,
        customer: true,
        invoice: true,
      },
    });

    console.log('Expense created successfully:', expense.id);
    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
