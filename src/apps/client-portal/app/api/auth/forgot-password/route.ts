import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@invoice-app/database';
import { randomUUID } from 'crypto';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    // Even if user doesn't exist, return success message
    if (!user || !user.isActive) {
      return NextResponse.json({
        message: 'If an account exists with this email, you will receive a password reset link.',
      });
    }

    // Generate reset token
    const resetToken = randomUUID();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // TODO: Send email with reset link
    // const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
    // await sendPasswordResetEmail(user.email, resetLink);

    console.log(`Password reset requested for ${user.email}`);
    console.log(`Reset token: ${resetToken}`);
    console.log(`Reset link: ${process.env.APP_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`);

    return NextResponse.json({
      message: 'If an account exists with this email, you will receive a password reset link.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
