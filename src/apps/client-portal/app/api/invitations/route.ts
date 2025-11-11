import { NextRequest, NextResponse } from 'next/server';
import { prisma, Role, InvitationStatus, generateInvitationToken, generateInvitationExpiry } from '@invoice-app/database';
import { getCurrentUser, requireAdmin } from '@invoice-app/auth/server';
import { sendInvitationEmail } from '@invoice-app/email';
import { ensureEmailClientInitialized, getAppUrl, getRecipientEmail } from '@/lib/email';
import { z } from 'zod';

/**
 * Validation schema for creating invitations
 */
const createInvitationSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['ADMIN', 'USER', 'ACCOUNTANT'], {
    errorMap: () => ({ message: 'Role must be ADMIN, USER, or ACCOUNTANT' }),
  }),
});

/**
 * GET /api/invitations
 * Lists all invitations for the admin's organization with optional filtering
 * Requires: ADMIN role
 * Query params:
 *   - status: Filter by invitation status (PENDING, ACCEPTED, EXPIRED, REVOKED)
 *   - email: Filter by email (partial match)
 *   - limit: Number of results (default: 50, max: 100)
 *   - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin access
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as InvitationStatus | null;
    const email = searchParams.get('email');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {
      organizationId: adminUser.organizationId,
    };

    if (status) {
      where.status = status;
    }

    if (email) {
      where.email = {
        contains: email,
        mode: 'insensitive',
      };
    }

    // Fetch invitations with related data
    const invitations = await prisma.invitation.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { invitedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.invitation.count({ where });

    // Remove sensitive token from response
    const sanitizedInvitations = invitations.map(({ token, ...invitation }) => invitation);

    return NextResponse.json({
      data: sanitizedInvitations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch invitations' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

/**
 * POST /api/invitations
 * Creates a new invitation for a user to join the organization
 * Requires: ADMIN role
 * Body: { email: string, role: 'ADMIN' | 'USER' | 'ACCOUNTANT' }
 * Returns: Created invitation object (token excluded)
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin access
    const admin = await requireAdmin();

    // Get admin's organization
    const adminUser = await prisma.user.findUnique({
      where: { id: admin.id },
      select: { organizationId: true, organization: true },
    });

    if (!adminUser?.organizationId) {
      return NextResponse.json(
        { error: 'Admin must belong to an organization' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createInvitationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { email, role } = validation.data;

    // Check if user already exists in the organization
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        organizationId: adminUser.organizationId,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists in your organization' },
        { status: 409 }
      );
    }

    // Check if there's already a pending invitation for this email
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        organizationId: adminUser.organizationId,
        status: 'PENDING',
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'A pending invitation already exists for this email' },
        { status: 409 }
      );
    }

    // Check organization user limits
    if (adminUser.organization) {
      const currentUserCount = await prisma.user.count({
        where: { organizationId: adminUser.organizationId },
      });

      if (currentUserCount >= adminUser.organization.maxUsers) {
        return NextResponse.json(
          { error: `Organization has reached maximum user limit (${adminUser.organization.maxUsers})` },
          { status: 403 }
        );
      }
    }

    // Generate invitation token and expiry
    const token = generateInvitationToken();
    const expiresAt = generateInvitationExpiry(7); // 7 days from now

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        email,
        role: role as Role,
        organizationId: adminUser.organizationId,
        invitedBy: admin.id,
        token,
        expiresAt,
        status: 'PENDING',
        customerIds: [],
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

    console.log('Invitation created successfully:', invitation.id);

    // Send invitation email (don't fail if email fails)
    if (ensureEmailClientInitialized()) {
      try {
        const appUrl = getAppUrl();
        const acceptUrl = `${appUrl}/invitations/accept/${token}`;
        const recipientEmail = getRecipientEmail(email);

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
          organizationName: invitation.organization.name,
          inviterName,
          role: role,
          token,
          expiresAt,
          acceptUrl,
        });

        if (emailResult.success) {
          console.log('[Email] Invitation email sent successfully:', emailResult.messageId);
        } else {
          console.error('[Email] Failed to send invitation email:', emailResult.error);
          // Don't fail the request - invitation was created successfully
        }
      } catch (emailError) {
        console.error('[Email] Error sending invitation email:', emailError);
        // Don't fail the request - invitation was created successfully
      }
    } else {
      console.warn('[Email] Email service not configured - invitation created but email not sent');
    }

    // Return invitation without sensitive token
    const { token: _token, ...sanitizedInvitation } = invitation;

    return NextResponse.json(sanitizedInvitation, { status: 201 });
  } catch (error) {
    console.error('Error creating invitation:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create invitation' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
