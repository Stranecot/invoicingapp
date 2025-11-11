import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth';
import { prisma } from '@invoice-app/database';
import { getCurrentMonthRange } from '@/lib/date-utils';

/**
 * GET /api/admin/stats
 * Get overall dashboard statistics
 *
 * Returns:
 * - Total organizations count with status breakdown
 * - Total users count (active vs inactive)
 * - Total invitations by status
 * - Growth metrics (new orgs/users this month)
 */
export const GET = withAdminAuth(async () => {
  try {
    const { start: monthStart } = getCurrentMonthRange();

    // Fetch all data in parallel for better performance
    const [
      totalOrganizations,
      organizationsByStatus,
      totalUsers,
      activeUsers,
      totalInvitations,
      invitationsByStatus,
      newOrgsThisMonth,
      newUsersThisMonth,
      allOrganizations,
      allUsers,
    ] = await Promise.all([
      // Total organizations
      prisma.organization.count(),

      // Organizations by status
      prisma.organization.groupBy({
        by: ['status'],
        _count: true,
      }),

      // Total users
      prisma.user.count(),

      // Active users
      prisma.user.count({
        where: { isActive: true },
      }),

      // Total invitations
      prisma.invitation.count(),

      // Invitations by status
      prisma.invitation.groupBy({
        by: ['status'],
        _count: true,
      }),

      // New organizations this month
      prisma.organization.count({
        where: {
          createdAt: {
            gte: monthStart,
          },
        },
      }),

      // New users this month
      prisma.user.count({
        where: {
          createdAt: {
            gte: monthStart,
          },
        },
      }),

      // All organizations with user count
      prisma.organization.findMany({
        select: {
          id: true,
          name: true,
          status: true,
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

      // Recent users for additional stats
      prisma.user.findMany({
        select: {
          createdAt: true,
          lastLoginAt: true,
        },
      }),
    ]);

    // Calculate additional metrics
    const inactiveUsers = totalUsers - activeUsers;

    // Count users who logged in this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const activeThisWeek = allUsers.filter(
      (u) => u.lastLoginAt && new Date(u.lastLoginAt) >= oneWeekAgo
    ).length;

    // Convert grouped data to objects
    const orgStatusBreakdown = organizationsByStatus.reduce(
      (acc, item) => {
        acc[item.status] = item._count;
        return acc;
      },
      {} as Record<string, number>
    );

    const invitationStatusBreakdown = invitationsByStatus.reduce(
      (acc, item) => {
        acc[item.status] = item._count;
        return acc;
      },
      {} as Record<string, number>
    );

    // Top organizations by user count
    const topOrganizations = allOrganizations.map((org) => ({
      id: org.id,
      name: org.name,
      status: org.status,
      userCount: org._count.users,
    }));

    return NextResponse.json({
      success: true,
      data: {
        organizations: {
          total: totalOrganizations,
          byStatus: orgStatusBreakdown,
          newThisMonth: newOrgsThisMonth,
          top: topOrganizations,
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers,
          activeThisWeek,
          newThisMonth: newUsersThisMonth,
        },
        invitations: {
          total: totalInvitations,
          byStatus: invitationStatusBreakdown,
          pending: invitationStatusBreakdown.PENDING || 0,
          accepted: invitationStatusBreakdown.ACCEPTED || 0,
          expired: invitationStatusBreakdown.EXPIRED || 0,
          revoked: invitationStatusBreakdown.REVOKED || 0,
        },
        growth: {
          organizationsThisMonth: newOrgsThisMonth,
          usersThisMonth: newUsersThisMonth,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
