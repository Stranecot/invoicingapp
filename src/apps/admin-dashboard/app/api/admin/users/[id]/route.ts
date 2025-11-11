import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth';
import { prisma, Role } from '@invoice-app/database';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'USER', 'ACCOUNTANT']).optional(),
  organizationId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/admin/users/[id]
 * Get a single user by ID
 */
export const GET = withAdminAuth(async (req: NextRequest, adminUser, context) => {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            invoices: true,
            expenses: true,
            customers: true,
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

    return NextResponse.json({
      user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
});

/**
 * PATCH /api/admin/users/[id]
 * Update a user
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
    const validatedData = updateUserSchema.parse(body);

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
    if (
      adminUser.id === id &&
      validatedData.isActive === false
    ) {
      return NextResponse.json(
        { error: 'You cannot deactivate your own account' },
        { status: 400 }
      );
    }

    // If changing organization, validate it exists
    if (validatedData.organizationId !== undefined && validatedData.organizationId !== null) {
      const orgExists = await prisma.organization.findUnique({
        where: { id: validatedData.organizationId },
      });

      if (!orgExists) {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 400 }
        );
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(validatedData.name !== undefined && { name: validatedData.name || null }),
        ...(validatedData.role && { role: validatedData.role }),
        ...(validatedData.organizationId !== undefined && {
          organizationId: validatedData.organizationId
        }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
        updatedAt: new Date(),
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      user: updatedUser,
      message: 'User updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/admin/users/[id]
 * Soft delete a user (deactivate)
 */
export const DELETE = withAdminAuth(async (req: NextRequest, adminUser, context) => {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

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

    // Prevent admin from deleting themselves
    if (adminUser.id === id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    // Soft delete by deactivating the user
    const deletedUser = await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'User deactivated successfully',
      user: deletedUser,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
});
