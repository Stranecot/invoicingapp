import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@invoice-app/auth';
import type { UserWithRole } from '@invoice-app/auth';

/**
 * Get the current admin user from the database
 * Throws an error if not authenticated or not an admin
 */
export async function getAdminUser(): Promise<UserWithRole> {
  return requireAdmin();
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
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}
