# Admin Dashboard Authentication & RBAC

This document describes the authentication and role-based access control (RBAC) implementation for the admin dashboard.

## Overview

The admin dashboard is protected by multiple layers of security:

1. **Clerk Authentication**: User must be signed in
2. **Middleware Protection**: Checks if user has ADMIN role on every request
3. **API Route Protection**: Server-side verification for API endpoints
4. **Permission System**: Fine-grained permissions for different actions

## Architecture

### Middleware Protection

The middleware (`middleware.ts`) runs on every request and:

1. Checks if the user is authenticated via Clerk
2. Fetches the user from the database using their Clerk ID
3. Verifies the user has the ADMIN role
4. Redirects non-admin users to `/unauthorized`
5. Logs all access attempts for security audit

```typescript
// middleware.ts
export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  if (userId && !isPublicRoute(req)) {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  }

  return NextResponse.next();
});
```

### Unauthorized Page

Non-admin users are redirected to `/unauthorized`, which shows:
- A friendly message explaining they need admin access
- A link to the client portal
- A sign-out button
- Contact information for requesting access

### API Route Protection

All admin API routes should use the `withAdminAuth` wrapper:

```typescript
import { withAdminAuth } from '@/lib/auth';

export const GET = withAdminAuth(async (req, user) => {
  // user is guaranteed to be an admin
  return NextResponse.json({ data: 'something' });
});
```

The wrapper:
- Verifies the user is authenticated
- Checks the user has ADMIN role
- Provides the user object to the handler
- Logs all admin actions
- Returns appropriate error responses (401 Unauthorized, 403 Forbidden)

### Helper Functions

#### `getAdminUser()`
Get the current admin user in API routes or server components:

```typescript
import { getAdminUser } from '@/lib/auth';

export async function GET() {
  const user = await getAdminUser(); // throws if not admin
  // ... your code
}
```

#### `isCurrentUserAdmin()`
Check if the current user is an admin (returns boolean):

```typescript
import { isCurrentUserAdmin } from '@/lib/auth';

export async function MyComponent() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return <div>Access denied</div>;
  }
  // ... render admin content
}
```

#### `requireRole(role)`
Require a specific role (more flexible):

```typescript
import { requireRole } from '@/lib/auth';

export const GET = async (req: NextRequest) => {
  const user = await requireRole('ACCOUNTANT'); // or 'ADMIN', 'USER'
  // ... your code
};
```

#### `withRole(role, handler)`
Wrapper for any role:

```typescript
import { withRole } from '@/lib/auth';

export const GET = withRole('ACCOUNTANT', async (req, user) => {
  // user is guaranteed to have the specified role
  return NextResponse.json({ data: 'something' });
});
```

## Permission System

The `@invoice-app/auth` package includes a fine-grained permission system:

### Permissions

Permissions are defined in `@invoice-app/auth/permissions.ts`:

```typescript
enum Permission {
  // User Management
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_MANAGE_ROLES = 'user:manage_roles',

  // Organization Management
  ORG_VIEW = 'org:view',
  ORG_CREATE = 'org:create',
  // ... more permissions
}
```

### Role-Permission Mapping

Each role has specific permissions:

```typescript
ROLE_PERMISSIONS = {
  ADMIN: [/* all permissions */],
  ACCOUNTANT: [/* view and manage assigned data */],
  USER: [/* manage own data only */],
}
```

### Using Permissions

```typescript
import { checkPermission, Permission } from '@invoice-app/auth';

// Server-side
const canCreateUser = await checkPermission(Permission.USER_CREATE);

// Check in code
import { roleHasPermission } from '@invoice-app/auth';

if (roleHasPermission(user.role, Permission.USER_CREATE)) {
  // allow user creation
}
```

## User Context

### Server Components

```typescript
import { getCurrentUser, getCurrentUserOrg } from '@invoice-app/auth';

export default async function MyPage() {
  const user = await getCurrentUser(); // throws if not authenticated
  const org = await getCurrentUserOrg(); // returns null if no org

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <p>Role: {user.role}</p>
      {org && <p>Organization: {org.name}</p>}
    </div>
  );
}
```

### Client Components

```typescript
'use client';

import { useAuth, useIsAdmin } from '@invoice-app/auth';

export function MyComponent() {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      {isAdmin && <button>Admin Only Action</button>}
    </div>
  );
}
```

## Security Best Practices

### Defense in Depth

Always verify roles on both:
1. **Middleware**: Prevents unauthorized page access
2. **API Routes**: Prevents direct API access

Never trust client-side checks alone!

### Logging

All admin actions are logged:
```
Admin action: GET /api/admin/users by admin@example.com (user-id-123)
Unauthorized access attempt by user user-id-456 with role USER
```

### Error Messages

Error responses don't leak sensitive information:
- 401 Unauthorized: "Authentication required"
- 403 Forbidden: "Admin access required"
- 500 Internal Server Error: "An unexpected error occurred"

### Audit Trail

Consider implementing:
- Detailed audit logs for sensitive actions
- IP address tracking
- Failed login attempt monitoring
- Regular security audits

## Testing

### Test as Admin User
1. Sign in with admin account
2. Should have full access to all pages
3. Should see role badge in sidebar
4. API routes should work

### Test as Regular User
1. Sign in with user account
2. Should be redirected to `/unauthorized`
3. Should see friendly error message
4. API routes should return 403 Forbidden

### Test as Unauthenticated
1. Visit admin dashboard without signing in
2. Should redirect to sign-in page
3. After sign-in, role check should run

### Test API Protection
```bash
# Without auth (should fail)
curl http://localhost:3000/api/admin/me

# With non-admin user (should fail)
curl -H "Authorization: Bearer <user-token>" http://localhost:3000/api/admin/me

# With admin user (should succeed)
curl -H "Authorization: Bearer <admin-token>" http://localhost:3000/api/admin/me
```

## Troubleshooting

### User Not Found in Database

If a user exists in Clerk but not in the database:
- The `getCurrentUser()` function auto-creates them with USER role
- Admin must manually upgrade role to ADMIN in database

### Role Not Updating

After changing a user's role in the database:
- User must sign out and sign in again
- Middleware caches are cleared on sign-in
- Consider implementing a role sync webhook

### Middleware Not Running

Check `middleware.ts` matcher config:
```typescript
export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

## Future Enhancements

Consider implementing:

1. **Permission Caching**: Cache user permissions to reduce DB queries
2. **Role Hierarchy**: ADMIN inherits all ACCOUNTANT permissions
3. **Custom Permissions**: Allow orgs to define custom permissions
4. **Temporary Access**: Time-limited role elevations
5. **2FA for Admins**: Require two-factor auth for admin users
6. **Session Management**: Track and revoke active sessions
7. **Webhook Sync**: Automatically sync roles from external systems

## Related Files

- `src/packages/auth/src/server.ts` - Server-side auth utilities
- `src/packages/auth/src/permissions.ts` - Permission definitions
- `src/packages/auth/src/types.ts` - Type definitions
- `src/apps/admin-dashboard/middleware.ts` - Middleware protection
- `src/apps/admin-dashboard/lib/auth.ts` - Admin route protection
- `src/apps/admin-dashboard/app/unauthorized/page.tsx` - Unauthorized page
