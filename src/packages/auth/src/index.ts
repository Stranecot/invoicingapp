/**
 * @invoice-app/auth
 *
 * Shared authentication utilities for the Invoice App
 *
 * This package provides:
 * - Server-side authentication utilities for API routes and server components
 * - Client-side authentication hooks for React components
 * - TypeScript types for User and Role
 */

// Server-side exports
export {
  getCurrentUser,
  getCurrentUserOrNull,
  hasRole,
  isAdmin,
  isAccountant,
  isUser,
  requireAdmin,
  requireAccountantOrAdmin,
  canAccessCustomer,
  getAccessibleCustomerIds,
  getUserAccessFilter,
  type UserWithRole,
  Role,
} from './server';

// Client-side exports
export {
  useAuth,
  useRole,
  useIsAdmin,
  useIsAccountant,
  useIsUser,
  useCanEdit,
  useCanDelete,
  type UserData,
} from './client';

// Re-export Role type for convenience
export type { Role } from '@invoice-app/database';
