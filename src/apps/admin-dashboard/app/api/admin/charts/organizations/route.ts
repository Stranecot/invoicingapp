import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth';
import { prisma } from '@invoice-app/database';

/**
 * GET /api/admin/charts/organizations
 * Get organization chart data
 *
 * Returns:
 * - Organization count by status
 * - Organization count by plan
 * - Top organizations by user count
 */
export const GET = withAdminAuth(async () => {
  try {
    // Fetch organization data
    const [byStatus, byPlan, topOrganizations] = await Promise.all([
      // Organizations by status
      prisma.organization.groupBy({
        by: ['status'],
        _count: true,
      }),

      // Organizations by plan
      prisma.organization.groupBy({
        by: ['plan'],
        _count: true,
      }),

      // Top organizations by user count
      prisma.organization.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          plan: true,
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: {
          users: {
            _count: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    // Format data for charts
    const statusData = byStatus.map((item) => ({
      label: item.status,
      value: item._count,
    }));

    const planData = byPlan.map((item) => ({
      label: item.plan,
      value: item._count,
    }));

    const topOrgsData = topOrganizations.map((org) => ({
      id: org.id,
      name: org.name,
      status: org.status,
      plan: org.plan,
      userCount: org._count.users,
    }));

    return NextResponse.json({
      success: true,
      data: {
        byStatus: statusData,
        byPlan: planData,
        topOrganizations: topOrgsData,
      },
    });
  } catch (error) {
    console.error('Error fetching organization chart data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch organization chart data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
