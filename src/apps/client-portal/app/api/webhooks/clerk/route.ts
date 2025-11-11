import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { prisma, isInvitationExpired } from '@invoice-app/database';

/**
 * CRITICAL SECURITY FEATURE: Invitation-based signup enforcement
 *
 * This webhook enforces that ONLY users with valid invitations can sign up.
 * Unauthorized users are immediately deleted from Clerk.
 */

// Helper function to delete a Clerk user
async function deleteClerkUser(clerkUserId: string): Promise<boolean> {
  try {
    const client = await clerkClient();
    await client.users.deleteUser(clerkUserId);
    console.log('[SECURITY] Deleted unauthorized Clerk user:', clerkUserId);
    return true;
  } catch (error) {
    console.error('[SECURITY] Failed to delete Clerk user:', clerkUserId, error);
    // Retry once on failure
    try {
      const client = await clerkClient();
      await client.users.deleteUser(clerkUserId);
      console.log('[SECURITY] Deleted unauthorized Clerk user (retry):', clerkUserId);
      return true;
    } catch (retryError) {
      console.error('[SECURITY] Failed to delete Clerk user (retry):', clerkUserId, retryError);
      return false;
    }
  }
}

// Helper function to validate and consume invitation
async function validateAndConsumeInvitation(email: string, clerkId: string) {
  // Use Prisma transaction to ensure atomicity
  return await prisma.$transaction(async (tx) => {
    // Find PENDING invitation for this email
    const invitation = await tx.invitation.findFirst({
      where: {
        email: email,
        status: 'PENDING',
      },
      include: {
        organization: true,
      },
    });

    // Validation: No invitation found
    if (!invitation) {
      console.log('[SECURITY] No invitation found for email:', email);
      throw new Error('NO_INVITATION');
    }

    // Validation: Check if invitation is expired
    if (isInvitationExpired(invitation.expiresAt)) {
      console.log('[SECURITY] Expired invitation for email:', email, 'expired at:', invitation.expiresAt);
      // Mark as expired
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new Error('INVITATION_EXPIRED');
    }

    // Validation: Ensure organization is active
    if (invitation.organization.status !== 'ACTIVE') {
      console.log('[SECURITY] Organization not active for email:', email, 'org status:', invitation.organization.status);
      throw new Error('ORGANIZATION_INACTIVE');
    }

    // Check organization user limit
    const userCount = await tx.user.count({
      where: {
        organizationId: invitation.organizationId,
        isActive: true,
      },
    });

    if (userCount >= invitation.organization.maxUsers) {
      console.log('[SECURITY] Organization user limit reached for:', invitation.organizationId);
      throw new Error('USER_LIMIT_REACHED');
    }

    // Create user record
    const user = await tx.user.create({
      data: {
        clerkId: clerkId,
        email: invitation.email,
        name: null, // Will be updated from Clerk data
        role: invitation.role,
        organizationId: invitation.organizationId,
        invitationId: invitation.id,
        isActive: true,
        lastLoginAt: new Date(),
      },
    });

    // Update invitation status to ACCEPTED
    await tx.invitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        acceptedBy: user.id,
      },
    });

    console.log('[SUCCESS] User created via invitation:', {
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
    });

    return { user, invitation };
  });
}

export async function POST(req: Request) {
  // STEP 1: Verify webhook signature
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('[ERROR] CLERK_WEBHOOK_SECRET not configured');
    return new Response('Server configuration error', { status: 500 });
  }

  // Get the Svix headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // Validate headers presence
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('[SECURITY] Missing Svix headers');
    return new Response('Unauthorized', { status: 401 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify the webhook signature
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('[SECURITY] Webhook signature verification failed:', err);
    return new Response('Unauthorized', { status: 401 });
  }

  // STEP 2: Handle webhook events
  const eventType = evt.type;

  // Handle user.created - CRITICAL SECURITY ENFORCEMENT
  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;

    // Get primary email
    const primaryEmail = email_addresses.find((email) => email.id === evt.data.primary_email_address_id);

    if (!primaryEmail) {
      console.error('[ERROR] No primary email found for user:', id);
      // Delete the user since we can't validate without email
      await deleteClerkUser(id);
      return new Response('Invalid user data', { status: 400 });
    }

    const userEmail = primaryEmail.email_address;

    console.log('[WEBHOOK] Processing user.created:', { clerkId: id, email: userEmail });

    try {
      // Validate and consume invitation (atomic transaction)
      const { user } = await validateAndConsumeInvitation(userEmail, id);

      // Update user name from Clerk data
      const fullName = first_name && last_name
        ? `${first_name} ${last_name}`
        : first_name || last_name || null;

      if (fullName) {
        await prisma.user.update({
          where: { id: user.id },
          data: { name: fullName },
        });
      }

      console.log('[SUCCESS] User signup completed:', userEmail);
      return new Response('User created successfully', { status: 200 });

    } catch (error: any) {
      // SECURITY: Delete Clerk user if invitation validation fails
      const errorType = error.message;

      console.error('[SECURITY] Signup blocked for:', userEmail, 'Reason:', errorType);

      // Delete the unauthorized Clerk user
      const deleted = await deleteClerkUser(id);

      if (!deleted) {
        console.error('[CRITICAL] Failed to delete unauthorized user:', id);
        // Alert administrators - this is a critical security issue
      }

      // Return generic error message (don't leak invitation details)
      return new Response('Signup not allowed', { status: 403 });
    }
  }

  // Handle user.updated
  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data;

    const primaryEmail = email_addresses.find((email) => email.id === evt.data.primary_email_address_id);

    if (!primaryEmail) {
      console.error('[ERROR] No primary email found for user update:', id);
      return new Response('Invalid user data', { status: 400 });
    }

    try {
      // Find user by clerkId
      const existingUser = await prisma.user.findUnique({
        where: { clerkId: id },
      });

      if (!existingUser) {
        console.error('[ERROR] User not found in database:', id);
        return new Response('User not found', { status: 404 });
      }

      // Update user data (keep organizationId and role unchanged)
      await prisma.user.update({
        where: { clerkId: id },
        data: {
          email: primaryEmail.email_address,
          name: first_name && last_name
            ? `${first_name} ${last_name}`
            : first_name || last_name || null,
          lastLoginAt: new Date(),
        },
      });

      console.log('[SUCCESS] User updated:', primaryEmail.email_address);
      return new Response('User updated successfully', { status: 200 });

    } catch (error) {
      console.error('[ERROR] Error updating user:', error);
      return new Response('Error updating user', { status: 500 });
    }
  }

  // Handle user.deleted
  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    try {
      // Soft delete: mark as inactive instead of hard delete
      await prisma.user.update({
        where: { clerkId: id! },
        data: { isActive: false },
      });

      console.log('[SUCCESS] User deactivated:', id);
      return new Response('User deleted successfully', { status: 200 });

    } catch (error) {
      console.error('[ERROR] Error deleting user:', error);
      return new Response('Error deleting user', { status: 500 });
    }
  }

  // Log unhandled event types
  console.log('[INFO] Unhandled webhook event type:', eventType);
  return new Response('Webhook received', { status: 200 });
}
