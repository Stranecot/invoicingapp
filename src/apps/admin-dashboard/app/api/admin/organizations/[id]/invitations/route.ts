import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth';
import { prisma } from '@invoice-app/database';

// GET /api/admin/organizations/[id]/invitations - Get organization invitations
export const GET = withAdminAuth(async (req: NextRequest, user, context?: { params: Promise<{ id: string }> }) => {
  try {
    const params = context?.params ? await context.params : { id: '' };
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

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

    // Get invitations with pagination
    const [invitations, total] = await Promise.all([
      prisma.invitation.findMany({
        where: { organizationId: params.id },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          invitedAt: true,
          expiresAt: true,
          acceptedAt: true,
          invitedBy: true,
        },
        orderBy: { invitedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invitation.count({
        where: { organizationId: params.id },
      }),
    ]);

    return NextResponse.json({
      invitations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching organization invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization invitations' },
      { status: 500 }
    );
  }
});
