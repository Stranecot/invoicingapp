import { NextRequest, NextResponse } from 'next/server';
import { prisma, Role, InvitationStatus } from '@invoice-app/database';
import { getCurrentUser, requireAdmin } from '@invoice-app/auth/server';
import { z } from 'zod';

/**
 * Validation schema for updating invitations
 */
const updateInvitationSchema = z.object({
  role: z.enum(['ADMIN', 'USER', 'ACCOUNTANT']).optional(),
  status: z.enum(['REVOKED']).optional(), // Only allow manual revocation
});

/**
 * Helper function to validate invitation belongs to admin's organization
 */
async function validateInvitationAccess(invitationId: string, adminId: string) {
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { organizationId: true },
  });

  if (!admin?.organizationId) {
    return { error: 'Admin must belong to an organization', status: 400, invitation: null };
  }

  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
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
    return { error: 'Invitation not found', status: 404, invitation: null };
  }

  if (invitation.organizationId !== admin.organizationId) {
    return { error: 'Forbidden: This invitation belongs to another organization', status: 403, invitation: null };
  }

  return { error: null, status: 200, invitation };
}

/**
 * GET /api/invitations/[id]
 * Gets details of a specific invitation
 * Requires: ADMIN role
 * Returns: Full invitation details with organization and inviter info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const { error, status, invitation } = await validateInvitationAccess(params.id, admin.id);

    if (error || !invitation) {
      return NextResponse.json({ error }, { status });
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

    // Remove sensitive token from response
    const { token, ...sanitizedInvitation } = invitation;

    return NextResponse.json({
      ...sanitizedInvitation,
      inviter,
      accepter,
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch invitation' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

/**
 * PATCH /api/invitations/[id]
 * Updates an invitation (role or status)
 * Requires: ADMIN role
 * Body: { role?: 'ADMIN' | 'USER' | 'ACCOUNTANT', status?: 'REVOKED' }
 * Returns: Updated invitation object
 * Note: Can only update PENDING invitations
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const { error, status, invitation } = await validateInvitationAccess(params.id, admin.id);

    if (error || !invitation) {
      return NextResponse.json({ error }, { status });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateInvitationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const updates = validation.data;

    // Check if invitation can be updated
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot update invitation with status: ${invitation.status}. Only PENDING invitations can be updated.` },
        { status: 400 }
      );
    }

    // Check if invitation has expired
    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { error: 'Cannot update expired invitation' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (updates.role) {
      updateData.role = updates.role as Role;
    }

    if (updates.status) {
      updateData.status = updates.status as InvitationStatus;
    }

    // Update invitation
    const updatedInvitation = await prisma.invitation.update({
      where: { id: params.id },
      data: updateData,
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

    console.log('Invitation updated successfully:', updatedInvitation.id);

    // Remove sensitive token from response
    const { token: _token, ...sanitizedInvitation } = updatedInvitation;

    return NextResponse.json(sanitizedInvitation);
  } catch (error) {
    console.error('Error updating invitation:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update invitation' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

/**
 * DELETE /api/invitations/[id]
 * Cancels/deletes an invitation (soft delete by setting status to REVOKED)
 * Requires: ADMIN role
 * Returns: 204 No Content on success
 * Note: Can only delete PENDING invitations
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const { error, status, invitation } = await validateInvitationAccess(params.id, admin.id);

    if (error || !invitation) {
      return NextResponse.json({ error }, { status });
    }

    // Check if invitation can be deleted
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot delete invitation with status: ${invitation.status}. Only PENDING invitations can be deleted.` },
        { status: 400 }
      );
    }

    // Soft delete by updating status to REVOKED
    await prisma.invitation.update({
      where: { id: params.id },
      data: { status: 'REVOKED' },
    });

    console.log('Invitation deleted successfully:', params.id);

    // Return 204 No Content
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting invitation:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete invitation' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
