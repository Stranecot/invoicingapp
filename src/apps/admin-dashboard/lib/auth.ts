import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma, Role } from '@invoice-app/database';
import type { UserWithRole } from '@invoice-app/auth';

/**
 * Get the current admin user from the database
 * Throws an error if not authenticated or not an admin
 */
export async function getAdminUser(): Promise<UserWithRole> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized: Not authenticated');
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      clerkId: true,
      email: true,
      name: true,
      role: true,
      organizationId: true,
    },
  });

  if (!user) {
    throw new Error('Unauthorized: User not found');
  }

  if (user.role !== 'ADMIN') {
    throw new Error('Forbidden: Admin access required');
  }

  return user;
}

/**
 * Higher-order function to wrap API route handlers with admin authentication
 * Automatically checks if the user is authenticated and has admin role
 *
 * Usage:
 * ```typescript
 * export const GET = withAdminAuth(async (req, user) => {
 *   // Your handler code here
 *   // user is guaranteed to be an admin
 *   return NextResponse.json({ data: 'something' });
 * });
 * ```
 */
export function withAdminAuth(
  handler: (req: NextRequest, user: UserWithRole, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      const user = await getAdminUser();

      // Log admin action for audit trail
      console.log(`Admin action: ${req.method} ${req.nextUrl.pathname} by ${user.email} (${user.id})`);

      return await handler(req, user, context);
    } catch (error) {
      console.error('Admin auth error:', error);

      if (error instanceof Error) {
        if (error.message.includes('Unauthorized')) {
          return NextResponse.json(
            { error: 'Unauthorized', message: 'Authentication required' },
            { status: 401 }
          );
        }
        if (error.message.includes('Forbidden')) {
          return NextResponse.json(
            { error: 'Forbidden', message: 'Admin access required' },
            { status: 403 }
          );
        }
      }

      return NextResponse.json(
        { error: 'Internal Server Error', message: 'An unexpected error occurred' },
        { status: 500 }
      );
    }
  };
}

/**
 * Check if the current user has admin role (returns boolean)
 * Useful for conditional rendering or checks
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const user = await getAdminUser();
    return user.role === 'ADMIN';
  } catch {
    return false;
  }
}

/**
 * Require specific role (more flexible than just admin)
 */
export async function requireRole(role: Role): Promise<UserWithRole> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized: Not authenticated');
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      clerkId: true,
      email: true,
      name: true,
      role: true,
      organizationId: true,
    },
  });

  if (!user) {
    throw new Error('Unauthorized: User not found');
  }

  if (user.role !== role) {
    throw new Error(`Forbidden: ${role} access required`);
  }

  return user;
}

/**
 * Higher-order function for role-based API route protection
 */
export function withRole(
  role: Role,
  handler: (req: NextRequest, user: UserWithRole, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      const user = await requireRole(role);

      console.log(`${role} action: ${req.method} ${req.nextUrl.pathname} by ${user.email} (${user.id})`);

      return await handler(req, user, context);
    } catch (error) {
      console.error('Role auth error:', error);

      if (error instanceof Error) {
        if (error.message.includes('Unauthorized')) {
          return NextResponse.json(
            { error: 'Unauthorized', message: 'Authentication required' },
            { status: 401 }
          );
        }
        if (error.message.includes('Forbidden')) {
          return NextResponse.json(
            { error: 'Forbidden', message: error.message },
            { status: 403 }
          );
        }
      }

      return NextResponse.json(
        { error: 'Internal Server Error', message: 'An unexpected error occurred' },
        { status: 500 }
      );
    }
  };
}
