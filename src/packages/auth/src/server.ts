import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma, Role } from '@invoice-app/database';

export type UserWithRole = {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  role: Role;
  organizationId?: string | null;
};

/**
 * Get the current authenticated user from the database
 * Throws an error if not authenticated
 * Auto-creates user if they exist in Clerk but not in database
 */
export async function getCurrentUser(): Promise<UserWithRole> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  let user = await prisma.user.findUnique({
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

  // If user doesn't exist in database but is authenticated in Clerk,
  // create them automatically (webhook might have failed)
  if (!user) {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      throw new Error('Unauthorized');
    }

    const primaryEmail = clerkUser.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId
    );

    if (!primaryEmail) {
      throw new Error('No primary email found');
    }

    // Create user with default company
    const createdUser = await prisma.user.create({
      data: {
        clerkId: userId,
        email: primaryEmail.emailAddress,
        name: clerkUser.firstName && clerkUser.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser.firstName || clerkUser.lastName || null,
        role: 'USER',
        company: {
          create: {
            name: 'My Company',
            email: primaryEmail.emailAddress,
            taxRate: 0,
          },
        },
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
      },
    });

    console.log('Auto-created user from Clerk:', createdUser.email);
    return createdUser;
  }

  return user;
}

/**
 * Get the current user or null if not authenticated
 */
export async function getCurrentUserOrNull(): Promise<UserWithRole | null> {
  try {
    return await getCurrentUser();
  } catch {
    return null;
  }
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(role: Role): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return user.role === role;
  } catch {
    return false;
  }
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole('ADMIN');
}

/**
 * Check if the current user is an accountant
 */
export async function isAccountant(): Promise<boolean> {
  return hasRole('ACCOUNTANT');
}

/**
 * Check if the current user is a regular user
 */
export async function isUser(): Promise<boolean> {
  return hasRole('USER');
}

/**
 * Require admin role, throws error if not admin
 */
export async function requireAdmin(): Promise<UserWithRole> {
  const user = await getCurrentUser();
  if (user.role !== 'ADMIN') {
    throw new Error('Forbidden: Admin access required');
  }
  return user;
}

/**
 * Require accountant or admin role
 */
export async function requireAccountantOrAdmin(): Promise<UserWithRole> {
  const user = await getCurrentUser();
  if (user.role !== 'ACCOUNTANT' && user.role !== 'ADMIN') {
    throw new Error('Forbidden: Accountant or Admin access required');
  }
  return user;
}

/**
 * Check if the current user can access a specific customer's data
 * - Admins can access all customers in their organization
 * - Users can access their own customers in their organization
 * - Accountants can access assigned customers in their organization
 * CRITICAL SECURITY: Now includes organization check for multi-tenant isolation
 */
export async function canAccessCustomer(customerId: string): Promise<boolean> {
  const user = await getCurrentUser();

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      accountantAssignments: {
        where: { accountantId: user.id },
      },
    },
  });

  if (!customer) {
    return false;
  }

  // CRITICAL: Customer must belong to user's organization
  if (user.organizationId && customer.organizationId !== user.organizationId) {
    return false;
  }

  // Admin can access all customers in their organization
  if (user.role === 'ADMIN') {
    return true;
  }

  // User can access their own customers
  if (user.role === 'USER' && customer.userId === user.id) {
    return true;
  }

  // Accountant can access assigned customers
  if (user.role === 'ACCOUNTANT' && customer.accountantAssignments.length > 0) {
    return true;
  }

  return false;
}

/**
 * Get all customer IDs that the current user can access
 * IMPORTANT: This now includes organization filtering for multi-tenant security
 */
export async function getAccessibleCustomerIds(): Promise<string[]> {
  const user = await getCurrentUser();

  // All queries must be scoped to user's organization
  const orgFilter = user.organizationId ? { organizationId: user.organizationId } : {};

  if (user.role === 'ADMIN') {
    const customers = await prisma.customer.findMany({
      where: orgFilter,
      select: { id: true },
    });
    return customers.map((c) => c.id);
  }

  if (user.role === 'USER') {
    const customers = await prisma.customer.findMany({
      where: {
        userId: user.id,
        ...orgFilter,
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

/**
 * Build a Prisma where clause for filtering data by user access
 * Returns an object that can be spread into a Prisma where clause
 * CRITICAL SECURITY: Now includes organization filtering for multi-tenant isolation
 */
export async function getUserAccessFilter() {
  const user = await getCurrentUser();

  // Organization filter is mandatory for all roles
  const orgFilter = user.organizationId ? { organizationId: user.organizationId } : {};

  if (user.role === 'ADMIN') {
    // Admin sees all data within their organization only
    return orgFilter;
  }

  if (user.role === 'USER') {
    return {
      userId: user.id,
      ...orgFilter,
    };
  }

  if (user.role === 'ACCOUNTANT') {
    const customerIds = await getAccessibleCustomerIds();
    return {
      customerId: {
        in: customerIds,
      },
      ...orgFilter,
    };
  }

  // Fallback: return impossible condition
  return { id: 'impossible' };
}

/**
 * Get the current user's organization
 */
export async function getCurrentUserOrg() {
  const user = await getCurrentUser();

  if (!user.organizationId) {
    return null;
  }

  const organization = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      status: true,
      plan: true,
    },
  });

  return organization;
}

/**
 * Check if user has specific permission
 * Uses the permission system defined in permissions.ts
 */
export async function checkPermission(permission: string): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    const { roleHasPermission } = await import('./permissions');
    // Type assertion needed because permission is a string
    return roleHasPermission(user.role, permission as any);
  } catch {
    return false;
  }
}

/**
 * Get organization filter for Prisma queries
 * CRITICAL SECURITY: This ensures all data queries are scoped to user's organization
 * Returns empty object if user has no organization (for backwards compatibility)
 */
export async function getOrgFilter(): Promise<{ organizationId?: string }> {
  const user = await getCurrentUser();
  return user.organizationId ? { organizationId: user.organizationId } : {};
}

/**
 * Apply organization filter to a where clause
 * CRITICAL SECURITY: Use this to add organization filtering to any Prisma query
 * @param where - Existing where clause
 * @returns Where clause with organization filter applied
 */
export async function withOrgFilter<T extends Record<string, any>>(where: T = {} as T): Promise<T & { organizationId?: string }> {
  const orgFilter = await getOrgFilter();
  return { ...where, ...orgFilter };
}

/**
 * Require user to belong to an organization
 * Throws error if user doesn't have an organizationId
 */
export async function requireOrganization(): Promise<string> {
  const user = await getCurrentUser();
  if (!user.organizationId) {
    throw new Error('User must belong to an organization');
  }
  return user.organizationId;
}

/**
 * Check if a resource belongs to the current user's organization
 * CRITICAL SECURITY: Use this to verify organization ownership before operations
 */
export async function isInUserOrganization(resourceOrgId: string | null | undefined): Promise<boolean> {
  const user = await getCurrentUser();

  // If user has no org, they can only access resources with no org (legacy data)
  if (!user.organizationId) {
    return !resourceOrgId;
  }

  // Resource must belong to user's organization
  return resourceOrgId === user.organizationId;
}

// Re-export Role type from database package
export { Role } from '@invoice-app/database';
