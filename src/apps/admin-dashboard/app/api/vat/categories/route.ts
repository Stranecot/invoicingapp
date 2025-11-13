import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@invoice-app/database';

/**
 * GET /api/vat/categories
 * List all VAT categories
 */
export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.vatCategory.findMany({
      orderBy: {
        code: 'asc',
      },
      select: {
        id: true,
        code: true,
        nameEn: true,
        nameBg: true,
        description: true,
        annexIiiCategory: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: categories,
      count: categories.length,
    });
  } catch (error) {
    console.error('Error fetching VAT categories:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch VAT categories',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
