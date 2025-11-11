import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth';
import { prisma } from '@invoice-app/database';

/**
 * GET /api/admin/users/[id]/activity
 * Get user activity log
 */
export const GET = withAdminAuth(async (req: NextRequest, adminUser, context) => {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Build activity timeline
    const activities = [];

    // Account creation event
    activities.push({
      id: `created-${user.id}`,
      type: 'created',
      description: 'Account created',
      createdAt: user.createdAt,
      metadata: {},
    });

    // Last login event (if available)
    if (user.lastLoginAt) {
      activities.push({
        id: `login-${user.id}`,
        type: 'login',
        description: 'Last login',
        createdAt: user.lastLoginAt,
        metadata: {},
      });
    }

    // Sort by date descending (most recent first)
    activities.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      activities,
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user activity' },
      { status: 500 }
    );
  }
});
