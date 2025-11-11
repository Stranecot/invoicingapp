# @invoice-app/auth

Shared authentication utilities for the Invoice App monorepo.

## Features

- Server-side authentication for API routes and server components
- Client-side authentication hooks for React components
- Role-based access control (RBAC)
- TypeScript type definitions for User and Role

## Installation

This package is part of the Invoice App monorepo and is automatically available to other packages via npm workspaces.

```json
{
  "dependencies": {
    "@invoice-app/auth": "*"
  }
}
```

## Usage

### Server-side Authentication

Use these utilities in API routes, server components, and server actions:

```typescript
import { getCurrentUser, requireAdmin, canAccessCustomer } from '@invoice-app/auth/server';

// Get the current authenticated user
const user = await getCurrentUser();

// Require admin role (throws error if not admin)
const admin = await requireAdmin();

// Check if user can access a customer
const hasAccess = await canAccessCustomer(customerId);
```

### Client-side Authentication

Use these hooks in React components:

```typescript
import { useAuth, useIsAdmin, useRole } from '@invoice-app/auth/client';

function MyComponent() {
  const { user, loading, isSignedIn } = useAuth();
  const isAdmin = useIsAdmin();
  const role = useRole();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {user && <p>Welcome, {user.name}</p>}
      {isAdmin && <p>Admin Panel Access</p>}
    </div>
  );
}
```

### All-in-one Import

You can also import everything from the main entry point:

```typescript
// Server-side
import { getCurrentUser, requireAdmin } from '@invoice-app/auth';

// Client-side
import { useAuth, useIsAdmin } from '@invoice-app/auth';
```

## API Reference

### Server Functions

- `getCurrentUser()` - Get current authenticated user (throws if not authenticated)
- `getCurrentUserOrNull()` - Get current user or null if not authenticated
- `hasRole(role)` - Check if user has a specific role
- `isAdmin()` - Check if user is an admin
- `isAccountant()` - Check if user is an accountant
- `isUser()` - Check if user is a regular user
- `requireAdmin()` - Require admin role (throws error if not admin)
- `requireAccountantOrAdmin()` - Require accountant or admin role
- `canAccessCustomer(customerId)` - Check if user can access a customer
- `getAccessibleCustomerIds()` - Get all customer IDs user can access
- `getUserAccessFilter()` - Build Prisma where clause for user access

### Client Hooks

- `useAuth()` - Main auth hook (returns user, loading, isSignedIn, etc.)
- `useRole()` - Get current user's role
- `useIsAdmin()` - Check if user is admin
- `useIsAccountant()` - Check if user is accountant
- `useIsUser()` - Check if user is regular user
- `useCanEdit()` - Check if user can edit (admin or user)
- `useCanDelete()` - Check if user can delete (admin or user)

### Types

- `UserWithRole` - Server-side user type with role
- `UserData` - Client-side user type with role
- `Role` - Union type: 'ADMIN' | 'USER' | 'ACCOUNTANT'

## Dependencies

- `@clerk/nextjs` - Authentication provider
- `@invoice-app/database` - Database schema and Prisma client
- `react` - Client-side hooks

## License

Private - Invoice App Monorepo
