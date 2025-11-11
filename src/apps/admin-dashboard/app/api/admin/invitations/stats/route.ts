import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@invoice-app/database';
import { withAdminAuth } from '@/lib/auth';

/**
 * GET /api/admin/invitations/stats
 * Get invitation statistics across all organizations
 * Requires: ADMIN role
 * Returns: Statistics for PENDING, ACCEPTED, EXPIRED, REVOKED invitations
 */
export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    // Update expired invitations first
    const now = new Date();
    await prisma.invitation.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lt: now,
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    // Get counts for each status
    const [pending, accepted, expired, revoked, total] = await Promise.all([
      prisma.invitation.count({ where: { status: 'PENDING' } }),
      prisma.invitation.count({ where: { status: 'ACCEPTED' } }),
      prisma.invitation.count({ where: { status: 'EXPIRED' } }),
      prisma.invitation.count({ where: { status: 'REVOKED' } }),
      prisma.invitation.count(),
    ]);

    // Get recent invitations (last 7 days)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentInvitations = await prisma.invitation.count({
      where: {
        invitedAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Get invitations expiring soon (next 3 days)
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const expiringSoon = await prisma.invitation.count({
      where: {
        status: 'PENDING',
        expiresAt: {
          lte: threeDaysFromNow,
          gte: now,
        },
      },
    });

    return NextResponse.json({
      stats: {
        pending,
        accepted,
        expired,
        revoked,
        total,
        recentInvitations,
        expiringSoon,
      },
    });
  } catch (error) {
    console.error('Error fetching invitation stats:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch invitation stats' },
      { status: 500 }
    );
  }
});
