import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma, InvitationStatus, OrgStatus, canInviteMoreUsers } from '@invoice-app/database';
import { hashPassword, generateJWT } from '@invoice-app/auth/server';
import { cookies } from 'next/headers';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  token: z.string().min(1, 'Invitation token is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { email, password, name, token } = validation.data;

    // Use transaction for atomic operations
    const result = await prisma.$transaction(async (tx) => {
      // Find PENDING invitation with matching token and email
      const invitation = await tx.invitation.findFirst({
        where: {
          token,
          email: email.toLowerCase(),
          status: InvitationStatus.PENDING,
        },
        include: {
          organization: true,
        },
      });

      if (!invitation) {
        throw new Error('NO_INVITATION');
      }

      // Check if invitation has expired
      if (new Date() > invitation.expiresAt) {
        // Mark as expired
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { status: InvitationStatus.EXPIRED },
        });
        throw new Error('INVITATION_EXPIRED');
      }

      // Check if organization is active
      if (invitation.organization.status !== OrgStatus.ACTIVE) {
        throw new Error('ORGANIZATION_INACTIVE');
      }

      // Check if organization has reached user limit (plan-based)
      const userCount = await tx.user.count({
        where: {
          organizationId: invitation.organizationId,
          isActive: true,
        },
      });

      // Use plan-based limits
      if (!canInviteMoreUsers(userCount, invitation.organization.plan)) {
        throw new Error('USER_LIMIT_REACHED');
      }

      // Check if user already exists
      const existingUser = await tx.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        throw new Error('USER_EXISTS');
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          name,
          role: invitation.role,
          organizationId: invitation.organizationId,
          invitationId: invitation.id,
          emailVerified: true, // Email verified through invitation
          isActive: true,
        },
        include: {
          organization: true,
        },
      });

      // Mark invitation as accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: InvitationStatus.ACCEPTED,
          acceptedAt: new Date(),
          acceptedBy: user.id,
        },
      });

      // If role is ACCOUNTANT and customerIds are provided, create assignments
      if (invitation.role === 'ACCOUNTANT' && invitation.customerIds.length > 0) {
        await tx.accountantAssignment.createMany({
          data: invitation.customerIds.map((customerId) => ({
            accountantId: user.id,
            customerId,
          })),
          skipDuplicates: true,
        });
      }

      return user;
    });

    // Generate JWT token
    const jwtToken = await generateJWT({
      id: result.id,
      email: result.email,
      role: result.role,
      organizationId: result.organizationId,
    });

    // Set httpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    // Return user data
    return NextResponse.json({
      user: {
        id: result.id,
        email: result.email,
        name: result.name,
        role: result.role,
        organizationId: result.organizationId,
        emailVerified: result.emailVerified,
        organization: result.organization ? {
          id: result.organization.id,
          name: result.organization.name,
          slug: result.organization.slug,
        } : null,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Signup error:', error);

    // Handle specific errors
    if (error.message === 'NO_INVITATION') {
      return NextResponse.json(
        { error: 'Invalid or missing invitation' },
        { status: 403 }
      );
    }

    if (error.message === 'INVITATION_EXPIRED') {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 403 }
      );
    }

    if (error.message === 'ORGANIZATION_INACTIVE') {
      return NextResponse.json(
        { error: 'Organization is not active' },
        { status: 403 }
      );
    }

    if (error.message === 'USER_LIMIT_REACHED') {
      return NextResponse.json(
        { error: 'Organization has reached its user limit' },
        { status: 403 }
      );
    }

    if (error.message === 'USER_EXISTS') {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 }
    );
  }
}
