import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isInvitationExpired } from '@invoice-app/database';
import { isValidTokenFormat, setInvitationCookie } from '@/lib/invitation-cookie';

/**
 * POST /api/invitations/accept
 * Accepts an invitation and redirects to Clerk sign-up (public endpoint, no auth required)
 *
 * Request body:
 * - token: The invitation token
 *
 * Response:
 * - 200: { success: true, redirectUrl: string }
 * - 400: { error: string, reason?: string }
 * - 500: { error: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Missing token in request body' },
        { status: 400 }
      );
    }

    // Validate token format
    if (!isValidTokenFormat(token)) {
      return NextResponse.json(
        { error: 'Invalid token format', reason: 'not_found' },
        { status: 400 }
      );
    }

    // Look up invitation by token
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    // Token not found
    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found', reason: 'not_found' },
        { status: 400 }
      );
    }

    // Check if already used
    if (invitation.status === 'ACCEPTED') {
      return NextResponse.json(
        { error: 'Invitation has already been used', reason: 'already_used' },
        { status: 400 }
      );
    }

    // Check if revoked
    if (invitation.status === 'REVOKED') {
      return NextResponse.json(
        { error: 'Invitation has been revoked', reason: 'revoked' },
        { status: 400 }
      );
    }

    // Check if expired
    if (isInvitationExpired(invitation.expiresAt)) {
      // Update status to EXPIRED if not already
      if (invitation.status === 'PENDING') {
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { status: 'EXPIRED' },
        });
      }

      return NextResponse.json(
        { error: 'Invitation has expired', reason: 'expired' },
        { status: 400 }
      );
    }

    // Check if status is PENDING
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Invitation is not valid', reason: 'not_found' },
        { status: 400 }
      );
    }

    // Store token in secure cookie for webhook to access
    await setInvitationCookie(token, invitation.expiresAt);

    // Generate Clerk sign-up URL with invitation context
    const clerkSignUpUrl = new URL('/sign-up', request.url);

    // Pre-fill email in Clerk sign-up form
    clerkSignUpUrl.searchParams.set('email_address', invitation.email);

    // Add organization context as metadata (Clerk will pass this through)
    clerkSignUpUrl.searchParams.set('redirect_url', '/');

    // Return success with redirect URL
    return NextResponse.json(
      {
        success: true,
        redirectUrl: clerkSignUpUrl.toString(),
        organization: invitation.organization.name,
        email: invitation.email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
