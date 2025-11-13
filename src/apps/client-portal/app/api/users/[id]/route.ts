import { NextRequest, NextResponse } from 'next/server';
import { prisma, Role } from '@invoice-app/database';
import { requireAdmin, getCurrentUser } from '@invoice-app/auth/server';

/**
 * GET /api/users/[id]
 * Get detailed information about a specific user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    // Get user with full details
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            invoices: true,
            customers: true,
            expenses: true,
            accountantAssignments: true,
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
        { error: 'Cannot view users from other organizations' },
        { status: 403 }
      );
    }

    // Get invitation info if user came via invitation
    let invitation = null;
    if (user.invitationId) {
      invitation = await prisma.invitation.findUnique({
        where: { id: user.invitationId },
        select: {
          invitedBy: true,
          invitedAt: true,
          acceptedAt: true,
          role: true,
        },
      });
    }

    // Get recent invoices created by this user
    const recentInvoices = await prisma.invoice.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        total: true,
        createdAt: true,
        customer: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...user,
      invitation,
      recentInvoices,
    });
  } catch (error) {
    console.error('Error fetching user:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/[id]
 * Update user role and active status
 * Body: { role?: Role, isActive?: boolean }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { role, isActive } = body;

    // Get the user to update
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        organizationId: true,
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
        { error: 'Cannot update users from other organizations' },
        { status: 403 }
      );
    }

    // Prevent updating yourself
    if (user.id === admin.id) {
      // Allow status change but not role change for yourself
      if (role !== undefined && role !== user.role) {
        return NextResponse.json(
          { error: 'Cannot change your own role' },
          { status: 400 }
        );
      }
      if (isActive === false) {
        return NextResponse.json(
          { error: 'Cannot deactivate yourself' },
          { status: 400 }
        );
      }
    }

    // Validate role if provided
    if (role !== undefined && !['ADMIN', 'USER', 'ACCOUNTANT'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be ADMIN, USER, or ACCOUNTANT' },
        { status: 400 }
      );
    }

    // Check if removing last admin
    if (
      (role !== undefined && role !== 'ADMIN' && user.role === 'ADMIN') ||
      (isActive === false && user.role === 'ADMIN')
    ) {
      const adminCount = await prisma.user.count({
        where: {
          organizationId: admin.organizationId,
          role: 'ADMIN',
          isActive: true,
        },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove or deactivate the last admin in the organization' },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (role !== undefined) {
      updateData.role = role;
    }
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            invoices: true,
            customers: true,
            expenses: true,
          },
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]
 * Soft delete a user (set isActive = false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    // Get the user to delete
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        organizationId: true,
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
        { error: 'Cannot delete users from other organizations' },
        { status: 403 }
      );
    }

    // Cannot delete yourself
    if (user.id === admin.id) {
      return NextResponse.json(
        { error: 'Cannot delete yourself' },
        { status: 400 }
      );
    }

    // Cannot delete last admin
    if (user.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: {
          organizationId: admin.organizationId,
          role: 'ADMIN',
          isActive: true,
        },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin in the organization' },
          { status: 400 }
        );
      }
    }

    // Soft delete: set isActive to false
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting user:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
