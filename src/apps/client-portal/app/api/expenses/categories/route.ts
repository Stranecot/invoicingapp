import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@invoice-app/auth/server';

export async function GET() {
  try {
    const user = await getCurrentUser();

    // Get system categories (userId = null) and user's custom categories
    const categories = await prisma.expenseCategory.findMany({
      where: {
        OR: [
          { userId: null }, // System categories
          { userId: user.id }, // User's custom categories
        ],
      },
      orderBy: [
        { isCustom: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching expense categories:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch expense categories' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    // Accountants cannot create categories
    if (user.role === 'ACCOUNTANT') {
      return NextResponse.json(
        { error: 'Forbidden: Accountants cannot create categories' },
        { status: 403 }
      );
    }

    const data = await request.json();

    console.log('Creating expense category with data:', data);

    // Check if category already exists for this user
    const existing = await prisma.expenseCategory.findFirst({
      where: {
        name: data.name,
        userId: user.id,
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 400 });
    }

    const category = await prisma.expenseCategory.create({
      data: {
        name: data.name,
        isCustom: true,
        userId: user.id,
      },
    });

    console.log('Expense category created successfully:', category.id);
    return NextResponse.json(category);
  } catch (error) {
    console.error('Error creating expense category:', error);
    return NextResponse.json(
      { error: 'Failed to create expense category', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
