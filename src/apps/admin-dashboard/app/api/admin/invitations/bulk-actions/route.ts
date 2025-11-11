import { NextRequest, NextResponse } from 'next/server';
import { prisma, generateInvitationToken, generateInvitationExpiry } from '@invoice-app/database';
import { withAdminAuth } from '@/lib/auth';
import { z } from 'zod';

/**
 * Validation schema for bulk actions
 */
const bulkActionSchema = z.object({
  action: z.enum(['resend', 'revoke']),
  invitationIds: z.array(z.string().uuid()).min(1, 'At least one invitation ID is required'),
});

/**
 * POST /api/admin/invitations/bulk-actions
 * Perform bulk actions on multiple invitations
 * Requires: ADMIN role
 * Body: { action: 'resend' | 'revoke', invitationIds: string[] }
 * Returns: Success/failure counts
 */
export const POST = withAdminAuth(async (request: NextRequest) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = bulkActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { action, invitationIds } = validation.data;

    if (action === 'resend') {
      // Resend invitations
      const results = await Promise.allSettled(
        invitationIds.map(async (id) => {
          const invitation = await prisma.invitation.findUnique({
            where: { id },
          });

          if (!invitation) {
            throw new Error(`Invitation ${id} not found`);
          }

          if (invitation.status !== 'PENDING' && invitation.status !== 'EXPIRED') {
            throw new Error(`Cannot resend invitation ${id} with status: ${invitation.status}`);
          }

          // Generate new token and expiry
          const newToken = generateInvitationToken();
          const newExpiresAt = generateInvitationExpiry(7);

          await prisma.invitation.update({
            where: { id },
            data: {
              token: newToken,
              expiresAt: newExpiresAt,
              invitedAt: new Date(),
              status: 'PENDING',
            },
          });

          return id;
        })
      );

      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;
      const errors = results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map((r) => r.reason.message);

      console.log(`[Admin] Bulk resend: ${succeeded} succeeded, ${failed} failed`);

      return NextResponse.json({
        message: `Resent ${succeeded} invitation(s)`,
        succeeded,
        failed,
        errors: failed > 0 ? errors : undefined,
      });
    } else if (action === 'revoke') {
      // Revoke invitations
      const results = await Promise.allSettled(
        invitationIds.map(async (id) => {
          const invitation = await prisma.invitation.findUnique({
            where: { id },
          });

          if (!invitation) {
            throw new Error(`Invitation ${id} not found`);
          }

          if (invitation.status !== 'PENDING') {
            throw new Error(`Cannot revoke invitation ${id} with status: ${invitation.status}`);
          }

          await prisma.invitation.update({
            where: { id },
            data: { status: 'REVOKED' },
          });

          return id;
        })
      );

      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;
      const errors = results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map((r) => r.reason.message);

      console.log(`[Admin] Bulk revoke: ${succeeded} succeeded, ${failed} failed`);

      return NextResponse.json({
        message: `Revoked ${succeeded} invitation(s)`,
        succeeded,
        failed,
        errors: failed > 0 ? errors : undefined,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
});
