import { Role } from '@invoice-app/database';

/**
 * Permission system for role-based access control
 *
 * This defines fine-grained permissions that can be checked throughout the application.
 * Permissions are grouped by resource and action.
 */

export enum Permission {
  // User Management
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_MANAGE_ROLES = 'user:manage_roles',

  // Organization Management
  ORG_VIEW = 'org:view',
  ORG_CREATE = 'org:create',
  ORG_UPDATE = 'org:update',
  ORG_DELETE = 'org:delete',
  ORG_MANAGE_SETTINGS = 'org:manage_settings',
  ORG_MANAGE_BILLING = 'org:manage_billing',

  // Invoice Management
  INVOICE_VIEW_ALL = 'invoice:view_all',
  INVOICE_VIEW_OWN = 'invoice:view_own',
  INVOICE_CREATE = 'invoice:create',
  INVOICE_UPDATE = 'invoice:update',
  INVOICE_DELETE = 'invoice:delete',

  // Customer Management
  CUSTOMER_VIEW_ALL = 'customer:view_all',
  CUSTOMER_VIEW_OWN = 'customer:view_own',
  CUSTOMER_CREATE = 'customer:create',
  CUSTOMER_UPDATE = 'customer:update',
  CUSTOMER_DELETE = 'customer:delete',

  // Expense Management
  EXPENSE_VIEW_ALL = 'expense:view_all',
  EXPENSE_VIEW_OWN = 'expense:view_own',
  EXPENSE_CREATE = 'expense:create',
  EXPENSE_UPDATE = 'expense:update',
  EXPENSE_DELETE = 'expense:delete',

  // Invitation Management
  INVITATION_VIEW = 'invitation:view',
  INVITATION_CREATE = 'invitation:create',
  INVITATION_REVOKE = 'invitation:revoke',

  // Reports
  REPORT_VIEW_ALL = 'report:view_all',
  REPORT_VIEW_OWN = 'report:view_own',
  REPORT_EXPORT = 'report:export',
}

/**
 * Resource types for permission checks
 */
export enum ResourceType {
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

/**
 * Action types for permission checks
 */
export enum Action {
  VIEW = 'view',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
  EXPORT = 'export',
}

/**
 * Map of roles to their permissions
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    // Admins have all permissions
    Permission.USER_VIEW,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_MANAGE_ROLES,
    Permission.ORG_VIEW,
    Permission.ORG_CREATE,
    Permission.ORG_UPDATE,
    Permission.ORG_DELETE,
    Permission.ORG_MANAGE_SETTINGS,
    Permission.ORG_MANAGE_BILLING,
    Permission.INVOICE_VIEW_ALL,
    Permission.INVOICE_CREATE,
    Permission.INVOICE_UPDATE,
    Permission.INVOICE_DELETE,
    Permission.CUSTOMER_VIEW_ALL,
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_UPDATE,
    Permission.CUSTOMER_DELETE,
    Permission.EXPENSE_VIEW_ALL,
    Permission.EXPENSE_CREATE,
    Permission.EXPENSE_UPDATE,
    Permission.EXPENSE_DELETE,
    Permission.INVITATION_VIEW,
    Permission.INVITATION_CREATE,
    Permission.INVITATION_REVOKE,
    Permission.REPORT_VIEW_ALL,
    Permission.REPORT_EXPORT,
  ],
  USER: [
    // Regular users can manage their own data
    Permission.INVOICE_VIEW_OWN,
    Permission.INVOICE_CREATE,
    Permission.INVOICE_UPDATE,
    Permission.INVOICE_DELETE,
    Permission.CUSTOMER_VIEW_OWN,
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_UPDATE,
    Permission.CUSTOMER_DELETE,
    Permission.EXPENSE_VIEW_OWN,
    Permission.EXPENSE_CREATE,
    Permission.EXPENSE_UPDATE,
    Permission.EXPENSE_DELETE,
    Permission.REPORT_VIEW_OWN,
  ],
  ACCOUNTANT: [
    // Accountants can view and manage assigned customers and their data
    Permission.INVOICE_VIEW_ALL,
    Permission.INVOICE_CREATE,
    Permission.INVOICE_UPDATE,
    Permission.CUSTOMER_VIEW_ALL,
    Permission.EXPENSE_VIEW_ALL,
    Permission.EXPENSE_CREATE,
    Permission.EXPENSE_UPDATE,
    Permission.REPORT_VIEW_ALL,
    Permission.REPORT_EXPORT,
  ],
};

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function roleHasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((permission) => roleHasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function roleHasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((permission) => roleHasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Build permission string from resource and action
 * Useful for dynamic permission checking
 */
export function buildPermission(resourceType: ResourceType, action: Action, scope?: 'all' | 'own'): string {
  if (scope) {
    return `${resourceType}:${action}_${scope}`;
  }
  return `${resourceType}:${action}`;
}

/**
 * Check if a permission allows viewing all resources or just own
 */
export function getPermissionScope(permission: Permission): 'all' | 'own' | 'none' {
  const permStr = permission.toString();
  if (permStr.includes('_all')) return 'all';
  if (permStr.includes('_own')) return 'own';
  return 'none';
}
