import { Role } from '@invoice-app/database';

/**
 * Type definitions for authentication and authorization
 */

/**
 * User with role information
 * This is the core user type used throughout the auth system
 */
export interface UserWithRole {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  role: Role;
  organizationId?: string | null;
}

/**
 * Organization information
 */
export interface OrganizationInfo {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  status: string;
  plan: string;
}

/**
 * User with organization information
 */
export interface UserWithOrganization extends UserWithRole {
  organization?: OrganizationInfo | null;
}

/**
 * Authentication context
 */
export interface AuthContext {
  user: UserWithRole | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAccountant: boolean;
  isUser: boolean;
}

/**
 * Authorization error types
 */
export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Re-export Role type from database
 */
export { Role } from '@invoice-app/database';
