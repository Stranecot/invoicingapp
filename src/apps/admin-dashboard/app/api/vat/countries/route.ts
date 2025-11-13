import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@invoice-app/database';

/**
 * GET /api/vat/countries
 * List all countries with their VAT information
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const euOnly = searchParams.get('euOnly') === 'true';
    const active = searchParams.get('active') === 'true';

    const where: any = {};
    if (euOnly) {
      where.isEuMember = true;
    }
    if (active) {
      where.active = true;
    }

    const countries = await prisma.country.findMany({
      where,
      orderBy: {
        nameEn: 'asc',
      },
      select: {
        id: true,
        alpha3: true,
        nameEn: true,
        nameLocal: true,
        isEuMember: true,
        isEeaMember: true,
        standardVatRate: true,
        currencyCode: true,
        region: true,
        active: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: countries,
      count: countries.length,
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch countries',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
