import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, canAccessCustomer } from '@invoice-app/auth/server';
import { determineVATRule, calculateInvoiceWithVAT, validateInvoicePrerequisites } from '@invoice-app/database';

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
        user: user.role === 'ADMIN' || user.role === 'OWNER' || user.role === 'ACCOUNTANT' ? {
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
      select: { status: true, userId: true, customerId: true, organizationId: true },
    });

    if (!currentInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // CRITICAL SECURITY: Invoice must belong to user's organization
    if (user.organizationId && currentInvoice.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this invoice' },
        { status: 403 }
      );
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

    // Users and Employees can only edit their own invoices (Owners and Admins can edit all)
    if ((user.role === 'USER' || user.role === 'EMPLOYEE') && currentInvoice.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only edit your own invoices' },
        { status: 403 }
      );
    }

    // Only allow editing for draft and sent invoices (for users and employees)
    if ((user.role === 'USER' || user.role === 'EMPLOYEE') && currentInvoice.status !== 'draft' && currentInvoice.status !== 'sent') {
      return NextResponse.json(
        { error: `Cannot edit invoice with status "${currentInvoice.status}". Only draft and sent invoices can be edited.` },
        { status: 403 }
      );
    }

    // Remove userId and organizationId from data if present (security)
    delete invoiceData.userId;
    delete invoiceData.organizationId;

    // Fetch customer and organization for VAT calculation (if items are being updated)
    let vatCalculation = null;
    let vatRule = null;
    let processedItems = items;

    if (items) {
      const customer = await prisma.customer.findUnique({
        where: { id: invoiceData.customerId || currentInvoice.customerId },
        select: {
          country: true,
          vatNumber: true,
          vatNumberValidated: true,
          isBusiness: true,
        },
      });

      const organization = await prisma.organization.findUnique({
        where: { id: user.organizationId || undefined },
        select: {
          country: true,
          vatNumber: true,
        },
      });

      // Automatic VAT calculation if both organization and customer have countries
      if (organization?.country && customer?.country) {
        try {
          // Determine VAT rule
          vatRule = await determineVATRule(
            {
              country: organization.country,
              isVatRegistered: !!organization.vatNumber,
            },
            {
              country: customer.country,
              vatNumber: customer.vatNumber,
              vatNumberValidated: customer.vatNumberValidated,
              isBusiness: customer.isBusiness,
            }
          );

          // Validate prerequisites
          const validation = validateInvoicePrerequisites(vatRule, customer, organization);
          if (!validation.valid) {
            return NextResponse.json(
              {
                error: 'VAT validation failed',
                errors: validation.errors,
                warnings: validation.warnings,
              },
              { status: 400 }
            );
          }

          // Calculate invoice with VAT if items have vatCategoryCode
          const itemsHaveCategories = items.every((item: any) => item.vatCategoryCode);
          if (itemsHaveCategories) {
            vatCalculation = await calculateInvoiceWithVAT(items, vatRule, invoiceData.date ? new Date(invoiceData.date) : new Date());
            processedItems = vatCalculation.lineItems;
          }

          console.log('VAT Rule applied on update:', vatRule.rule, '- Scenario:', vatRule.scenario);
          if (validation.warnings.length > 0) {
            console.warn('VAT Warnings:', validation.warnings);
          }
        } catch (vatError) {
          console.error('VAT calculation error (non-fatal):', vatError);
          // Continue with invoice update without VAT if calculation fails
        }
      }

      // Delete existing items
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...invoiceData,
        // Add VAT information if calculated
        ...(vatRule && {
          vatRule: vatRule.rule,
          vatScenario: vatRule.scenario,
          isReverseCharge: vatRule.reverseCharge,
          isExport: vatRule.isExport || false,
          requiresEcSalesList: vatRule.requiresECSalesList || false,
          requiresExportDocs: vatRule.requiresExportDocumentation || false,
          vatNote: vatRule.note,
        }),
        ...(vatCalculation && {
          isMixedVatRates: vatCalculation.isMixedVatRates,
          vatBreakdown: JSON.stringify(vatCalculation.vatBreakdown),
        }),
        ...(items && {
          items: {
            create: processedItems,
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
      select: { userId: true, organizationId: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // CRITICAL SECURITY: Invoice must belong to user's organization
    if (user.organizationId && invoice.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this invoice' },
        { status: 403 }
      );
    }

    // Users and Employees can only delete their own invoices (Owners and Admins can delete all)
    if ((user.role === 'USER' || user.role === 'EMPLOYEE') && invoice.userId !== user.id) {
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
