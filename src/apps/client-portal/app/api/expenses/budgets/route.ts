import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';

export async function GET() {
  try {
    const user = await getCurrentUser();

    // Get budgets based on role
    const budgets = await prisma.budget.findMany({
      where: user.role === 'USER' ? { userId: user.id } : {},
      include: {
        category: true,
      },
    });

    // Calculate current spending for each budget
    const now = new Date();
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        let startDate: Date;
        let endDate: Date;

        switch (budget.period) {
          case 'monthly':
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
            break;
          case 'quarterly':
            startDate = startOfQuarter(now);
            endDate = endOfQuarter(now);
            break;
          case 'yearly':
            startDate = startOfYear(now);
            endDate = endOfYear(now);
            break;
          default:
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
        }

        const expenses = await prisma.expense.aggregate({
          where: {
            userId: budget.userId,
            categoryId: budget.categoryId,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const spent = expenses._sum.amount || 0;
        const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;

        return {
          ...budget,
          spent,
          percentage,
          remaining: budget.limit - spent,
        };
      })
    );

    return NextResponse.json(budgetsWithSpending);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch budgets' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    // Accountants cannot manage budgets
    if (user.role === 'ACCOUNTANT') {
      return NextResponse.json(
        { error: 'Forbidden: Accountants cannot manage budgets' },
        { status: 403 }
      );
    }

    const data = await request.json();

    console.log('Updating/creating budget with data:', data);

    // Check if the budget exists and belongs to the user
    const existing = await prisma.budget.findUnique({
      where: {
        userId_categoryId: {
          userId: user.id,
          categoryId: data.categoryId,
        },
      },
    });

    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId: {
          userId: user.id,
          categoryId: data.categoryId,
        },
      },
      update: {
        limit: parseFloat(data.limit),
        period: data.period || 'monthly',
      },
      create: {
        userId: user.id,
        categoryId: data.categoryId,
        limit: parseFloat(data.limit),
        period: data.period || 'monthly',
      },
      include: {
        category: true,
      },
    });

    console.log('Budget updated/created successfully:', budget.id);
    return NextResponse.json(budget);
  } catch (error) {
    console.error('Error updating budget:', error);
    return NextResponse.json(
      { error: 'Failed to update budget', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
