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

    // Check if user has access to this customer
    const hasAccess = await canAccessCustomer(id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this customer' },
        { status: 403 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        invoices: true,
        user: user.role === 'ADMIN' || user.role === 'ACCOUNTANT' ? {
          select: {
            name: true,
            email: true,
          },
        } : false,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // CRITICAL SECURITY: Customer must belong to user's organization
    // This check is redundant with canAccessCustomer but adds defense in depth
    if (user.organizationId && customer.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this customer' },
        { status: 403 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch customer' },
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

    // Accountants cannot edit customers
    if (user.role === 'ACCOUNTANT') {
      return NextResponse.json(
        { error: 'Forbidden: Accountants cannot edit customers' },
        { status: 403 }
      );
    }

    // Check if user has access to this customer
    const hasAccess = await canAccessCustomer(id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this customer' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Remove userId and organizationId from data if present (security)
    delete data.userId;
    delete data.organizationId;

    const customer = await prisma.customer.update({
      where: { id },
      data,
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update customer' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
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

    // Accountants cannot delete customers
    if (user.role === 'ACCOUNTANT') {
      return NextResponse.json(
        { error: 'Forbidden: Accountants cannot delete customers' },
        { status: 403 }
      );
    }

    // Check if user has access to this customer
    const hasAccess = await canAccessCustomer(id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this customer' },
        { status: 403 }
      );
    }

    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete customer' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
