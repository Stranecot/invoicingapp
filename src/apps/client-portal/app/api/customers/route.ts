import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, getAccessibleCustomerIds } from '@invoice-app/auth/server';

export async function GET() {
  try {
    const user = await getCurrentUser();

    // CRITICAL SECURITY: Build organization-scoped filter
    const orgFilter = user.organizationId ? { organizationId: user.organizationId } : {};

    let customers;

    if (user.role === 'ADMIN' || user.role === 'OWNER') {
      // Admin and Owner see all customers in their organization
      customers = await prisma.customer.findMany({
        where: orgFilter,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    } else if (user.role === 'USER' || user.role === 'EMPLOYEE') {
      // User and Employee see only their own customers in their organization
      customers = await prisma.customer.findMany({
        where: {
          userId: user.id,
          ...orgFilter,
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (user.role === 'ACCOUNTANT') {
      // Accountant sees only assigned customers in their organization
      const customerIds = await getAccessibleCustomerIds();
      customers = await prisma.customer.findMany({
        where: {
          id: { in: customerIds },
          ...orgFilter,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    } else {
      customers = [];
    }

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch customers' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    // Only users and admins can create customers
    // Accountants have read-only access
    if (user.role === 'ACCOUNTANT') {
      return NextResponse.json(
        { error: 'Forbidden: Accountants cannot create customers' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Remove userId and organizationId from data if present (security)
    delete data.userId;
    delete data.organizationId;

    // CRITICAL SECURITY: Auto-fill registrationNumber for PERSON type
    if (data.type === 'PERSON') {
      data.registrationNumber = '9999999999';
    }

    // CRITICAL SECURITY: Create customer with organizationId from current user
    const customer = await prisma.customer.create({
      data: {
        ...data,
        userId: user.id, // Always assign to current user for now
        organizationId: user.organizationId,
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create customer' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
