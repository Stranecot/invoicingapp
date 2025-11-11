import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, getUserAccessFilter } from '@invoice-app/auth/server';

export async function GET() {
  try {
    const user = await getCurrentUser();

    // CRITICAL SECURITY: getUserAccessFilter now includes organization filtering
    // This ensures multi-tenant isolation at the database query level
    const filter = await getUserAccessFilter();

    let invoices;

    if (user.role === 'ADMIN' || user.role === 'ACCOUNTANT') {
      // Admin sees all invoices in their organization
      // Accountant sees invoices for assigned customers in their organization
      invoices = await prisma.invoice.findMany({
        where: filter,
        include: {
          customer: true,
          items: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (user.role === 'USER') {
      // User sees only their own invoices in their organization
      invoices = await prisma.invoice.findMany({
        where: filter,
        include: {
          customer: true,
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      invoices = [];
    }

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch invoices' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    // Only users and admins can create invoices
    // Accountants have read-only access
    if (user.role === 'ACCOUNTANT') {
      return NextResponse.json(
        { error: 'Forbidden: Accountants cannot create invoices' },
        { status: 403 }
      );
    }

    const { items, ...invoiceData } = await request.json();

    console.log('Creating invoice with data:', { invoiceData, items });

    // Remove userId and organizationId from data if present (security)
    delete invoiceData.userId;
    delete invoiceData.organizationId;

    // CRITICAL SECURITY: Verify customer belongs to user's organization
    const customer = await prisma.customer.findUnique({
      where: { id: invoiceData.customerId },
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

    // Users can only create invoices for their own customers
    if (user.role === 'USER' && customer.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only create invoices for your own customers' },
        { status: 403 }
      );
    }

    // CRITICAL SECURITY: Set organizationId from current user
    const invoice = await prisma.invoice.create({
      data: {
        ...invoiceData,
        userId: user.id,
        organizationId: user.organizationId,
        items: {
          create: items,
        },
      },
      include: {
        customer: true,
        items: true,
      },
    });

    console.log('Invoice created successfully:', invoice.id);
    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
