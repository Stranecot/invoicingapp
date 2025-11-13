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
    console.log('[VAT API] Received POST request');
    const body = await request.json();
    console.log('[VAT API] Request body:', JSON.stringify(body, null, 2));

    const { supplier, customer, lineItems, invoiceDate } = body;

    // Validate inputs
    if (!supplier || !customer || !lineItems) {
      console.error('[VAT API] Missing required fields');
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: supplier, customer, and lineItems',
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      console.error('[VAT API] Invalid lineItems');
      return NextResponse.json(
        {
          success: false,
          error: 'lineItems must be a non-empty array',
        },
        { status: 400 }
      );
    }

    // Determine VAT rule
    console.log('[VAT API] Determining VAT rule...');
    const supplierInfo = {
      country: supplier.country.toUpperCase(),
      isVatRegistered: supplier.isVatRegistered ?? true,
    };
    const customerInfo = {
      country: customer.country.toUpperCase(),
      vatNumber: customer.vatNumber || null,
      vatNumberValidated: customer.vatNumberValidated ?? false,
      isBusiness: customer.isBusiness ?? true,
    };
    console.log('[VAT API] Supplier info:', supplierInfo);
    console.log('[VAT API] Customer info:', customerInfo);

    const vatRule = await determineVATRule(supplierInfo, customerInfo);
    console.log('[VAT API] VAT rule determined:', vatRule);

    // Validate prerequisites
    console.log('[VAT API] Validating invoice prerequisites...');
    const validation = validateInvoicePrerequisites(vatRule, customer, supplier);
    console.log('[VAT API] Validation result:', validation);

    if (!validation.valid) {
      console.error('[VAT API] Validation failed:', validation.errors);
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
    console.log('[VAT API] Calculating invoice with VAT for date:', date);
    console.log('[VAT API] Line items:', lineItems);
    const calculation = await calculateInvoiceWithVAT(lineItems, vatRule, date);
    console.log('[VAT API] Calculation result:', JSON.stringify(calculation, null, 2));

    const response = {
      success: true,
      data: {
        vatRule,
        calculation,
        validation: {
          errors: validation.errors,
          warnings: validation.warnings,
        },
      },
    };
    console.log('[VAT API] Sending success response');
    return NextResponse.json(response);
  } catch (error) {
    console.error('[VAT API] Error calculating invoice with VAT:', error);
    console.error('[VAT API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
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
