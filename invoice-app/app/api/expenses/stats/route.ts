import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, getAccessibleCustomerIds } from '@/lib/auth';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const now = new Date();
    const startDate = startOfMonth(now);
    const endDate = endOfMonth(now);

    // Build where clause based on user role
    const where: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (user.role === 'USER') {
      where.userId = user.id;
    } else if (user.role === 'ACCOUNTANT') {
      const accessibleCustomerIds = await getAccessibleCustomerIds();
      where.customerId = {
        in: accessibleCustomerIds,
      };
    }
    // Admin has no additional filter

    // Total expenses this month
    const monthlyTotal = await prisma.expense.aggregate({
      where,
      _sum: {
        amount: true,
      },
    });

    // Expenses by category this month
    const expensesByCategory = await prisma.expense.groupBy({
      by: ['categoryId'],
      where,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get category details
    const categoriesWithExpenses = await Promise.all(
      expensesByCategory.map(async (item) => {
        const category = await prisma.expenseCategory.findUnique({
          where: { id: item.categoryId },
        });
        return {
          category: category?.name || 'Unknown',
          categoryId: item.categoryId,
          total: item._sum.amount || 0,
          count: item._count.id,
        };
      })
    );

    // Expenses by status
    const expensesByStatus = await prisma.expense.groupBy({
      by: ['status'],
      where: user.role === 'USER' ? { userId: user.id } :
             user.role === 'ACCOUNTANT' ? { customerId: { in: await getAccessibleCustomerIds() } } :
             {},
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Recent expenses (last 5)
    const recentExpenses = await prisma.expense.findMany({
      where: user.role === 'USER' ? { userId: user.id } :
             user.role === 'ACCOUNTANT' ? { customerId: { in: await getAccessibleCustomerIds() } } :
             {},
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        category: true,
        customer: true,
      },
    });

    // Total expenses all time
    const totalAllTime = await prisma.expense.aggregate({
      where: user.role === 'USER' ? { userId: user.id } :
             user.role === 'ACCOUNTANT' ? { customerId: { in: await getAccessibleCustomerIds() } } :
             {},
      _sum: {
        amount: true,
      },
    });

    return NextResponse.json({
      monthlyTotal: monthlyTotal._sum.amount || 0,
      totalAllTime: totalAllTime._sum.amount || 0,
      byCategory: categoriesWithExpenses,
      byStatus: expensesByStatus,
      recent: recentExpenses,
    });
  } catch (error) {
    console.error('Error fetching expense stats:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch expense stats' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
