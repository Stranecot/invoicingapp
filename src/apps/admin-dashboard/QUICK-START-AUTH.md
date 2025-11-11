# Quick Start: Admin Authentication

## TL;DR - What You Need to Know

The admin dashboard is now **fully protected** with role-based access control. Only users with the `ADMIN` role can access it.

## For Developers

### Protecting a New API Route

```typescript
// app/api/admin/my-endpoint/route.ts
import { withAdminAuth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withAdminAuth(async (req: NextRequest, user) => {
  // user is guaranteed to be an admin
  // user has: { id, clerkId, email, name, role, organizationId }

  return NextResponse.json({
    message: 'Success',
    data: 'your data here'
  });
});
```

### Server Component Protection

```typescript
// app/admin-only-page/page.tsx
import { requireAdmin } from '@invoice-app/auth';

export default async function AdminPage() {
  const user = await requireAdmin(); // throws if not admin

  return (
    <div>
      <h1>Hello, {user.name}!</h1>
      <p>You are an admin with email: {user.email}</p>
    </div>
  );
}
```

### Client Component Role Check

```typescript
'use client';
import { useIsAdmin, useAuth } from '@invoice-app/auth';

export function AdminButton() {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin();

  if (loading) return <div>Loading...</div>;
  if (!isAdmin) return null;

  return <button>Admin Only Action</button>;
}
```

### Checking Permissions

```typescript
import { checkPermission, Permission } from '@invoice-app/auth';

// In server component or API route
const canCreateUsers = await checkPermission(Permission.USER_CREATE);

if (canCreateUsers) {
  // proceed with user creation
}
```

## Available Functions

### Server-Side (@invoice-app/auth)

```typescript
// User functions
getCurrentUser()              // Get current user (throws if not auth)
getCurrentUserOrNull()        // Get current user or null
getCurrentUserOrg()           // Get user's organization

// Role checks
isAdmin()                     // Check if current user is admin
isAccountant()                // Check if current user is accountant
isUser()                      // Check if current user is regular user
hasRole(role)                 // Check if user has specific role

// Requirements (throw if not met)
requireAdmin()                // Require admin role
requireAccountantOrAdmin()    // Require accountant or admin

// Permissions
checkPermission(permission)   // Check if user has permission
roleHasPermission(role, perm) // Check if role has permission

// Access control
canAccessCustomer(customerId) // Check customer access
getAccessibleCustomerIds()    // Get accessible customers
getUserAccessFilter()         // Get Prisma filter for user access
```

### Client-Side (@invoice-app/auth)

```typescript
// Hooks
useAuth()        // Get auth state and user data
useRole()        // Get current user role
useIsAdmin()     // Check if admin
useIsAccountant() // Check if accountant
useIsUser()      // Check if regular user
useCanEdit()     // Check if can edit
useCanDelete()   // Check if can delete
```

### Admin Dashboard Utilities (/lib/auth)

```typescript
// API route protection
withAdminAuth(handler)        // Wrap API handler with admin auth
withRole(role, handler)       // Wrap API handler with role check

// Helper functions
getAdminUser()                // Get admin user (throws if not admin)
isCurrentUserAdmin()          // Boolean check for admin
requireRole(role)             // Require specific role
```

## How It Works

### 1. Middleware Protection
Every request goes through middleware that:
- Checks if user is authenticated (Clerk)
- Fetches user from database
- Verifies user has ADMIN role
- Redirects non-admins to `/unauthorized`

### 2. API Route Protection
API routes use `withAdminAuth` wrapper that:
- Verifies authentication
- Checks admin role
- Logs admin actions
- Returns proper error codes (401, 403)

### 3. Permission System
Fine-grained permissions for future features:
- 28+ permissions defined
- Role-to-permission mapping
- Easy to extend

## Testing

### Make Yourself an Admin

```sql
-- Connect to your database and run:
UPDATE "User"
SET role = 'ADMIN'
WHERE email = 'your-email@example.com';
```

Or use Prisma Studio:
```bash
npx prisma studio
# Navigate to User table
# Find your user
# Change role to ADMIN
```

### Test Non-Admin Access

1. Sign in with a non-admin account
2. Try to access admin dashboard
3. Should see "Access Denied" page
4. Should have button to go to client portal

### Test API Protection

```bash
# This should fail with 403 if not admin
curl http://localhost:3000/api/admin/me
```

## Common Patterns

### Show UI Only to Admins

```typescript
import { isAdmin } from '@invoice-app/auth';

export default async function Page() {
  const admin = await isAdmin();

  return (
    <div>
      <h1>Dashboard</h1>
      {admin && <AdminControls />}
    </div>
  );
}
```

### Multiple Role Check

```typescript
import { hasRole } from '@invoice-app/auth';

const canManage = await hasRole('ADMIN') || await hasRole('ACCOUNTANT');
```

### Organization-Aware

```typescript
import { getCurrentUser, getCurrentUserOrg } from '@invoice-app/auth';

const user = await getCurrentUser();
const org = await getCurrentUserOrg();

console.log(`User ${user.email} belongs to org ${org?.name}`);
```

## Troubleshooting

### "Access Denied" for Admin User
- Check database: Is user.role set to 'ADMIN'?
- Sign out and sign in again
- Check middleware logs in console

### TypeScript Errors
```bash
# Rebuild auth package
cd src/packages/auth
npm run build

# Check for errors
cd ../../apps/admin-dashboard
npx tsc --noEmit
```

### Middleware Not Running
- Check `middleware.ts` matcher configuration
- Restart dev server
- Clear Next.js cache: `rm -rf .next`

## Security Notes

- Never check roles only on client-side
- Always verify on server (middleware + API routes)
- Middleware logs all unauthorized attempts
- Admin actions are logged for audit trail

## Next Steps

For detailed documentation, see:
- `AUTHENTICATION.md` - Complete authentication guide
- `ISSUE-12-IMPLEMENTATION-SUMMARY.md` - Implementation details

## Need Help?

Common tasks:
- Making user admin: Update `User.role` to 'ADMIN' in database
- Adding new protected route: Use `withAdminAuth` wrapper
- Checking permissions: Use `checkPermission()` function
- Client-side checks: Use `useIsAdmin()` hook

---

For more information, check the comprehensive `AUTHENTICATION.md` guide.
