import { NextRequest, NextResponse } from 'next/server';
import { prisma, generateInvitationToken, generateInvitationExpiry } from '@invoice-app/database';
import { getAdminUser } from '@/lib/auth';

/**
 * POST /api/admin/invitations/[id]/resend
 * Resends an invitation by generating a new token and expiry
 * Requires: ADMIN role
 * Returns: Success message with updated invitation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    await getAdminUser();

    const { id } = await params;

    // Find invitation
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

    // Can only resend PENDING or EXPIRED invitations
    if (invitation.status !== 'PENDING' && invitation.status !== 'EXPIRED') {
      return NextResponse.json(
        { error: `Cannot resend invitation with status: ${invitation.status}. Only PENDING or EXPIRED invitations can be resent.` },
        { status: 400 }
      );
    }

    // Generate new token and expiry
    const newToken = generateInvitationToken();
    const newExpiresAt = generateInvitationExpiry(7); // 7 days from now

    // Update invitation with new token, expiry, and sentAt timestamp
    const updatedInvitation = await prisma.invitation.update({
      where: { id },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
        invitedAt: new Date(), // Update sentAt to current time
        // Reset status to PENDING if it was EXPIRED
        status: 'PENDING',
      },
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

    console.log('[Admin] Invitation resent successfully:', updatedInvitation.id);

    // TODO: Send invitation email
    // This will need the email service configured

    // Remove sensitive token from response
    const { token, ...sanitizedInvitation } = updatedInvitation;

    return NextResponse.json({
      message: 'Invitation resent successfully',
      invitation: sanitizedInvitation,
    });
  } catch (error) {
    console.error('Error resending invitation:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to resend invitation' },
      { status: 500 }
    );
  }
}
