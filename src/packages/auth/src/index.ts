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
  getCurrentUserOrg,
  hasRole,
  isAdmin,
  isAccountant,
  isUser,
  requireAdmin,
  requireAccountantOrAdmin,
  canAccessCustomer,
  getAccessibleCustomerIds,
  getUserAccessFilter,
  checkPermission,
} from './server';

export type { UserWithRole } from './server';
export { Role } from './server';

// Client-side exports
export {
  useAuth,
  useRole,
  useIsAdmin,
  useIsAccountant,
  useIsUser,
  useCanEdit,
  useCanDelete,
  useHasPermission,
  useHasAnyPermission,
  useCanPerform,
  useCanView,
  useCanCreate,
  useCanUpdate,
  useCanDeleteResource,
  useCanManageOrg,
  useCanManageBilling,
  useCanExport,
  useCanManageRoles,
  useCanInvite,
  usePermissionScope,
  type UserData,
} from './client';

// Permission system exports
export {
  Permission,
  ROLE_PERMISSIONS,
  roleHasPermission,
  roleHasAnyPermission,
  roleHasAllPermissions,
  getRolePermissions,
  ResourceType,
  Action,
  buildPermission,
  getPermissionScope,
} from './permissions';

// Resource access exports
export {
  verifyOrgMembership,
  canAccessResource,
  canPerformAction,
  getResourceAccessFilter,
} from './resource-access';

// Middleware exports
export {
  requireAuth,
  requirePermission,
  requireAnyPermission,
  requireOrganization,
  requireResourceAccess,
  requireAction,
  withAuth,
  withPermission,
  withResourceAccess,
  withOrganization,
  getIdFromParams,
  validateRequestBody,
  errorResponse,
  successResponse,
  type PermissionCheckResult,
} from './middleware';

// Audit logging exports
export {
  AuditEventType,
  logAuditEvent,
  logPermissionCheck,
  logResourceAccess,
  logAction,
  logAuthAttempt,
  logOrgMembershipCheck,
  getUserAuditLogs,
  getOrganizationAuditLogs,
  getResourceAuditLogs,
  getDeniedAccessLogs,
  clearAuditLogs,
  getAuditLogStats,
  type AuditLogEntry,
} from './audit-log';

// Type exports
export type {
  OrganizationInfo,
  UserWithOrganization,
  AuthContext,
} from './types';

export {
  UnauthorizedError,
  ForbiddenError,
} from './types';
