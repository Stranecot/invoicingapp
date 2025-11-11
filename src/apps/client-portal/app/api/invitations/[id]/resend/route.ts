import { NextRequest, NextResponse } from 'next/server';
import { prisma, generateInvitationToken, generateInvitationExpiry } from '@invoice-app/database';
import { requireAdmin } from '@invoice-app/auth/server';
import { sendInvitationEmail } from '@invoice-app/email';
import { ensureEmailClientInitialized, getAppUrl, getRecipientEmail } from '@/lib/email';

/**
 * POST /api/invitations/[id]/resend
 * Resends an invitation by generating a new token and expiry
 * Requires: ADMIN role
 * Returns: Success message with updated sentAt timestamp
 * Note: Can only resend PENDING invitations that haven't expired
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Find invitation
    const invitation = await prisma.invitation.findUnique({
      where: { id: params.id },
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

    // Validate invitation belongs to admin's organization
    if (invitation.organizationId !== adminUser.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden: This invitation belongs to another organization' },
        { status: 403 }
      );
    }

    // Check invitation status
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot resend invitation with status: ${invitation.status}. Only PENDING invitations can be resent.` },
        { status: 400 }
      );
    }

    // Generate new token and expiry
    const newToken = generateInvitationToken();
    const newExpiresAt = generateInvitationExpiry(7); // 7 days from now

    // Update invitation with new token, expiry, and sentAt timestamp
    const updatedInvitation = await prisma.invitation.update({
      where: { id: params.id },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
        invitedAt: new Date(), // Update sentAt to current time
        // If the invitation was expired, reset it to PENDING
        ...(invitation.status === 'EXPIRED' ? { status: 'PENDING' } : {}),
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

    console.log('Invitation resent successfully:', updatedInvitation.id);

    // Send invitation email with new token (don't fail if email fails)
    if (ensureEmailClientInitialized()) {
      try {
        const appUrl = getAppUrl();
        const acceptUrl = `${appUrl}/invitations/accept/${newToken}`;
        const recipientEmail = getRecipientEmail(updatedInvitation.email);

        // Get inviter name
        const inviter = await prisma.user.findUnique({
          where: { id: admin.id },
          select: { firstName: true, lastName: true, email: true },
        });

        const inviterName = inviter
          ? `${inviter.firstName} ${inviter.lastName}`.trim() || inviter.email
          : undefined;

        const emailResult = await sendInvitationEmail({
          to: recipientEmail,
          organizationName: updatedInvitation.organization.name,
          inviterName,
          role: updatedInvitation.role,
          token: newToken,
          expiresAt: newExpiresAt,
          acceptUrl,
        });

        if (emailResult.success) {
          console.log('[Email] Invitation resend email sent successfully:', emailResult.messageId);
        } else {
          console.error('[Email] Failed to send invitation resend email:', emailResult.error);
          // Don't fail the request - invitation was updated successfully
        }
      } catch (emailError) {
        console.error('[Email] Error sending invitation resend email:', emailError);
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

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to resend invitation' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
