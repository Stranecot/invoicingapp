import { NextRequest, NextResponse } from 'next/server';
import { prisma, Role, InvitationStatus, generateInvitationToken, generateInvitationExpiry } from '@invoice-app/database';
import { withAdminAuth } from '@/lib/auth';
import { sendInvitationEmail } from '@invoice-app/email';
import { ensureEmailClientInitialized, getAppUrl, getRecipientEmail } from '@/lib/email';
import { z } from 'zod';

/**
 * Validation schema for creating invitations
 */
const createInvitationSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['ADMIN', 'OWNER', 'ACCOUNTANT']),
  organizationId: z.string().uuid('Invalid organization ID'),
  customerIds: z.array(z.string()).optional(),
});

/**
 * GET /api/admin/invitations
 * Lists ALL invitations across ALL organizations (admin dashboard)
 * Requires: ADMIN role
 * Query params:
 *   - status: Filter by invitation status (PENDING, ACCEPTED, EXPIRED, REVOKED)
 *   - email: Filter by email (partial match)
 *   - organizationId: Filter by organization
 *   - role: Filter by role
 *   - limit: Number of results (default: 20, max: 100)
 *   - offset: Pagination offset (default: 0)
 *   - sortBy: Field to sort by (invitedAt, expiresAt, email)
 *   - sortOrder: Sort order (asc, desc) - default desc
 */
export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as InvitationStatus | null;
    const email = searchParams.get('email');
    const organizationId = searchParams.get('organizationId');
    const role = searchParams.get('role') as Role | null;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'invitedAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (email) {
      where.email = {
        contains: email,
        mode: 'insensitive',
      };
    }

    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (role) {
      where.role = role;
    }

    // Check for expired invitations and update them
    const now = new Date();
    await prisma.invitation.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lt: now,
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    // Build order by clause
    const orderBy: any = {};
    if (sortBy === 'invitedAt' || sortBy === 'expiresAt') {
      orderBy[sortBy] = sortOrder;
    } else if (sortBy === 'email') {
      orderBy.email = sortOrder;
    } else {
      orderBy.invitedAt = 'desc';
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
      orderBy,
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.invitation.count({ where });

    // Get inviter details for each invitation
    const invitationsWithInviter = await Promise.all(
      invitations.map(async (invitation) => {
        const inviter = await prisma.user.findUnique({
          where: { id: invitation.invitedBy },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });

        // Remove sensitive token from response
        const { token, ...sanitizedInvitation } = invitation;

        return {
          ...sanitizedInvitation,
          inviter: inviter || { id: invitation.invitedBy, name: 'Unknown', email: 'Unknown' },
        };
      })
    );

    return NextResponse.json({
      data: invitationsWithInviter,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/admin/invitations
 * Creates a new invitation for a user to join an organization
 * Requires: ADMIN role
 * Body: { email: string, role: 'ADMIN' | 'OWNER' | 'ACCOUNTANT', organizationId: string, customerIds?: string[] }
 * Returns: Created invitation object (token excluded)
 */
export const POST = withAdminAuth(async (request: NextRequest, adminUser) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = createInvitationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { email, role, organizationId, customerIds = [] } = validation.data;

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if user already exists in the organization
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        organizationId,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists in this organization' },
        { status: 409 }
      );
    }

    // Check if there's already a pending invitation for this email
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        organizationId,
        status: 'PENDING',
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'A pending invitation already exists for this email in this organization' },
        { status: 409 }
      );
    }

    // Check organization user limits
    const currentUserCount = await prisma.user.count({
      where: { organizationId },
    });

    if (currentUserCount >= organization.maxUsers) {
      return NextResponse.json(
        { error: `Organization has reached maximum user limit (${organization.maxUsers})` },
        { status: 403 }
      );
    }

    // Generate invitation token and expiry
    const token = generateInvitationToken();
    const expiresAt = generateInvitationExpiry(7); // 7 days from now

    // Create invitation (invitedBy is the current platform admin)
    const invitation = await prisma.invitation.create({
      data: {
        email,
        role: role as Role,
        organizationId,
        invitedBy: adminUser.id,
        token,
        expiresAt,
        status: 'PENDING',
        customerIds,
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

    console.log('[Admin] Invitation created successfully:', invitation.id);

    // Send invitation email (don't fail if email fails)
    console.log('[Email] Checking email service initialization...');
    if (ensureEmailClientInitialized()) {
      try {
        const appUrl = getAppUrl();
        // For admin dashboard invitations, redirect to client portal for acceptance
        const clientPortalUrl = process.env.CLIENT_PORTAL_URL || 'http://localhost:3000';
        const acceptUrl = `${clientPortalUrl}/accept-invitation?token=${token}`;
        const recipientEmail = getRecipientEmail(email);

        console.log('[Email] Sending invitation email...');
        console.log('[Email] To:', recipientEmail);
        console.log('[Email] Organization:', invitation.organization.name);
        console.log('[Email] Role:', role);
        console.log('[Email] Accept URL:', acceptUrl);

        const emailResult = await sendInvitationEmail({
          to: recipientEmail,
          organizationName: invitation.organization.name,
          inviterName: adminUser.name || adminUser.email,
          role: role,
          token,
          expiresAt,
          acceptUrl,
        });

        if (emailResult.success) {
          console.log('[Email] ✅ Invitation email sent successfully:', emailResult.messageId);
        } else {
          console.error('[Email] ❌ Failed to send invitation email:', emailResult.error);
          // Don't fail the request - invitation was created successfully
        }
      } catch (emailError) {
        console.error('[Email] ❌ Exception sending invitation email:', emailError);
        // Don't fail the request - invitation was created successfully
      }
    } else {
      console.warn('[Email] ⚠️ Email service not configured - invitation created but email not sent');
    }

    // Return invitation without sensitive token
    const { token: _token, ...sanitizedInvitation } = invitation;

    return NextResponse.json(sanitizedInvitation, { status: 201 });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create invitation' },
      { status: 500 }
    );
  }
});
