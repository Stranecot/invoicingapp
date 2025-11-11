import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth';
import { prisma, Role } from '@invoice-app/database';
import { z } from 'zod';

const roleSchema = z.object({
  role: z.enum(['ADMIN', 'USER', 'ACCOUNTANT']),
});

/**
 * PATCH /api/admin/users/[id]/role
 * Update user role
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
    const { role } = roleSchema.parse(body);

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

    // Update role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        role,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      user: updatedUser,
      message: `User role updated to ${role} successfully`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
});
