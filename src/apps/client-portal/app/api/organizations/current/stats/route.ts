import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@invoice-app/database';
import { requireAdmin } from '@invoice-app/auth/server';

/**
 * GET /api/organizations/current/stats
 * Gets detailed statistics for the current user's organization
 * Requires: ADMIN role
 * Returns: Organization statistics including users, invitations, and usage metrics
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin access
    const admin = await requireAdmin();

    // Get admin's organization
    const adminUser = await prisma.user.findUnique({
      where: { id: admin.id },
      select: { organizationId: true },
    });

    if (!adminUser?.organizationId) {
      return NextResponse.json(
        { error: 'Admin must belong to an organization' },
        { status: 400 }
      );
    }

    const organizationId = adminUser.organizationId;

    // Get total users count
    const totalUsers = await prisma.user.count({
      where: { organizationId },
    });

    // Get active users count
    const activeUsers = await prisma.user.count({
      where: {
        organizationId,
        isActive: true,
      },
    });

    // Get pending invitations count
    const pendingInvitations = await prisma.invitation.count({
      where: {
        organizationId,
        status: 'PENDING',
      },
    });

    // Get accepted invitations in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentAcceptedInvitations = await prisma.invitation.count({
      where: {
        organizationId,
        status: 'ACCEPTED',
        acceptedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Get users by role breakdown
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      where: { organizationId },
      _count: true,
    });

    const roleBreakdown = {
      ADMIN: usersByRole.find(r => r.role === 'ADMIN')?._count || 0,
      USER: usersByRole.find(r => r.role === 'USER')?._count || 0,
      ACCOUNTANT: usersByRole.find(r => r.role === 'ACCOUNTANT')?._count || 0,
    };

    // Get organization to check maxUsers
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { maxUsers: true },
    });

    const maxUsers = organization?.maxUsers || 5;
    const usagePercentage = Math.round((totalUsers / maxUsers) * 100);

    // Get invitation statistics
    const invitationStats = await prisma.invitation.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: true,
    });

    const invitationBreakdown = {
      PENDING: invitationStats.find(i => i.status === 'PENDING')?._count || 0,
      ACCEPTED: invitationStats.find(i => i.status === 'ACCEPTED')?._count || 0,
      EXPIRED: invitationStats.find(i => i.status === 'EXPIRED')?._count || 0,
      REVOKED: invitationStats.find(i => i.status === 'REVOKED')?._count || 0,
    };

    // Get storage/usage metrics (invoice and expense counts as proxy for storage)
    const invoiceCount = await prisma.invoice.count({
      where: { organizationId },
    });

    const expenseCount = await prisma.expense.count({
      where: { organizationId },
    });

    const customerCount = await prisma.customer.count({
      where: { organizationId },
    });

    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        maxUsers,
        usagePercentage,
        byRole: roleBreakdown,
      },
      invitations: {
        pending: pendingInvitations,
        recentlyAccepted: recentAcceptedInvitations,
        byStatus: invitationBreakdown,
      },
      resources: {
        invoices: invoiceCount,
        expenses: expenseCount,
        customers: customerCount,
      },
      limits: {
        users: {
          current: totalUsers,
          max: maxUsers,
          remaining: maxUsers - totalUsers,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching organization stats:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch organization stats' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
