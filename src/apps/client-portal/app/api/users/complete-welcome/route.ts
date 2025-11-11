import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@invoice-app/auth/server';
import { prisma } from '@invoice-app/database';

/**
 * POST /api/users/complete-welcome
 * Marks the current user as having completed the welcome wizard
 * Requires: Authenticated user
 * Returns: Updated user with hasCompletedWelcome: true
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    // Update user to mark welcome as completed
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        hasCompletedWelcome: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        hasCompletedWelcome: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error completing welcome wizard:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to complete welcome wizard' },
      { status: 500 }
    );
  }
}
