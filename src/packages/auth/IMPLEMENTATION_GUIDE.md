# Enhanced RBAC Implementation Guide

This guide shows how to implement organization-level permissions and resource-based access control using the enhanced @invoice-app/auth package.

## Overview

The enhanced RBAC system provides:
- **Role-based permissions**: Define what each role can do
- **Organization-scoped access**: Users can only access data in their organization
- **Resource-level permissions**: Check if a user can access a specific resource instance
- **Audit logging**: Track all permission checks and access attempts
- **Reusable middleware**: Standardized guards for API routes

## Core Concepts

### 1. Permissions vs. Resource Access

- **Permissions**: What a role can do in general (e.g., "can create invoices")
- **Resource Access**: Whether a user can access a specific instance (e.g., "can access invoice #123")

### 2. Organization Scoping

All resources should be scoped to an organization. Users can only access resources in their organization.

### 3. Three Levels of Access Control

1. **Authentication**: Is the user logged in?
2. **Authorization**: Does the user's role have permission?
3. **Resource Access**: Can the user access this specific resource?

## Server-Side Implementation

### Pattern 1: Simple Permission Check

For routes that don't access specific resources:

```typescript
import { requirePermission, Permission } from '@invoice-app/auth';

export async function POST(request: NextRequest) {
  try {
    // Require specific permission
    const user = await requirePermission(Permission.CUSTOMER_CREATE);

    const data = await request.json();

    // Create resource for user's organization
    const customer = await prisma.customer.create({
      data: {
        ...data,
        userId: user.id,
        organizationId: user.organizationId,
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### Pattern 2: Resource Access Check

For routes that access specific resources:

```typescript
import {
  requireAuth,
  canAccessResource,
  ResourceType,
  logResourceAccess,
  logAction,
  Action
} from '@invoice-app/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Check if user can access this specific invoice
    const hasAccess = await canAccessResource(user, ResourceType.INVOICE, id);

    if (!hasAccess) {
      await logResourceAccess(user, ResourceType.INVOICE, id, false, 'Access denied');
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Log successful access
    await logResourceAccess(user, ResourceType.INVOICE, id, true);

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { customer: true, items: true },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    // Handle errors...
  }
}
```

### Pattern 3: Using Middleware Guards

For cleaner code, use the middleware guards:

```typescript
import {
  withResourceAccess,
  ResourceType,
  successResponse,
  errorResponse
} from '@invoice-app/auth';

// Handler function
async function getInvoice(user: UserWithRole, request: NextRequest, params: any) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { customer: true, items: true },
  });

  if (!invoice) {
    return errorResponse('Invoice not found', 404);
  }

  return successResponse(invoice);
}

// Route with guard
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withResourceAccess(
    ResourceType.INVOICE,
    async (req, p) => (await p).id,
    getInvoice,
    request,
    params
  );
}
```

### Pattern 4: List Resources with Filtering

For routes that return lists, use access filters:

```typescript
import {
  requireAuth,
  getResourceAccessFilter,
  ResourceType
} from '@invoice-app/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Get filter for user's access level
    const accessFilter = await getResourceAccessFilter(user, ResourceType.INVOICE);

    const invoices = await prisma.invoice.findMany({
      where: accessFilter,
      include: { customer: true, items: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    // Handle errors...
  }
}
```

### Pattern 5: Action-Based Checks

For dynamic action checking:

```typescript
import {
  requireAuth,
  canPerformAction,
  Action,
  ResourceType
} from '@invoice-app/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Check if user can perform create action
    if (!canPerformAction(user, Action.CREATE, ResourceType.INVOICE)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create invoice...
  } catch (error) {
    // Handle errors...
  }
}
```

## Client-Side Implementation

### Basic Permission Checks

```typescript
import {
  useCanCreate,
  useCanUpdate,
  useCanDelete,
  useCanView
} from '@invoice-app/auth';

function InvoiceActions() {
  const canCreate = useCanCreate('invoice');
  const canUpdate = useCanUpdate('invoice');
  const canDelete = useCanDeleteResource('invoice');
  const { canView, scope } = useCanView('invoice');

  return (
    <div>
      {canCreate && <Button>Create Invoice</Button>}
      {canUpdate && <Button>Edit</Button>}
      {canDelete && <Button>Delete</Button>}
      {scope === 'all' && <p>Viewing all invoices</p>}
      {scope === 'own' && <p>Viewing your invoices</p>}
    </div>
  );
}
```

### Specific Permission Checks

```typescript
import { useHasPermission, useCanManageOrg } from '@invoice-app/auth';

function SettingsPage() {
  const canManageOrg = useCanManageOrg();
  const canManageBilling = useHasPermission('org:manage_billing');

  return (
    <div>
      {canManageOrg && <OrganizationSettings />}
      {canManageBilling && <BillingSettings />}
    </div>
  );
}
```

### Role-Based UI

```typescript
import { useIsAdmin, useIsAccountant, useRole } from '@invoice-app/auth';

function Dashboard() {
  const isAdmin = useIsAdmin();
  const isAccountant = useIsAccountant();
  const role = useRole();

  return (
    <div>
      <h1>Dashboard</h1>
      {isAdmin && <AdminPanel />}
      {isAccountant && <AccountantView />}
      <p>Your role: {role}</p>
    </div>
  );
}
```

## Audit Logging

### Automatic Logging

The resource access functions automatically log:
- Permission checks
- Resource access attempts
- Access denials

### Manual Logging

For custom events:

```typescript
import { logAction, Action, ResourceType } from '@invoice-app/auth';

// After performing an action
await logAction(
  user,
  Action.UPDATE,
  ResourceType.INVOICE,
  invoiceId,
  true,
  'Invoice status updated to paid',
  { oldStatus: 'sent', newStatus: 'paid' }
);
```

### Viewing Audit Logs

```typescript
import {
  getUserAuditLogs,
  getOrganizationAuditLogs,
  getResourceAuditLogs
} from '@invoice-app/auth';

// Get user's audit log
const userLogs = await getUserAuditLogs(userId);

// Get organization's audit log
const orgLogs = await getOrganizationAuditLogs(orgId);

// Get logs for a specific resource
const invoiceLogs = await getResourceAuditLogs(
  ResourceType.INVOICE,
  invoiceId
);
```

## Best Practices

### 1. Always Check Organization Membership

```typescript
// Good: Filter by organization
const invoices = await prisma.invoice.findMany({
  where: {
    organizationId: user.organizationId,
    ...otherFilters
  }
});

// Bad: Missing organization check
const invoices = await prisma.invoice.findMany({
  where: otherFilters
});
```

### 2. Use the Most Specific Check

```typescript
// Better: Use resource access check
const hasAccess = await canAccessResource(user, ResourceType.INVOICE, id);

// Good, but less specific: Use permission check
const hasPermission = roleHasPermission(user.role, Permission.INVOICE_VIEW_ALL);
```

### 3. Log Security Events

```typescript
// Log access denials for security monitoring
if (!hasAccess) {
  await logResourceAccess(user, ResourceType.INVOICE, id, false);
  return errorResponse('Access denied', 403);
}
```

### 4. Validate Input

```typescript
import { validateRequestBody } from '@invoice-app/auth';

const data = await request.json();

if (!validateRequestBody(data, ['name', 'email'])) {
  return errorResponse('Missing required fields', 400);
}
```

### 5. Use Type-Safe Enums

```typescript
// Good: Type-safe
import { ResourceType, Action } from '@invoice-app/auth';
canPerformAction(user, Action.CREATE, ResourceType.INVOICE);

// Bad: String literals
canPerformAction(user, 'create', 'invoice');
```

## Migration Checklist

When updating existing routes:

- [ ] Replace manual role checks with permission functions
- [ ] Add organization filtering to all queries
- [ ] Use `canAccessResource()` for resource-specific routes
- [ ] Add audit logging for sensitive operations
- [ ] Update error responses to use standardized functions
- [ ] Add organization membership checks
- [ ] Test with different roles (ADMIN, USER, ACCOUNTANT)
- [ ] Test with different organizations
- [ ] Test access denial scenarios
- [ ] Review audit logs for proper tracking

## Testing

### Test Scenarios

1. **Authentication**
   - Unauthenticated user
   - Authenticated user

2. **Authorization**
   - ADMIN accessing all resources
   - USER accessing own resources
   - USER accessing other user's resources (should fail)
   - ACCOUNTANT accessing assigned customers
   - ACCOUNTANT accessing unassigned customers (should fail)

3. **Organization Scoping**
   - User accessing resource in their org
   - User accessing resource in different org (should fail)
   - User with no org accessing resource

4. **Resource Actions**
   - Creating resources
   - Updating own resources
   - Updating others' resources
   - Deleting resources

## Common Patterns by Role

### ADMIN
- Can access all resources in their organization
- Can manage organization settings
- Can invite users
- Can assign accountants to customers

### USER
- Can only access their own resources
- Can create/update/delete their own invoices, customers, expenses
- Cannot manage organization or users

### ACCOUNTANT
- Can view all customers and invoices they're assigned to
- Can update invoice status
- Cannot create or delete resources
- Read-only access to assigned data

## Troubleshooting

### Issue: User can't access their own resources

Check:
1. Is `organizationId` set on the resource?
2. Does the user have an `organizationId`?
3. Do they match?

### Issue: Permission denied errors

Check:
1. Does the role have the required permission?
2. Is the permission check using the correct permission enum?
3. Is the resource access check returning true?

### Issue: Audit logs not appearing

Check:
1. Are you importing from the correct package?
2. Is the log function being called with await?
3. Check console in development mode

## Performance Considerations

### Caching

Consider caching organization membership and customer assignments:

```typescript
// Cache user's accessible customer IDs
const cacheKey = `accessible_customers:${user.id}`;
let customerIds = cache.get(cacheKey);

if (!customerIds) {
  customerIds = await getAccessibleCustomerIds(user);
  cache.set(cacheKey, customerIds, 300); // 5 minutes
}
```

### Batch Checks

For multiple resources:

```typescript
// Instead of checking each resource individually
const accessible = await Promise.all(
  invoiceIds.map(id => canAccessResource(user, ResourceType.INVOICE, id))
);

// Better: Use a filter query
const accessFilter = await getResourceAccessFilter(user, ResourceType.INVOICE);
const invoices = await prisma.invoice.findMany({
  where: {
    id: { in: invoiceIds },
    ...accessFilter
  }
});
```

## Additional Resources

- See `permissions.ts` for all available permissions
- See `resource-access.ts` for resource access logic
- See `middleware.ts` for guard functions
- See `audit-log.ts` for logging utilities
