import { NextRequest, NextResponse } from 'next/server';
import { prisma, Role, InvitationStatus, generateInvitationToken, generateInvitationExpiry, canInviteMoreUsers, canInviteUsers, getRemainingInvitations } from '@invoice-app/database';
import { getCurrentUser, requireAdmin } from '@invoice-app/auth/server';
import { sendInvitationEmail } from '@invoice-app/email';
import { ensureEmailClientInitialized, getAppUrl, getRecipientEmail } from '@/lib/email';
import { z } from 'zod';

/**
 * Validation schema for creating invitations
 */
const createInvitationSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['ADMIN', 'USER', 'ACCOUNTANT', 'EMPLOYEE'], {
    errorMap: () => ({ message: 'Role must be ADMIN, USER, ACCOUNTANT, or EMPLOYEE' }),
  }),
});

/**
 * GET /api/invitations
 * Lists all invitations for the user's organization with optional filtering
 * Requires: ADMIN or OWNER role
 * Query params:
 *   - status: Filter by invitation status (PENDING, ACCEPTED, EXPIRED, REVOKED)
 *   - email: Filter by email (partial match)
 *   - limit: Number of results (default: 50, max: 100)
 *   - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        organizationId: true,
        role: true,
      },
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: 'User must belong to an organization' },
        { status: 400 }
      );
    }

    // Check if user has permission to view invitations
    if (!canInviteUsers(user.role)) {
      return NextResponse.json(
        { error: 'Only OWNER role can view invitations' },
        { status: 403 }
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
      organizationId: user.organizationId,
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
 * Requires: ADMIN role (can invite OWNERs) or OWNER role (can invite EMPLOYEEs)
 * Body: { email: string, role: 'OWNER' | 'EMPLOYEE' | 'ACCOUNTANT' }
 * Returns: Created invitation object (token excluded)
 */
export async function POST(request: NextRequest) {
  try {
    // Get current user (could be ADMIN or OWNER)
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's full details including organization
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        role: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
          }
        }
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to invite
    if (!canInviteUsers(user.role)) {
      return NextResponse.json(
        { error: 'Only OWNER role can invite users' },
        { status: 403 }
      );
    }

    if (!user.organizationId || !user.organization) {
      return NextResponse.json(
        { error: 'User must belong to an organization' },
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

    // Role-based authorization checks
    if (user.role === 'OWNER') {
      // OWNERs can only invite EMPLOYEEs
      if (role !== 'EMPLOYEE') {
        return NextResponse.json(
          { error: 'Organization owners can only invite employees' },
          { status: 403 }
        );
      }
    } else if (user.role === 'ADMIN') {
      // ADMINs can invite OWNERs or other ADMINs (but typically invite OWNERs for orgs)
      if (role === 'EMPLOYEE') {
        return NextResponse.json(
          { error: 'Admins cannot directly invite employees. Employees must be invited by organization owners.' },
          { status: 403 }
        );
      }
    }

    // Check if user already exists in the organization
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        organizationId: user.organizationId,
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
        organizationId: user.organizationId,
        status: 'PENDING',
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'A pending invitation already exists for this email' },
        { status: 409 }
      );
    }

    // Check plan-based user limits (only for EMPLOYEE invitations)
    if (role === 'EMPLOYEE') {
      const currentUserCount = await prisma.user.count({
        where: {
          organizationId: user.organizationId,
          isActive: true,
        },
      });

      // Count pending invitations for employees
      const pendingInvitationsCount = await prisma.invitation.count({
        where: {
          organizationId: user.organizationId,
          status: 'PENDING',
          role: 'EMPLOYEE',
        },
      });

      const totalSlots = currentUserCount + pendingInvitationsCount;

      if (!canInviteMoreUsers(totalSlots, user.organization.plan)) {
        const remaining = getRemainingInvitations(totalSlots, user.organization.plan);
        return NextResponse.json(
          {
            error: `Organization has reached maximum user limit for ${user.organization.plan} plan`,
            details: {
              currentUsers: currentUserCount,
              pendingInvitations: pendingInvitationsCount,
              remaining,
              plan: user.organization.plan,
            }
          },
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
        organizationId: user.organizationId,
        invitedBy: user.id,
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
          where: { id: user.id },
          select: { name: true, email: true },
        });

        const inviterName = inviter
          ? inviter.name || inviter.email
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
