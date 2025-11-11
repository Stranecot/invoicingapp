import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@invoice-app/database';
import { requireAdmin } from '@invoice-app/auth';
import { sendWelcomeEmail } from '@invoice-app/email';

/**
 * POST /api/users/[id]/resend-welcome
 * Resend welcome email to a user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    // Get the user
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        organizationId: true,
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check organization access
    if (user.organizationId !== admin.organizationId) {
      return NextResponse.json(
        { error: 'Cannot send email to users from other organizations' },
        { status: 403 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Cannot send welcome email to inactive user' },
        { status: 400 }
      );
    }

    // Send welcome email
    const firstName = user.name?.split(' ')[0] || 'User';
    const organizationName = user.organization?.name || 'Invoice App';
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`;

    const result = await sendWelcomeEmail({
      to: user.email,
      firstName,
      organizationName,
      dashboardUrl,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send welcome email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Welcome email sent successfully',
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send welcome email' },
      { status: 500 }
    );
  }
}
