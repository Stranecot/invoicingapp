import { NextRequest, NextResponse } from 'next/server';
import { prisma, Role, InvitationStatus, generateInvitationToken, generateInvitationExpiry } from '@invoice-app/database';
import { withAdminAuth } from '@/lib/auth';
import { z } from 'zod';

/**
 * Validation schema for creating invitations
 */
const createInvitationSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['ADMIN', 'USER', 'ACCOUNTANT']),
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
 * Body: { email: string, role: 'ADMIN' | 'USER' | 'ACCOUNTANT', organizationId: string, customerIds?: string[] }
 * Returns: Created invitation object (token excluded)
 */
export const POST = withAdminAuth(async (request: NextRequest) => {
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

    // Get admin user for invitedBy
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'ADMIN',
        organizationId,
      },
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: 'No admin user found for this organization' },
        { status: 400 }
      );
    }

    // Generate invitation token and expiry
    const token = generateInvitationToken();
    const expiresAt = generateInvitationExpiry(7); // 7 days from now

    // Create invitation
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

    // TODO: Send invitation email
    // This will need the email service configured
    // For now, we'll just return the invitation

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
