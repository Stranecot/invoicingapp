import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth';
import { prisma, Role } from '@invoice-app/database';

/**
 * GET /api/admin/users
 * List all users with filtering, search, sorting, and pagination
 */
export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') as Role | 'ALL' | null;
    const organizationId = searchParams.get('organizationId') || 'ALL';
    const status = searchParams.get('status') as 'active' | 'inactive' | 'ALL';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // Build where clause
    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Role filter
    if (role && role !== 'ALL') {
      where.role = role;
    }

    // Organization filter
    if (organizationId && organizationId !== 'ALL') {
      where.organizationId = organizationId;
    }

    // Status filter
    if (status && status !== 'ALL') {
      where.isActive = status === 'active';
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build orderBy
    const orderBy: any = {};
    if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'email') {
      orderBy.email = sortOrder;
    } else if (sortBy === 'role') {
      orderBy.role = sortOrder;
    } else if (sortBy === 'lastLoginAt') {
      orderBy.lastLoginAt = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Fetch users and total count
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          clerkId: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          organizationId: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Format response
    const formattedUsers = users.map((user) => ({
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      organizationId: user.organizationId,
      organizationName: user.organization?.name || null,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
});
