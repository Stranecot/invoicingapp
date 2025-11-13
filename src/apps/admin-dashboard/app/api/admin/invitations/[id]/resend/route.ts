import { NextRequest, NextResponse } from 'next/server';
import { prisma, generateInvitationToken, generateInvitationExpiry } from '@invoice-app/database';
import { getAdminUser } from '@/lib/auth';
import { sendInvitationEmail } from '@invoice-app/email';
import { ensureEmailClientInitialized, getAppUrl, getRecipientEmail } from '@/lib/email';

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
    const adminUser = await getAdminUser();

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

    // Send invitation email (don't fail if email fails)
    if (ensureEmailClientInitialized()) {
      try {
        const clientPortalUrl = process.env.CLIENT_PORTAL_URL || 'http://localhost:3000';
        const acceptUrl = `${clientPortalUrl}/accept-invitation?token=${newToken}`;
        const recipientEmail = getRecipientEmail(updatedInvitation.email);

        console.log('[Email] Attempting to send invitation email to:', recipientEmail);
        console.log('[Email] Accept URL:', acceptUrl);

        const emailResult = await sendInvitationEmail({
          to: recipientEmail,
          organizationName: updatedInvitation.organization.name,
          inviterName: adminUser.name || adminUser.email,
          role: updatedInvitation.role,
          token: newToken,
          expiresAt: newExpiresAt,
          acceptUrl,
        });

        if (emailResult.success) {
          console.log('[Email] Invitation email sent successfully:', emailResult.messageId);
        } else {
          console.error('[Email] Failed to send invitation email:', emailResult.error);
          // Don't fail the request - invitation was updated successfully
        }
      } catch (emailError) {
        console.error('[Email] Error sending invitation email:', emailError);
        // Don't fail the request - invitation was updated successfully
      }
    } else {
      console.warn('[Email] Email service not configured - invitation updated but email not sent');
    }

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
