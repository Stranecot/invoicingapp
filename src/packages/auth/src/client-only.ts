/**
 * Client-only exports for the auth package
 * Import from '@invoice-app/auth/client' to avoid bundling server code
 */

'use client';

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
  type Role,
} from './client';
