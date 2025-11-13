import { NextRequest, NextResponse } from 'next/server';
import { getVATRateForCategory } from '@invoice-app/database';

/**
 * GET /api/vat/rates/:country/:category
 * Get the VAT rate for a specific country and category
 * Query params:
 *   - date: ISO date string (optional, defaults to today)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { country: string; category: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const invoiceDate = dateParam ? new Date(dateParam) : new Date();

    const countryCode = params.country.toUpperCase();
    const categoryCode = params.category.toUpperCase();

    const rateInfo = await getVATRateForCategory(
      countryCode,
      categoryCode,
      invoiceDate
    );

    return NextResponse.json({
      success: true,
      data: {
        country: countryCode,
        category: categoryCode,
        rate: rateInfo.rate,
        rateType: rateInfo.type,
        date: invoiceDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching VAT rate:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch VAT rate',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
