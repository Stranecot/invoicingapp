import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from './prisma';
import { Role } from '@prisma/client';

export type UserWithRole = {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  role: Role;
};

/**
 * Get the current authenticated user from the database
 * Throws an error if not authenticated
 */
export async function getCurrentUser(): Promise<UserWithRole> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      clerkId: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user) {
    throw new Error('User not found in database');
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
 * - Admins can access all customers
 * - Users can access their own customers
 * - Accountants can access assigned customers
 */
export async function canAccessCustomer(customerId: string): Promise<boolean> {
  const user = await getCurrentUser();

  // Admin can access everything
  if (user.role === 'ADMIN') {
    return true;
  }

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
 */
export async function getAccessibleCustomerIds(): Promise<string[]> {
  const user = await getCurrentUser();

  if (user.role === 'ADMIN') {
    const customers = await prisma.customer.findMany({
      select: { id: true },
    });
    return customers.map((c) => c.id);
  }

  if (user.role === 'USER') {
    const customers = await prisma.customer.findMany({
      where: { userId: user.id },
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
 */
export async function getUserAccessFilter() {
  const user = await getCurrentUser();

  if (user.role === 'ADMIN') {
    return {}; // No filter for admin
  }

  if (user.role === 'USER') {
    return { userId: user.id };
  }

  if (user.role === 'ACCOUNTANT') {
    const customerIds = await getAccessibleCustomerIds();
    return {
      customerId: {
        in: customerIds,
      },
    };
  }

  // Fallback: return impossible condition
  return { id: 'impossible' };
}
