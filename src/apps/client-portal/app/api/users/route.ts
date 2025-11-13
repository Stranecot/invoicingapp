import { NextRequest, NextResponse } from 'next/server';
import { prisma, Role } from '@invoice-app/database';
import { requireAdmin } from '@invoice-app/auth/server';

/**
 * GET /api/users
 * List all users in the organization with pagination, search, and filters
 * Query params:
 * - search: Search by email or name (case-insensitive)
 * - role: Filter by role (ADMIN, USER, ACCOUNTANT)
 * - status: Filter by status (active, inactive)
 * - limit: Items per page (default 50, max 100)
 * - offset: Pagination offset (default 0)
 * - sortBy: Sort field (name, email, createdAt, lastLoginAt)
 * - sortOrder: Sort order (asc, desc)
 */
export async function GET(request: NextRequest) {
  try {
    // Allow both ADMIN and OWNER to access this endpoint
    const { getCurrentUser } = await import('@invoice-app/auth/server');
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Owner access required' },
        { status: 403 }
      );
    }

    const admin = user;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const roleFilter = searchParams.get('role') as Role | null;
    const statusFilter = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // Build where clause
    const where: any = {
      organizationId: admin.organizationId,
    };

    // Add search filter (email or name)
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add role filter
    if (roleFilter && ['ADMIN', 'USER', 'ACCOUNTANT'].includes(roleFilter)) {
      where.role = roleFilter;
    }

    // Add status filter
    if (statusFilter === 'active') {
      where.isActive = true;
    } else if (statusFilter === 'inactive') {
      where.isActive = false;
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'email') {
      orderBy.email = sortOrder;
    } else if (sortBy === 'lastLoginAt') {
      orderBy.lastLoginAt = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Get total count for pagination
    const total = await prisma.user.count({ where });

    // Get users with related data
    const users = await prisma.user.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        organizationId: true,
        invitationId: true,
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

    // Include invitation info for users who came via invitation
    const usersWithInvitation = await Promise.all(
      users.map(async (user) => {
        if (user.invitationId) {
          const invitation = await prisma.invitation.findUnique({
            where: { id: user.invitationId },
            select: {
              invitedBy: true,
              invitedAt: true,
              acceptedAt: true,
            },
          });
          return { ...user, invitation };
        }
        return { ...user, invitation: null };
      })
    );

    return NextResponse.json({
      users: usersWithInvitation,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching users:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
