import { NextRequest, NextResponse } from 'next/server';
import { prisma, determineVATRule } from '@invoice-app/database';

/**
 * GET /api/vat/rule/:orgId/:customerId
 * Get the VAT rule for a specific organization and customer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string; customerId: string } }
) {
  try {
    const { orgId, customerId } = params;

    // Fetch organization
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        country: true,
        vatNumber: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          error: 'Organization not found',
        },
        { status: 404 }
      );
    }

    // Fetch customer
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        country: true,
        vatNumber: true,
        vatNumberValidated: true,
        isBusiness: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Customer not found',
        },
        { status: 404 }
      );
    }

    if (!organization.country || !customer.country) {
      return NextResponse.json(
        {
          success: false,
          error: 'Both organization and customer must have a country set',
        },
        { status: 400 }
      );
    }

    const vatRule = await determineVATRule(
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

    return NextResponse.json({
      success: true,
      data: {
        organizationId: orgId,
        customerId: customerId,
        vatRule,
      },
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
