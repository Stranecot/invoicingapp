import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth';
import { prisma } from '@invoice-app/database';

// GET /api/admin/organizations/[id]/stats - Get organization statistics
export const GET = withAdminAuth(async (req: NextRequest, user, context?: { params: Promise<{ id: string }> }) => {
  try {
    const params = context?.params ? await context.params : { id: '' };
    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: params.id },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get statistics
    const [
      totalUsers,
      activeUsers,
      totalInvoices,
      totalCustomers,
      totalExpenses,
      pendingInvitations,
      recentActivity,
    ] = await Promise.all([
      // Total users
      prisma.user.count({
        where: { organizationId: params.id },
      }),
      // Active users (logged in within last 30 days)
      prisma.user.count({
        where: {
          organizationId: params.id,
          isActive: true,
          lastLoginAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // Total invoices
      prisma.invoice.count({
        where: { organizationId: params.id },
      }),
      // Total customers
      prisma.customer.count({
        where: { organizationId: params.id },
      }),
      // Total expenses
      prisma.expense.count({
        where: { organizationId: params.id },
      }),
      // Pending invitations
      prisma.invitation.count({
        where: {
          organizationId: params.id,
          status: 'PENDING',
          expiresAt: { gte: new Date() },
        },
      }),
      // Recent activity (last 10 users who logged in)
      prisma.user.findMany({
        where: {
          organizationId: params.id,
          lastLoginAt: { not: null },
        },
        select: {
          id: true,
          email: true,
          name: true,
          lastLoginAt: true,
        },
        orderBy: { lastLoginAt: 'desc' },
        take: 10,
      }),
    ]);

    // Calculate invoice totals
    const invoiceTotals = await prisma.invoice.aggregate({
      where: { organizationId: params.id },
      _sum: { total: true },
    });

    const expenseTotals = await prisma.expense.aggregate({
      where: { organizationId: params.id },
      _sum: { amount: true },
    });

    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        limit: organization.maxUsers,
        utilization: (totalUsers / organization.maxUsers) * 100,
      },
      invoices: {
        total: totalInvoices,
        totalAmount: invoiceTotals._sum.total || 0,
      },
      customers: {
        total: totalCustomers,
      },
      expenses: {
        total: totalExpenses,
        totalAmount: expenseTotals._sum.amount || 0,
      },
      invitations: {
        pending: pendingInvitations,
      },
      recentActivity,
    });
  } catch (error) {
    console.error('Error fetching organization stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization statistics' },
      { status: 500 }
    );
  }
});
