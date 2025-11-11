import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@invoice-app/database';
import { getAdminUser } from '@/lib/auth';

/**
 * GET /api/admin/invitations/[id]
 * Gets details of a specific invitation
 * Requires: ADMIN role
 * Returns: Full invitation details with organization and inviter info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    await getAdminUser();

    const { id } = await params;

    const invitation = await prisma.invitation.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Get inviter details
    const inviter = await prisma.user.findUnique({
      where: { id: invitation.invitedBy },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Get accepter details if accepted
    let accepter = null;
    if (invitation.acceptedBy) {
      accepter = await prisma.user.findUnique({
        where: { id: invitation.acceptedBy },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
    }

    // Return with token for copying (admin should be able to see it)
    return NextResponse.json({
      ...invitation,
      inviter: inviter || { id: invitation.invitedBy, name: 'Unknown', email: 'Unknown' },
      accepter,
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch invitation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/invitations/[id]
 * Revokes an invitation
 * Requires: ADMIN role
 * Returns: 204 No Content on success
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    await getAdminUser();

    const { id } = await params;

    const invitation = await prisma.invitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Only revoke PENDING invitations
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot revoke invitation with status: ${invitation.status}. Only PENDING invitations can be revoked.` },
        { status: 400 }
      );
    }

    // Soft delete by updating status to REVOKED
    await prisma.invitation.update({
      where: { id },
      data: { status: 'REVOKED' },
    });

    console.log('[Admin] Invitation revoked successfully:', id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error revoking invitation:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to revoke invitation' },
      { status: 500 }
    );
  }
}
