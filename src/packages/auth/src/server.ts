import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma, Role } from '@invoice-app/database';

export type UserWithRole = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  organizationId?: string | null;
  emailVerified?: boolean;
};

export type JWTPayload = {
  userId: string;
  email: string;
  role: Role;
  organizationId?: string | null;
  iat: number;
  exp: number;
};

// ============================================================================
// Password Hashing Utilities
// ============================================================================

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
  return bcrypt.hash(password, rounds);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================================================
// JWT Token Management
// ============================================================================

/**
 * Generate a JWT token for a user
 */
export async function generateJWT(user: {
  id: string;
  email: string;
  role: Role;
  organizationId?: string | null;
}): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  if (!secret || process.env.JWT_SECRET === 'your-super-secret-jwt-key-min-32-chars-generate-with-openssl-rand-base64-32') {
    throw new Error('JWT_SECRET is not configured. Please set a secure JWT_SECRET in your environment variables.');
  }

  const jwt = await new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || '7d')
    .sign(secret);

  return jwt;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyJWT(token: string): Promise<JWTPayload> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as JWTPayload;
}

/**
 * Get JWT token from cookies
 */
async function getTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  return token || null;
}

// ============================================================================
// User Authentication
// ============================================================================

/**
 * Get the current authenticated user from the database
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<UserWithRole | null> {
  try {
    const token = await getTokenFromCookies();

    if (!token) {
      return null;
    }

    const payload = await verifyJWT(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        emailVerified: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      emailVerified: user.emailVerified,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Get the current user or null if not authenticated
 */
export async function getCurrentUserOrNull(): Promise<UserWithRole | null> {
  return getCurrentUser();
}

/**
 * Require authentication, throws error if not authenticated
 */
export async function requireAuth(): Promise<UserWithRole> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

// ============================================================================
// Role Checks
// ============================================================================

/**
 * Check if the current user has a specific role
 */
export async function hasRole(role: Role): Promise<boolean> {
  const user = await getCurrentUser();
  return user ? user.role === role : false;
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
  const user = await requireAuth();
  if (user.role !== 'ADMIN') {
    throw new Error('Forbidden: Admin access required');
  }
  return user;
}

/**
 * Require accountant or admin role
 */
export async function requireAccountantOrAdmin(): Promise<UserWithRole> {
  const user = await requireAuth();
  if (user.role !== 'ACCOUNTANT' && user.role !== 'ADMIN') {
    throw new Error('Forbidden: Accountant or Admin access required');
  }
  return user;
}

// ============================================================================
// Customer Access Control
// ============================================================================

/**
 * Check if the current user can access a specific customer's data
 * - Admins and Owners can access all customers in their organization
 * - Users and Employees can access their own customers in their organization
 * - Accountants can access assigned customers in their organization
 * CRITICAL SECURITY: Now includes organization check for multi-tenant isolation
 */
export async function canAccessCustomer(customerId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

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

  // Admin and Owner can access all customers in their organization
  if (user.role === 'ADMIN' || user.role === 'OWNER') {
    return true;
  }

  // User and Employee can access their own customers
  if ((user.role === 'USER' || user.role === 'EMPLOYEE') && customer.userId === user.id) {
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
  const user = await requireAuth();

  // All queries must be scoped to user's organization
  const orgFilter = user.organizationId ? { organizationId: user.organizationId } : {};

  if (user.role === 'ADMIN' || user.role === 'OWNER') {
    // Admin and Owner see all customers in their organization
    const customers = await prisma.customer.findMany({
      where: orgFilter,
      select: { id: true },
    });
    return customers.map((c) => c.id);
  }

  if (user.role === 'USER' || user.role === 'EMPLOYEE') {
    // User and Employee see only their own customers
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

// ============================================================================
// Organization Filtering (Multi-tenancy)
// ============================================================================

/**
 * Build a Prisma where clause for filtering data by user access
 * Returns an object that can be spread into a Prisma where clause
 * CRITICAL SECURITY: Now includes organization filtering for multi-tenant isolation
 */
export async function getUserAccessFilter() {
  const user = await requireAuth();

  // Organization filter is mandatory for all roles
  const orgFilter = user.organizationId ? { organizationId: user.organizationId } : {};

  if (user.role === 'ADMIN' || user.role === 'OWNER') {
    // Admin and Owner see all data within their organization only
    return orgFilter;
  }

  if (user.role === 'USER' || user.role === 'EMPLOYEE') {
    // User and Employee see only their own data
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
  const user = await requireAuth();

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
    const user = await requireAuth();
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
  const user = await requireAuth();
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
  const user = await requireAuth();
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
  const user = await requireAuth();

  // If user has no org, they can only access resources with no org (legacy data)
  if (!user.organizationId) {
    return !resourceOrgId;
  }

  // Resource must belong to user's organization
  return resourceOrgId === user.organizationId;
}

// Re-export Role type from database package
export { Role } from '@invoice-app/database';
