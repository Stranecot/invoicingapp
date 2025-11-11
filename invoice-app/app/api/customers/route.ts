import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, getAccessibleCustomerIds } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();

    let customers;

    if (user.role === 'ADMIN') {
      // Admin sees all customers
      customers = await prisma.customer.findMany({
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
    } else if (user.role === 'USER') {
      // User sees only their own customers
      customers = await prisma.customer.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
    } else if (user.role === 'ACCOUNTANT') {
      // Accountant sees only assigned customers
      const customerIds = await getAccessibleCustomerIds();
      customers = await prisma.customer.findMany({
        where: { id: { in: customerIds } },
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

    // Remove userId from data if present (security)
    delete data.userId;

    // Create customer for the current user (or specified user if admin)
    const customer = await prisma.customer.create({
      data: {
        ...data,
        userId: user.id, // Always assign to current user for now
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
