import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth';
import { prisma } from '@invoice-app/database';
import { z } from 'zod';

const statusSchema = z.object({
  isActive: z.boolean(),
});

/**
 * PATCH /api/admin/users/[id]/status
 * Update user status (activate/deactivate)
 */
export const PATCH = withAdminAuth(async (req: NextRequest, adminUser, context) => {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { isActive } = statusSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent admin from deactivating themselves
    if (adminUser.id === id && !isActive) {
      return NextResponse.json(
        { error: 'You cannot deactivate your own account' },
        { status: 400 }
      );
    }

    // Update status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isActive,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      user: updatedUser,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating user status:', error);
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    );
  }
});
