import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@invoice-app/auth/server';

export async function GET() {
  try {
    const user = await getCurrentUser();

    // Admin can view any company (for now, return first one or implement selection)
    if (user.role === 'ADMIN') {
      const company = await prisma.company.findFirst();
      return NextResponse.json(company);
    }

    // Regular users and accountants see their own company
    const company = await prisma.company.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch company' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    // Only users can update their own company settings
    // Accountants have read-only access
    if (user.role === 'ACCOUNTANT') {
      return NextResponse.json(
        { error: 'Forbidden: Accountants cannot modify company settings' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Remove userId from data if present (security)
    delete data.userId;
    delete data.id;

    let company;

    if (user.role === 'ADMIN') {
      // Admin can update any company (for now, first one)
      company = await prisma.company.findFirst();
      if (!company) {
        return NextResponse.json(
          { error: 'No company found' },
          { status: 404 }
        );
      }
    } else {
      // Regular user updates their own company
      company = await prisma.company.findUnique({
        where: { userId: user.id },
      });
    }

    if (!company) {
      // Create company for user if doesn't exist (shouldn't happen with webhook)
      const newCompany = await prisma.company.create({
        data: {
          ...data,
          userId: user.id,
        },
      });
      return NextResponse.json(newCompany);
    }

    const updatedCompany = await prisma.company.update({
      where: { id: company.id },
      data,
    });

    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update company' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
