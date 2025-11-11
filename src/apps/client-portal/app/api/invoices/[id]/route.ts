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

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
        user: user.role === 'ADMIN' || user.role === 'ACCOUNTANT' ? {
          select: {
            name: true,
            email: true,
          },
        } : false,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check access: Admin can see all, User can see their own, Accountant can see assigned customers
    const hasAccess = user.role === 'ADMIN' ||
                      (user.role === 'USER' && invoice.userId === user.id) ||
                      (user.role === 'ACCOUNTANT' && await canAccessCustomer(invoice.customerId));

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this invoice' },
        { status: 403 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch invoice' },
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
    const { items, ...invoiceData } = await request.json();

    // Check current invoice
    const currentInvoice = await prisma.invoice.findUnique({
      where: { id },
      select: { status: true, userId: true, customerId: true },
    });

    if (!currentInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Permission checks based on role
    if (user.role === 'ACCOUNTANT') {
      // Accountants can only update status (mark as paid, etc.)
      const hasAccess = await canAccessCustomer(currentInvoice.customerId);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have access to this invoice' },
          { status: 403 }
        );
      }

      // Accountants can only change status, not edit invoice details or items
      if (items || Object.keys(invoiceData).some(key => key !== 'status')) {
        return NextResponse.json(
          { error: 'Forbidden: Accountants can only update invoice status' },
          { status: 403 }
        );
      }

      // Update status only
      const invoice = await prisma.invoice.update({
        where: { id },
        data: { status: invoiceData.status },
        include: {
          customer: true,
          items: true,
        },
      });

      return NextResponse.json(invoice);
    }

    // Users can only edit their own invoices
    if (user.role === 'USER' && currentInvoice.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only edit your own invoices' },
        { status: 403 }
      );
    }

    // Only allow editing for draft and sent invoices (for users)
    if (user.role === 'USER' && currentInvoice.status !== 'draft' && currentInvoice.status !== 'sent') {
      return NextResponse.json(
        { error: `Cannot edit invoice with status "${currentInvoice.status}". Only draft and sent invoices can be edited.` },
        { status: 403 }
      );
    }

    // Remove userId from data if present (security)
    delete invoiceData.userId;

    // Delete existing items and create new ones if items are provided
    if (items) {
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...invoiceData,
        ...(items && {
          items: {
            create: items,
          },
        }),
      },
      include: {
        customer: true,
        items: true,
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update invoice' },
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

    // Accountants cannot delete invoices
    if (user.role === 'ACCOUNTANT') {
      return NextResponse.json(
        { error: 'Forbidden: Accountants cannot delete invoices' },
        { status: 403 }
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Users can only delete their own invoices
    if (user.role === 'USER' && invoice.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own invoices' },
        { status: 403 }
      );
    }

    await prisma.invoice.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete invoice' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
