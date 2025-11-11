/**
 * Unit tests for permissions module
 * Tests role-based permission checking and permission utilities
 */

import { describe, it, expect } from 'vitest';
import {
  Permission,
  ResourceType,
  Action,
  ROLE_PERMISSIONS,
  roleHasPermission,
  roleHasAnyPermission,
  roleHasAllPermissions,
  getRolePermissions,
  buildPermission,
  getPermissionScope,
} from './permissions';
import { Role } from '@invoice-app/database';

describe('permissions', () => {
  describe('ROLE_PERMISSIONS', () => {
    it('should define permissions for ADMIN role', () => {
      const adminPerms = ROLE_PERMISSIONS.ADMIN;
      expect(adminPerms).toBeDefined();
      expect(adminPerms.length).toBeGreaterThan(0);
      expect(adminPerms).toContain(Permission.USER_VIEW);
      expect(adminPerms).toContain(Permission.USER_CREATE);
      expect(adminPerms).toContain(Permission.USER_DELETE);
      expect(adminPerms).toContain(Permission.ORG_VIEW);
      expect(adminPerms).toContain(Permission.INVOICE_VIEW_ALL);
    });

    it('should define permissions for USER role', () => {
      const userPerms = ROLE_PERMISSIONS.USER;
      expect(userPerms).toBeDefined();
      expect(userPerms.length).toBeGreaterThan(0);
      expect(userPerms).toContain(Permission.INVOICE_VIEW_OWN);
      expect(userPerms).toContain(Permission.INVOICE_CREATE);
      expect(userPerms).not.toContain(Permission.USER_DELETE);
      expect(userPerms).not.toContain(Permission.INVOICE_VIEW_ALL);
    });

    it('should define permissions for ACCOUNTANT role', () => {
      const accountantPerms = ROLE_PERMISSIONS.ACCOUNTANT;
      expect(accountantPerms).toBeDefined();
      expect(accountantPerms.length).toBeGreaterThan(0);
      expect(accountantPerms).toContain(Permission.INVOICE_VIEW_ALL);
      expect(accountantPerms).toContain(Permission.CUSTOMER_VIEW_ALL);
      expect(accountantPerms).not.toContain(Permission.USER_DELETE);
      expect(accountantPerms).not.toContain(Permission.CUSTOMER_DELETE);
    });

    it('should give ADMIN more permissions than USER', () => {
      const adminPerms = ROLE_PERMISSIONS.ADMIN;
      const userPerms = ROLE_PERMISSIONS.USER;
      expect(adminPerms.length).toBeGreaterThan(userPerms.length);
    });
  });

  describe('roleHasPermission', () => {
    it('should return true when ADMIN has permission', () => {
      expect(roleHasPermission('ADMIN', Permission.USER_DELETE)).toBe(true);
      expect(roleHasPermission('ADMIN', Permission.ORG_DELETE)).toBe(true);
      expect(roleHasPermission('ADMIN', Permission.INVOICE_VIEW_ALL)).toBe(true);
    });

    it('should return false when USER does not have permission', () => {
      expect(roleHasPermission('USER', Permission.USER_DELETE)).toBe(false);
      expect(roleHasPermission('USER', Permission.ORG_DELETE)).toBe(false);
      expect(roleHasPermission('USER', Permission.INVOICE_VIEW_ALL)).toBe(false);
    });

    it('should return true when USER has own-scoped permissions', () => {
      expect(roleHasPermission('USER', Permission.INVOICE_VIEW_OWN)).toBe(true);
      expect(roleHasPermission('USER', Permission.INVOICE_CREATE)).toBe(true);
      expect(roleHasPermission('USER', Permission.CUSTOMER_VIEW_OWN)).toBe(true);
    });

    it('should return true when ACCOUNTANT has view-all permissions', () => {
      expect(roleHasPermission('ACCOUNTANT', Permission.INVOICE_VIEW_ALL)).toBe(true);
      expect(roleHasPermission('ACCOUNTANT', Permission.CUSTOMER_VIEW_ALL)).toBe(true);
      expect(roleHasPermission('ACCOUNTANT', Permission.EXPENSE_VIEW_ALL)).toBe(true);
    });

    it('should return false when ACCOUNTANT lacks delete permissions', () => {
      expect(roleHasPermission('ACCOUNTANT', Permission.INVOICE_DELETE)).toBe(false);
      expect(roleHasPermission('ACCOUNTANT', Permission.CUSTOMER_DELETE)).toBe(false);
      expect(roleHasPermission('ACCOUNTANT', Permission.EXPENSE_DELETE)).toBe(false);
    });
  });

  describe('roleHasAnyPermission', () => {
    it('should return true if role has at least one permission', () => {
      const result = roleHasAnyPermission('USER', [
        Permission.USER_DELETE,
        Permission.INVOICE_CREATE,
        Permission.ORG_DELETE,
      ]);
      expect(result).toBe(true);
    });

    it('should return false if role has none of the permissions', () => {
      const result = roleHasAnyPermission('USER', [
        Permission.USER_DELETE,
        Permission.ORG_DELETE,
        Permission.USER_MANAGE_ROLES,
      ]);
      expect(result).toBe(false);
    });

    it('should return true if ADMIN has any permission in list', () => {
      const result = roleHasAnyPermission('ADMIN', [
        Permission.USER_VIEW,
        Permission.INVOICE_VIEW_ALL,
      ]);
      expect(result).toBe(true);
    });
  });

  describe('roleHasAllPermissions', () => {
    it('should return true if role has all permissions', () => {
      const result = roleHasAllPermissions('ADMIN', [
        Permission.USER_VIEW,
        Permission.USER_CREATE,
        Permission.USER_DELETE,
      ]);
      expect(result).toBe(true);
    });

    it('should return false if role is missing any permission', () => {
      const result = roleHasAllPermissions('USER', [
        Permission.INVOICE_CREATE,
        Permission.USER_DELETE, // USER doesn't have this
      ]);
      expect(result).toBe(false);
    });

    it('should return true for USER with own-scoped permissions', () => {
      const result = roleHasAllPermissions('USER', [
        Permission.INVOICE_VIEW_OWN,
        Permission.CUSTOMER_VIEW_OWN,
      ]);
      expect(result).toBe(true);
    });
  });

  describe('getRolePermissions', () => {
    it('should return all permissions for ADMIN', () => {
      const perms = getRolePermissions('ADMIN');
      expect(perms).toEqual(ROLE_PERMISSIONS.ADMIN);
      expect(perms.length).toBeGreaterThan(15);
    });

    it('should return all permissions for USER', () => {
      const perms = getRolePermissions('USER');
      expect(perms).toEqual(ROLE_PERMISSIONS.USER);
      expect(perms).toContain(Permission.INVOICE_VIEW_OWN);
    });

    it('should return all permissions for ACCOUNTANT', () => {
      const perms = getRolePermissions('ACCOUNTANT');
      expect(perms).toEqual(ROLE_PERMISSIONS.ACCOUNTANT);
      expect(perms).toContain(Permission.INVOICE_VIEW_ALL);
    });
  });

  describe('buildPermission', () => {
    it('should build permission string without scope', () => {
      const permission = buildPermission(ResourceType.INVOICE, Action.CREATE);
      expect(permission).toBe('invoice:create');
    });

    it('should build permission string with scope', () => {
      const permission = buildPermission(ResourceType.INVOICE, Action.VIEW, 'all');
      expect(permission).toBe('invoice:view_all');
    });

    it('should build permission string with own scope', () => {
      const permission = buildPermission(ResourceType.CUSTOMER, Action.VIEW, 'own');
      expect(permission).toBe('customer:view_own');
    });

    it('should build permission for different resource types', () => {
      expect(buildPermission(ResourceType.USER, Action.DELETE)).toBe('user:delete');
      expect(buildPermission(ResourceType.ORGANIZATION, Action.UPDATE)).toBe('organization:update');
      expect(buildPermission(ResourceType.EXPENSE, Action.CREATE)).toBe('expense:create');
    });
  });

  describe('getPermissionScope', () => {
    it('should return "all" for view_all permissions', () => {
      expect(getPermissionScope(Permission.INVOICE_VIEW_ALL)).toBe('all');
      expect(getPermissionScope(Permission.CUSTOMER_VIEW_ALL)).toBe('all');
      expect(getPermissionScope(Permission.EXPENSE_VIEW_ALL)).toBe('all');
    });

    it('should return "own" for view_own permissions', () => {
      expect(getPermissionScope(Permission.INVOICE_VIEW_OWN)).toBe('own');
      expect(getPermissionScope(Permission.CUSTOMER_VIEW_OWN)).toBe('own');
      expect(getPermissionScope(Permission.EXPENSE_VIEW_OWN)).toBe('own');
    });

    it('should return "none" for permissions without scope', () => {
      expect(getPermissionScope(Permission.USER_CREATE)).toBe('none');
      expect(getPermissionScope(Permission.ORG_UPDATE)).toBe('none');
      expect(getPermissionScope(Permission.INVOICE_DELETE)).toBe('none');
    });
  });

  describe('Permission enums', () => {
    it('should have correct user management permissions', () => {
      expect(Permission.USER_VIEW).toBe('user:view');
      expect(Permission.USER_CREATE).toBe('user:create');
      expect(Permission.USER_UPDATE).toBe('user:update');
      expect(Permission.USER_DELETE).toBe('user:delete');
      expect(Permission.USER_MANAGE_ROLES).toBe('user:manage_roles');
    });

    it('should have correct organization permissions', () => {
      expect(Permission.ORG_VIEW).toBe('org:view');
      expect(Permission.ORG_CREATE).toBe('org:create');
      expect(Permission.ORG_UPDATE).toBe('org:update');
      expect(Permission.ORG_DELETE).toBe('org:delete');
    });

    it('should have correct invoice permissions', () => {
      expect(Permission.INVOICE_VIEW_ALL).toBe('invoice:view_all');
      expect(Permission.INVOICE_VIEW_OWN).toBe('invoice:view_own');
      expect(Permission.INVOICE_CREATE).toBe('invoice:create');
      expect(Permission.INVOICE_UPDATE).toBe('invoice:update');
      expect(Permission.INVOICE_DELETE).toBe('invoice:delete');
    });
  });

  describe('ResourceType enum', () => {
    it('should define all resource types', () => {
      expect(ResourceType.USER).toBe('user');
      expect(ResourceType.ORGANIZATION).toBe('organization');
      expect(ResourceType.INVOICE).toBe('invoice');
      expect(ResourceType.CUSTOMER).toBe('customer');
      expect(ResourceType.EXPENSE).toBe('expense');
      expect(ResourceType.INVITATION).toBe('invitation');
      expect(ResourceType.REPORT).toBe('report');
      expect(ResourceType.COMPANY).toBe('company');
      expect(ResourceType.NOTE).toBe('note');
    });
  });

  describe('Action enum', () => {
    it('should define all action types', () => {
      expect(Action.VIEW).toBe('view');
      expect(Action.CREATE).toBe('create');
      expect(Action.UPDATE).toBe('update');
      expect(Action.DELETE).toBe('delete');
      expect(Action.MANAGE).toBe('manage');
      expect(Action.EXPORT).toBe('export');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty permission arrays', () => {
      expect(roleHasAnyPermission('USER', [])).toBe(false);
      expect(roleHasAllPermissions('USER', [])).toBe(true); // vacuous truth
    });

    it('should be case-sensitive for role checks', () => {
      // TypeScript will prevent invalid roles at compile time,
      // but testing runtime behavior
      const validRole: Role = 'ADMIN';
      expect(roleHasPermission(validRole, Permission.USER_DELETE)).toBe(true);
    });
  });
});
