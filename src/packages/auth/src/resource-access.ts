import { prisma } from '@invoice-app/database';
import { ResourceType, Action } from './permissions';
import type { UserWithRole } from './types';

/**
 * Resource access control utilities
 *
 * These functions check if a user can access specific resources
 * at the organization and resource level.
 */

/**
 * Check if a user belongs to an organization
 */
export async function verifyOrgMembership(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });

  return user?.organizationId === organizationId;
}

/**
 * Check if a user can access a specific resource
 *
 * This performs both permission and ownership checks
 */
export async function canAccessResource(
  user: UserWithRole,
  resourceType: ResourceType,
  resourceId: string
): Promise<boolean> {
  // Admin can access everything
  if (user.role === 'ADMIN') {
    return true;
  }

  try {
    switch (resourceType) {
      case ResourceType.INVOICE:
        return await canAccessInvoice(user, resourceId);

      case ResourceType.CUSTOMER:
        return await canAccessCustomer(user, resourceId);

      case ResourceType.EXPENSE:
        return await canAccessExpense(user, resourceId);

      case ResourceType.USER:
        return await canAccessUser(user, resourceId);

      case ResourceType.ORGANIZATION:
        return await canAccessOrganization(user, resourceId);

      case ResourceType.INVITATION:
        return await canAccessInvitation(user, resourceId);

      case ResourceType.NOTE:
        return await canAccessNote(user, resourceId);

      case ResourceType.COMPANY:
        return await canAccessCompany(user, resourceId);

      default:
        return false;
    }
  } catch (error) {
    console.error(`Error checking access to ${resourceType}:${resourceId}:`, error);
    return false;
  }
}

/**
 * Check if user can perform a specific action on a resource type
 * This is a role-based check, not a resource instance check
 */
export function canPerformAction(
  user: UserWithRole,
  action: Action,
  resourceType: ResourceType
): boolean {
  const { roleHasPermission } = require('./permissions');

  // Map action and resource to permission
  const permissionMap: Record<string, string> = {
    [`${Action.VIEW}:${ResourceType.INVOICE}`]: user.role === 'ADMIN' ? 'invoice:view_all' : 'invoice:view_own',
    [`${Action.CREATE}:${ResourceType.INVOICE}`]: 'invoice:create',
    [`${Action.UPDATE}:${ResourceType.INVOICE}`]: 'invoice:update',
    [`${Action.DELETE}:${ResourceType.INVOICE}`]: 'invoice:delete',

    [`${Action.VIEW}:${ResourceType.CUSTOMER}`]: user.role === 'ADMIN' ? 'customer:view_all' : 'customer:view_own',
    [`${Action.CREATE}:${ResourceType.CUSTOMER}`]: 'customer:create',
    [`${Action.UPDATE}:${ResourceType.CUSTOMER}`]: 'customer:update',
    [`${Action.DELETE}:${ResourceType.CUSTOMER}`]: 'customer:delete',

    [`${Action.VIEW}:${ResourceType.EXPENSE}`]: user.role === 'ADMIN' ? 'expense:view_all' : 'expense:view_own',
    [`${Action.CREATE}:${ResourceType.EXPENSE}`]: 'expense:create',
    [`${Action.UPDATE}:${ResourceType.EXPENSE}`]: 'expense:update',
    [`${Action.DELETE}:${ResourceType.EXPENSE}`]: 'expense:delete',

    [`${Action.VIEW}:${ResourceType.USER}`]: 'user:view',
    [`${Action.CREATE}:${ResourceType.USER}`]: 'user:create',
    [`${Action.UPDATE}:${ResourceType.USER}`]: 'user:update',
    [`${Action.DELETE}:${ResourceType.USER}`]: 'user:delete',

    [`${Action.VIEW}:${ResourceType.ORGANIZATION}`]: 'org:view',
    [`${Action.UPDATE}:${ResourceType.ORGANIZATION}`]: 'org:update',
    [`${Action.MANAGE}:${ResourceType.ORGANIZATION}`]: 'org:manage_settings',
  };

  const permissionKey = `${action}:${resourceType}`;
  const requiredPermission = permissionMap[permissionKey];

  if (!requiredPermission) {
    return false;
  }

  return roleHasPermission(user.role, requiredPermission as any);
}

// Resource-specific access checks

async function canAccessInvoice(user: UserWithRole, invoiceId: string): Promise<boolean> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      userId: true,
      organizationId: true,
      customerId: true,
    },
  });

  if (!invoice) {
    return false;
  }

  // Check organization membership
  if (invoice.organizationId && user.organizationId !== invoice.organizationId) {
    return false;
  }

  // USER: Can access own invoices
  if (user.role === 'USER') {
    return invoice.userId === user.id;
  }

  // ACCOUNTANT: Can access invoices for assigned customers
  if (user.role === 'ACCOUNTANT') {
    const assignment = await prisma.accountantAssignment.findFirst({
      where: {
        accountantId: user.id,
        customerId: invoice.customerId,
      },
    });
    return !!assignment;
  }

  return false;
}

async function canAccessCustomer(user: UserWithRole, customerId: string): Promise<boolean> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      userId: true,
      organizationId: true,
      accountantAssignments: {
        where: { accountantId: user.id },
      },
    },
  });

  if (!customer) {
    return false;
  }

  // Check organization membership
  if (customer.organizationId && user.organizationId !== customer.organizationId) {
    return false;
  }

  // USER: Can access own customers
  if (user.role === 'USER') {
    return customer.userId === user.id;
  }

  // ACCOUNTANT: Can access assigned customers
  if (user.role === 'ACCOUNTANT') {
    return customer.accountantAssignments.length > 0;
  }

  return false;
}

async function canAccessExpense(user: UserWithRole, expenseId: string): Promise<boolean> {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    select: {
      userId: true,
      organizationId: true,
      customerId: true,
    },
  });

  if (!expense) {
    return false;
  }

  // Check organization membership
  if (expense.organizationId && user.organizationId !== expense.organizationId) {
    return false;
  }

  // USER: Can access own expenses
  if (user.role === 'USER') {
    return expense.userId === user.id;
  }

  // ACCOUNTANT: Can access expenses for assigned customers
  if (user.role === 'ACCOUNTANT' && expense.customerId) {
    const assignment = await prisma.accountantAssignment.findFirst({
      where: {
        accountantId: user.id,
        customerId: expense.customerId,
      },
    });
    return !!assignment;
  }

  return false;
}

async function canAccessUser(user: UserWithRole, targetUserId: string): Promise<boolean> {
  // Users can always access their own profile
  if (user.id === targetUserId) {
    return true;
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { organizationId: true },
  });

  if (!targetUser) {
    return false;
  }

  // Must be in same organization
  if (user.organizationId !== targetUser.organizationId) {
    return false;
  }

  // ADMIN can access all users in org
  // ACCOUNTANT and USER cannot access other users (except own)
  return false;
}

async function canAccessOrganization(user: UserWithRole, orgId: string): Promise<boolean> {
  // Must be member of the organization
  return user.organizationId === orgId;
}

async function canAccessInvitation(user: UserWithRole, invitationId: string): Promise<boolean> {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    select: { organizationId: true },
  });

  if (!invitation) {
    return false;
  }

  // Must be in same organization and be ADMIN
  return user.organizationId === invitation.organizationId && user.role === 'ADMIN';
}

async function canAccessNote(user: UserWithRole, noteId: string): Promise<boolean> {
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: {
      userId: true,
      entityType: true,
      entityId: true,
    },
  });

  if (!note) {
    return false;
  }

  // Users can access their own notes
  if (note.userId === user.id) {
    return true;
  }

  // Check if user has access to the entity the note is attached to
  const entityResourceType = note.entityType.toLowerCase() as ResourceType;
  return await canAccessResource(user, entityResourceType, note.entityId);
}

async function canAccessCompany(user: UserWithRole, companyId: string): Promise<boolean> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { userId: true },
  });

  if (!company) {
    return false;
  }

  // Users can only access their own company settings
  return company.userId === user.id;
}

/**
 * Get filter for querying resources based on user's access level
 * Returns a Prisma where clause that can be spread into queries
 */
export async function getResourceAccessFilter(
  user: UserWithRole,
  resourceType: ResourceType
): Promise<any> {
  // Admin sees everything in their org
  if (user.role === 'ADMIN') {
    if (user.organizationId) {
      return { organizationId: user.organizationId };
    }
    return {}; // No org means see everything (legacy single-tenant)
  }

  switch (resourceType) {
    case ResourceType.INVOICE:
      if (user.role === 'USER') {
        return { userId: user.id, organizationId: user.organizationId };
      }
      if (user.role === 'ACCOUNTANT') {
        const customerIds = await getAccessibleCustomerIds(user);
        return {
          customerId: { in: customerIds },
          organizationId: user.organizationId,
        };
      }
      break;

    case ResourceType.CUSTOMER:
      if (user.role === 'USER') {
        return { userId: user.id, organizationId: user.organizationId };
      }
      if (user.role === 'ACCOUNTANT') {
        const customerIds = await getAccessibleCustomerIds(user);
        return {
          id: { in: customerIds },
          organizationId: user.organizationId,
        };
      }
      break;

    case ResourceType.EXPENSE:
      if (user.role === 'USER') {
        return { userId: user.id, organizationId: user.organizationId };
      }
      if (user.role === 'ACCOUNTANT') {
        const customerIds = await getAccessibleCustomerIds(user);
        return {
          customerId: { in: customerIds },
          organizationId: user.organizationId,
        };
      }
      break;

    case ResourceType.USER:
      // Only admin can query users, and they must be in same org
      return { organizationId: user.organizationId };
  }

  // Fallback: impossible condition
  return { id: 'impossible' };
}

/**
 * Get all customer IDs accessible to the user
 */
async function getAccessibleCustomerIds(user: UserWithRole): Promise<string[]> {
  if (user.role === 'ADMIN') {
    const customers = await prisma.customer.findMany({
      where: user.organizationId ? { organizationId: user.organizationId } : {},
      select: { id: true },
    });
    return customers.map((c) => c.id);
  }

  if (user.role === 'USER') {
    const customers = await prisma.customer.findMany({
      where: {
        userId: user.id,
        organizationId: user.organizationId,
      },
      select: { id: true },
    });
    return customers.map((c) => c.id);
  }

  if (user.role === 'ACCOUNTANT') {
    const assignments = await prisma.accountantAssignment.findMany({
      where: { accountantId: user.id },
      select: { customerId: true },
    });
    return assignments.map((a) => a.customerId);
  }

  return [];
}
