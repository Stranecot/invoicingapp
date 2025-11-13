import { NextRequest, NextResponse } from 'next/server';
import { calculateInvoiceWithVAT, determineVATRule, validateInvoicePrerequisites } from '@invoice-app/database';

/**
 * POST /api/vat/calculate
 * Calculate invoice totals with automatic VAT
 *
 * Request body:
 * {
 *   supplier: {
 *     country: string,
 *     isVatRegistered: boolean
 *   },
 *   customer: {
 *     country: string,
 *     vatNumber: string | null,
 *     vatNumberValidated: boolean,
 *     isBusiness: boolean
 *   },
 *   lineItems: Array<{
 *     description: string,
 *     quantity: number,
 *     unitPrice: number,
 *     vatCategoryCode: string
 *   }>,
 *   invoiceDate?: string (ISO date, optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { supplier, customer, lineItems, invoiceDate } = body;

    // Validate inputs
    if (!supplier || !customer || !lineItems) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: supplier, customer, and lineItems',
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'lineItems must be a non-empty array',
        },
        { status: 400 }
      );
    }

    // Determine VAT rule
    const vatRule = await determineVATRule(
      {
        country: supplier.country.toUpperCase(),
        isVatRegistered: supplier.isVatRegistered ?? true,
      },
      {
        country: customer.country.toUpperCase(),
        vatNumber: customer.vatNumber || null,
        vatNumberValidated: customer.vatNumberValidated ?? false,
        isBusiness: customer.isBusiness ?? true,
      }
    );

    // Validate prerequisites
    const validation = validateInvoicePrerequisites(vatRule, customer, supplier);

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice validation failed',
          errors: validation.errors,
          warnings: validation.warnings,
        },
        { status: 400 }
      );
    }

    // Calculate invoice
    const date = invoiceDate ? new Date(invoiceDate) : new Date();
    const calculation = await calculateInvoiceWithVAT(lineItems, vatRule, date);

    return NextResponse.json({
      success: true,
      data: {
        vatRule,
        calculation,
        validation: {
          errors: validation.errors,
          warnings: validation.warnings,
        },
      },
    });
  } catch (error) {
    console.error('Error calculating invoice with VAT:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate invoice',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
