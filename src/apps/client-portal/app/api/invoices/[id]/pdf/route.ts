import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateInvoicePDF } from '@/lib/generate-pdf';
import { getCurrentUser, canAccessCustomer } from '@invoice-app/auth/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    // Fetch invoice with customer and items
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // CRITICAL SECURITY: Invoice must belong to user's organization
    if (user.organizationId && invoice.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this invoice' },
        { status: 403 }
      );
    }

    // Check access: Admin/Owner can see all, User/Employee can see their own, Accountant can see assigned customers
    const hasAccess = user.role === 'ADMIN' ||
                      user.role === 'OWNER' ||
                      ((user.role === 'USER' || user.role === 'EMPLOYEE') && invoice.userId === user.id) ||
                      (user.role === 'ACCOUNTANT' && await canAccessCustomer(invoice.customerId));

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this invoice' },
        { status: 403 }
      );
    }

    // Fetch company data - get the user's company
    let company;
    if (user.role === 'ADMIN' || user.role === 'OWNER') {
      // Admin and Owner can fetch any company in their org
      company = await prisma.company.findUnique({
        where: { userId: invoice.userId },
      });
    } else {
      company = await prisma.company.findUnique({
        where: { userId: user.id },
      });
    }

    if (!company) {
      return NextResponse.json(
        { error: 'Company settings not found' },
        { status: 404 }
      );
    }

    // Generate PDF
    const pdf = generateInvoicePDF(
      {
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.date.toISOString(),
        dueDate: invoice.dueDate.toISOString(),
        status: invoice.status,
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        total: invoice.total,
        notes: invoice.notes || undefined,
        customer: {
          name: invoice.customer.name,
          email: invoice.customer.email,
          phone: invoice.customer.phone || undefined,
          address: invoice.customer.address || undefined,
        },
        items: invoice.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
      },
      {
        name: company.name,
        email: company.email,
        phone: company.phone || undefined,
        address: company.address || undefined,
        taxRate: company.taxRate,
      }
    );

    // Convert PDF to buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate PDF' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
