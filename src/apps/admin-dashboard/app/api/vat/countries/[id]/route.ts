import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@invoice-app/database';

/**
 * GET /api/vat/countries/:id
 * Get detailed information about a specific country including all VAT rates
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const countryId = params.id.toUpperCase();

    const country = await prisma.country.findUnique({
      where: { id: countryId },
      include: {
        countryVatRates: {
          where: {
            effectiveUntil: null, // Only get current rates
          },
          include: {
            vatCategory: true,
          },
          orderBy: {
            vatRate: 'asc',
          },
        },
      },
    });

    if (!country) {
      return NextResponse.json(
        {
          success: false,
          error: 'Country not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: country,
    });
  } catch (error) {
    console.error('Error fetching country:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch country',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
