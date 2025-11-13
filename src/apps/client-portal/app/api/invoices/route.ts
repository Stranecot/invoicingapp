import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, getUserAccessFilter } from '@invoice-app/auth/server';
import { determineVATRule, calculateInvoiceWithVAT, validateInvoicePrerequisites } from '@invoice-app/database';

export async function GET() {
  try {
    const user = await getCurrentUser();

    // CRITICAL SECURITY: getUserAccessFilter now includes organization filtering
    // This ensures multi-tenant isolation at the database query level
    const filter = await getUserAccessFilter();

    let invoices;

    if (user.role === 'ADMIN' || user.role === 'OWNER' || user.role === 'ACCOUNTANT') {
      // Admin, Owner, and Accountant see invoices based on their access filter
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
    } else if (user.role === 'USER' || user.role === 'EMPLOYEE') {
      // User and Employee see only their own invoices in their organization
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
      select: {
        id: true,
        userId: true,
        organizationId: true,
        country: true,
        vatNumber: true,
        vatNumberValidated: true,
        isBusiness: true,
      },
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

    // Users and Employees can only create invoices for their own customers
    if ((user.role === 'USER' || user.role === 'EMPLOYEE') && customer.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only create invoices for your own customers' },
        { status: 403 }
      );
    }

    // Fetch organization details for VAT calculation
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId || undefined },
      select: {
        country: true,
        vatNumber: true,
      },
    });

    // Automatic VAT calculation if both organization and customer have countries
    let vatCalculation = null;
    let vatRule = null;
    let processedItems = items;

    if (organization?.country && customer.country) {
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

        console.log('VAT Rule applied:', vatRule.rule, '- Scenario:', vatRule.scenario);
        if (validation.warnings.length > 0) {
          console.warn('VAT Warnings:', validation.warnings);
        }
      } catch (vatError) {
        console.error('VAT calculation error (non-fatal):', vatError);
        // Continue with invoice creation without VAT if calculation fails
      }
    }

    // CRITICAL SECURITY: Set organizationId from current user
    const invoice = await prisma.invoice.create({
      data: {
        ...invoiceData,
        userId: user.id,
        organizationId: user.organizationId,
        // Add VAT information if calculated
        ...(vatRule && {
          vatRule: vatRule.rule,
          vatScenario: vatRule.scenario,
          isReverseCharge: vatRule.reverseCharge,
          isExport: vatRule.isExport || false,
          requiresEcSalesList: vatRule.requiresECSalesList || false,
          requiresExportDocs: vatRule.requiresExportDocumentation || false,
          vatNote: vatRule.note,
          customerVatNumber: customer.vatNumber,
          customerCountryId: customer.country,
        }),
        ...(vatCalculation && {
          isMixedVatRates: vatCalculation.isMixedVatRates,
          vatBreakdown: JSON.stringify(vatCalculation.vatBreakdown),
        }),
        items: {
          create: processedItems,
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
