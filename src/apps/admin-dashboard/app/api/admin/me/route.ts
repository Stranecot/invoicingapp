import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth';

/**
 * GET /api/admin/me
 * Get current admin user information
 *
 * This is a protected route that demonstrates the use of withAdminAuth
 * Only authenticated users with ADMIN role can access this endpoint
 */
export const GET = withAdminAuth(async (req: NextRequest, user) => {
  // user is guaranteed to be an admin at this point
  // The withAdminAuth wrapper handles all authentication and authorization checks

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
    },
    message: 'Admin user retrieved successfully',
  });
});
