import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth';
import { prisma } from '@invoice-app/database';

export type ActivityType =
  | 'user_signup'
  | 'user_login'
  | 'invitation_sent'
  | 'invitation_accepted'
  | 'organization_created'
  | 'organization_status_changed';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * GET /api/admin/activity
 * Get recent activity feed
 *
 * Query params:
 * - limit: number of items to return (default: 20, max: 50)
 *
 * Returns recent system events including:
 * - User signups
 * - Invitation activity
 * - Organization changes
 */
export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    // Fetch recent data in parallel
    const [recentUsers, recentInvitations, recentOrganizations] = await Promise.all([
      // Recent user signups
      prisma.user.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          lastLoginAt: true,
          organizationId: true,
          organization: {
            select: {
              name: true,
            },
          },
        },
      }),

      // Recent invitations
      prisma.invitation.findMany({
        take: limit,
        orderBy: { invitedAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          invitedAt: true,
          acceptedAt: true,
          organization: {
            select: {
              name: true,
            },
          },
        },
      }),

      // Recent organizations
      prisma.organization.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              users: true,
            },
          },
        },
      }),
    ]);

    // Build activity feed
    const activities: ActivityItem[] = [];

    // Add user signups
    recentUsers.forEach((user) => {
      activities.push({
        id: `user-signup-${user.id}`,
        type: 'user_signup',
        title: 'New user signup',
        description: `${user.name || user.email} joined${
          user.organization ? ` ${user.organization.name}` : ''
        }`,
        timestamp: user.createdAt,
        metadata: {
          userId: user.id,
          email: user.email,
          organizationId: user.organizationId,
        },
      });
    });

    // Add invitation activity
    recentInvitations.forEach((invitation) => {
      if (invitation.status === 'ACCEPTED' && invitation.acceptedAt) {
        activities.push({
          id: `invitation-accepted-${invitation.id}`,
          type: 'invitation_accepted',
          title: 'Invitation accepted',
          description: `${invitation.email} accepted invitation to ${invitation.organization.name} as ${invitation.role}`,
          timestamp: invitation.acceptedAt,
          metadata: {
            invitationId: invitation.id,
            email: invitation.email,
            role: invitation.role,
          },
        });
      } else if (invitation.status === 'PENDING') {
        activities.push({
          id: `invitation-sent-${invitation.id}`,
          type: 'invitation_sent',
          title: 'Invitation sent',
          description: `Invitation sent to ${invitation.email} for ${invitation.organization.name} (${invitation.role})`,
          timestamp: invitation.invitedAt,
          metadata: {
            invitationId: invitation.id,
            email: invitation.email,
            role: invitation.role,
          },
        });
      }
    });

    // Add organization creation
    recentOrganizations.forEach((org) => {
      activities.push({
        id: `org-created-${org.id}`,
        type: 'organization_created',
        title: 'Organization created',
        description: `${org.name} was created (${org.status})`,
        timestamp: org.createdAt,
        metadata: {
          organizationId: org.id,
          name: org.name,
          status: org.status,
          userCount: org._count.users,
        },
      });

      // Check if status was recently changed (different from created date)
      if (org.updatedAt.getTime() !== org.createdAt.getTime()) {
        activities.push({
          id: `org-status-${org.id}`,
          type: 'organization_status_changed',
          title: 'Organization status changed',
          description: `${org.name} status updated to ${org.status}`,
          timestamp: org.updatedAt,
          metadata: {
            organizationId: org.id,
            name: org.name,
            status: org.status,
          },
        });
      }
    });

    // Sort by timestamp descending and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        activities: sortedActivities,
        total: sortedActivities.length,
      },
    });
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch activity feed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
