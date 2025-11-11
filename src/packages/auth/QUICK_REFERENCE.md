# Enhanced RBAC Quick Reference

Quick reference guide for common RBAC operations in the @invoice-app/auth package.

## Server-Side Quick Reference

### Authentication

```typescript
import { requireAuth } from '@invoice-app/auth';

// Get authenticated user (throws if not authenticated)
const user = await requireAuth();
```

### Permission Checks

```typescript
import { requirePermission, Permission } from '@invoice-app/auth';

// Require specific permission
const user = await requirePermission(Permission.INVOICE_CREATE);
```

### Resource Access

```typescript
import { canAccessResource, ResourceType } from '@invoice-app/auth';

// Check if user can access specific resource
const hasAccess = await canAccessResource(user, ResourceType.INVOICE, invoiceId);

if (!hasAccess) {
  return errorResponse('Access denied', 403);
}
```

### List Resources with Filtering

```typescript
import { getResourceAccessFilter, ResourceType } from '@invoice-app/auth';

// Get filter for user's access level
const filter = await getResourceAccessFilter(user, ResourceType.INVOICE);

// Use in query
const invoices = await prisma.invoice.findMany({
  where: filter,
  // ... other query options
});
```

### Audit Logging

```typescript
import { logAction, Action, ResourceType } from '@invoice-app/auth';

// Log an action
await logAction(
  user,
  Action.CREATE,
  ResourceType.INVOICE,
  invoiceId,
  true,
  'Invoice created',
  { metadata: 'optional' }
);
```

## Client-Side Quick Reference

### Basic Permission Checks

```typescript
import {
  useCanCreate,
  useCanUpdate,
  useCanDeleteResource,
  useCanView
} from '@invoice-app/auth';

function MyComponent() {
  const canCreate = useCanCreate('invoice');
  const canUpdate = useCanUpdate('invoice');
  const canDelete = useCanDeleteResource('invoice');
  const { canView, scope } = useCanView('invoice');

  return (
    <div>
      {canCreate && <CreateButton />}
      {canUpdate && <EditButton />}
      {canDelete && <DeleteButton />}
      {scope === 'all' && <p>All invoices</p>}
      {scope === 'own' && <p>Your invoices</p>}
    </div>
  );
}
```

### Role Checks

```typescript
import { useIsAdmin, useIsAccountant, useRole } from '@invoice-app/auth';

function MyComponent() {
  const isAdmin = useIsAdmin();
  const isAccountant = useIsAccountant();
  const role = useRole();

  if (isAdmin) return <AdminPanel />;
  if (isAccountant) return <AccountantView />;
  return <UserView />;
}
```

### Specific Permissions

```typescript
import { useCanManageOrg, useCanInvite, useCanExport } from '@invoice-app/auth';

function SettingsPanel() {
  const canManageOrg = useCanManageOrg();
  const canInvite = useCanInvite();
  const canExport = useCanExport();

  return (
    <div>
      {canManageOrg && <OrganizationSettings />}
      {canInvite && <InviteUsers />}
      {canExport && <ExportData />}
    </div>
  );
}
```

## Common Patterns

### Pattern 1: Simple GET Route

```typescript
export async function GET() {
  const user = await requireAuth();
  const filter = await getResourceAccessFilter(user, ResourceType.INVOICE);

  const invoices = await prisma.invoice.findMany({ where: filter });
  return successResponse(invoices);
}
```

### Pattern 2: GET Single Resource

```typescript
export async function GET(request, { params }) {
  const user = await requireAuth();
  const { id } = await params;

  const hasAccess = await canAccessResource(user, ResourceType.INVOICE, id);
  if (!hasAccess) return errorResponse('Access denied', 403);

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  return successResponse(invoice);
}
```

### Pattern 3: POST Create Resource

```typescript
export async function POST(request) {
  const user = await requirePermission(Permission.INVOICE_CREATE);
  const data = await request.json();

  const resource = await prisma.invoice.create({
    data: {
      ...data,
      userId: user.id,
      organizationId: user.organizationId,
    },
  });

  await logAction(user, Action.CREATE, ResourceType.INVOICE, resource.id, true);
  return successResponse(resource, 201);
}
```

### Pattern 4: PUT Update Resource

```typescript
export async function PUT(request, { params }) {
  const user = await requireAuth();
  const { id } = await params;

  const hasAccess = await canAccessResource(user, ResourceType.INVOICE, id);
  if (!hasAccess) return errorResponse('Access denied', 403);

  const data = await request.json();
  const updated = await prisma.invoice.update({ where: { id }, data });

  await logAction(user, Action.UPDATE, ResourceType.INVOICE, id, true);
  return successResponse(updated);
}
```

### Pattern 5: DELETE Resource

```typescript
export async function DELETE(request, { params }) {
  const user = await requireAuth();
  const { id } = await params;

  const hasAccess = await canAccessResource(user, ResourceType.INVOICE, id);
  if (!hasAccess) return errorResponse('Access denied', 403);

  await prisma.invoice.delete({ where: { id } });

  await logAction(user, Action.DELETE, ResourceType.INVOICE, id, true);
  return successResponse({ success: true });
}
```

## Enums Reference

### ResourceType

```typescript
enum ResourceType {
  USER = 'user',
  ORGANIZATION = 'organization',
  INVOICE = 'invoice',
  CUSTOMER = 'customer',
  EXPENSE = 'expense',
  INVITATION = 'invitation',
  REPORT = 'report',
  COMPANY = 'company',
  NOTE = 'note',
}
```

### Action

```typescript
enum Action {
  VIEW = 'view',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
  EXPORT = 'export',
}
```

### Permission (Selected)

```typescript
enum Permission {
  // Invoices
  INVOICE_VIEW_ALL = 'invoice:view_all',
  INVOICE_VIEW_OWN = 'invoice:view_own',
  INVOICE_CREATE = 'invoice:create',
  INVOICE_UPDATE = 'invoice:update',
  INVOICE_DELETE = 'invoice:delete',

  // Customers
  CUSTOMER_VIEW_ALL = 'customer:view_all',
  CUSTOMER_VIEW_OWN = 'customer:view_own',
  CUSTOMER_CREATE = 'customer:create',
  CUSTOMER_UPDATE = 'customer:update',
  CUSTOMER_DELETE = 'customer:delete',

  // Organizations
  ORG_VIEW = 'org:view',
  ORG_UPDATE = 'org:update',
  ORG_MANAGE_SETTINGS = 'org:manage_settings',
  ORG_MANAGE_BILLING = 'org:manage_billing',

  // Users
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_MANAGE_ROLES = 'user:manage_roles',
}
```

## Role Capabilities

### ADMIN
- ✅ View all resources in organization
- ✅ Create, update, delete all resources
- ✅ Manage organization settings
- ✅ Manage users and roles
- ✅ Invite users
- ✅ Export data

### USER
- ✅ View own resources
- ✅ Create, update, delete own resources
- ❌ View other users' resources
- ❌ Manage organization
- ❌ Manage users

### ACCOUNTANT
- ✅ View assigned customers' resources
- ✅ Update invoice status
- ✅ Export data
- ❌ Create new resources
- ❌ Delete resources
- ❌ Edit invoice details (except status)

## Error Handling

```typescript
try {
  const user = await requireAuth();
  // ... your code
} catch (error) {
  if (error instanceof UnauthorizedError) {
    return errorResponse(error.message, 401);
  }
  if (error instanceof ForbiddenError) {
    return errorResponse(error.message, 403);
  }
  return errorResponse('Internal error', 500);
}
```

## Common Imports

```typescript
// Server-side
import {
  requireAuth,
  requirePermission,
  canAccessResource,
  getResourceAccessFilter,
  ResourceType,
  Action,
  Permission,
  logAction,
  logResourceAccess,
  UnauthorizedError,
  ForbiddenError,
  errorResponse,
  successResponse,
} from '@invoice-app/auth';

// Client-side
import {
  useAuth,
  useRole,
  useIsAdmin,
  useCanCreate,
  useCanUpdate,
  useCanDeleteResource,
  useCanView,
  useCanManageOrg,
  useCanInvite,
  useCanExport,
} from '@invoice-app/auth';
```

## Tips

1. **Always check organization membership** for multi-tenant isolation
2. **Use resource access checks** for individual resources
3. **Log security events** for audit trail
4. **Validate input** before database operations
5. **Use type-safe enums** instead of strings
6. **Handle errors properly** with appropriate status codes
7. **Filter lists** using `getResourceAccessFilter()`
8. **Check permissions early** to fail fast

## More Information

- See `IMPLEMENTATION_GUIDE.md` for detailed patterns
- See `TESTING_GUIDE.md` for testing scenarios
- See `invoices-enhanced-example/route.ts` for complete example
