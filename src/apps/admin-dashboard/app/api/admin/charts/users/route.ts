import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth';
import { prisma } from '@invoice-app/database';
import { format, subDays, startOfDay } from 'date-fns';

/**
 * GET /api/admin/charts/users
 * Get user growth chart data
 *
 * Query params:
 * - days: number of days to include (default: 30)
 *
 * Returns:
 * - Daily user signups for the last N days
 * - User count by role
 * - Active vs inactive users
 */
export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const days = Math.min(parseInt(searchParams.get('days') || '30'), 90);

    const startDate = startOfDay(subDays(new Date(), days));

    // Fetch user data
    const [allUsers, usersByRole, activeUsers] = await Promise.all([
      // All users with creation date
      prisma.user.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        select: {
          id: true,
          createdAt: true,
          role: true,
          isActive: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),

      // Users by role
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),

      // Active vs inactive
      prisma.user.groupBy({
        by: ['isActive'],
        _count: true,
      }),
    ]);

    // Build daily growth data
    const dailyGrowth: { date: string; count: number; cumulative: number }[] = [];
    const dateMap = new Map<string, number>();

    // Initialize all dates with 0
    for (let i = 0; i <= days; i++) {
      const date = format(subDays(new Date(), days - i), 'yyyy-MM-dd');
      dateMap.set(date, 0);
    }

    // Count users per day
    allUsers.forEach((user) => {
      const date = format(startOfDay(new Date(user.createdAt)), 'yyyy-MM-dd');
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });

    // Build cumulative data
    let cumulative = 0;
    Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, count]) => {
        cumulative += count;
        dailyGrowth.push({
          date,
          count,
          cumulative,
        });
      });

    // Format role data
    const roleData = usersByRole.map((item) => ({
      label: item.role,
      value: item._count,
    }));

    // Format active status data
    const activeStatusData = activeUsers.map((item) => ({
      label: item.isActive ? 'Active' : 'Inactive',
      value: item._count,
    }));

    return NextResponse.json({
      success: true,
      data: {
        dailyGrowth,
        byRole: roleData,
        byActiveStatus: activeStatusData,
        period: {
          days,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching user chart data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user chart data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
