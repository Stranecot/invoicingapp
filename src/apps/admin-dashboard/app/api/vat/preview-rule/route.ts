import { NextRequest, NextResponse } from 'next/server';
import { determineVATRule } from '@invoice-app/database';

/**
 * POST /api/vat/preview-rule
 * Preview the VAT rule that would apply for a supplier-customer combination
 *
 * Request body:
 * {
 *   supplier: {
 *     country: string (ISO 2-letter code),
 *     isVatRegistered: boolean
 *   },
 *   customer: {
 *     country: string (ISO 2-letter code),
 *     vatNumber: string | null,
 *     vatNumberValidated: boolean,
 *     isBusiness: boolean
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { supplier, customer } = body;

    // Validate inputs
    if (!supplier || !customer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: supplier and customer',
        },
        { status: 400 }
      );
    }

    if (!supplier.country || !customer.country) {
      return NextResponse.json(
        {
          success: false,
          error: 'Both supplier and customer must have a country',
        },
        { status: 400 }
      );
    }

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

    return NextResponse.json({
      success: true,
      data: vatRule,
    });
  } catch (error) {
    console.error('Error determining VAT rule:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to determine VAT rule',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
