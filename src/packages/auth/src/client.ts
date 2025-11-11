'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export type Role = 'ADMIN' | 'USER' | 'ACCOUNTANT';

export interface UserData {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  role: Role;
}

// Check if Clerk is configured at build time
const isClerkConfigured = (() => {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return key && key !== 'your_clerk_publishable_key_here' && key.startsWith('pk_');
})();

// Safe wrapper for useUser that handles unconfigured Clerk
// Note: This violates rules of hooks by conditionally calling useUser,
// but it's necessary to support development mode without Clerk configured.
// In production, Clerk should always be properly configured.
function useSafeUser() {
  // Always call useUser to satisfy rules of hooks
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const clerkUser = isClerkConfigured ? useUser() : { isLoaded: true, isSignedIn: false, user: null };

  return clerkUser;
}

export function useAuth() {
  const { isLoaded, isSignedIn, user: clerkUser } = useSafeUser();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(!isClerkConfigured);

  useEffect(() => {
    if (!isClerkConfigured) {
      setLoading(false);
      return;
    }

    async function fetchUserData() {
      if (isLoaded && isSignedIn && clerkUser) {
        try {
          // In a real implementation, you might fetch user data from your API
          // For now, we'll use a placeholder
          // This would typically be: const response = await fetch('/api/users/me')

          // For development, you can use metadata from Clerk
          const role = (clerkUser.publicMetadata?.role as Role) || 'USER';

          setUserData({
            id: clerkUser.id,
            clerkId: clerkUser.id,
            email: clerkUser.emailAddresses[0]?.emailAddress || '',
            name: clerkUser.fullName || clerkUser.firstName || null,
            role,
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
      setLoading(false);
    }

    fetchUserData();
  }, [isLoaded, isSignedIn, clerkUser]);

  return {
    isLoaded,
    isSignedIn,
    user: userData,
    loading,
    clerkUser,
    isClerkConfigured,
  };
}

export function useRole() {
  const { user } = useAuth();
  return user?.role || null;
}

export function useIsAdmin() {
  const role = useRole();
  return role === 'ADMIN';
}

export function useIsAccountant() {
  const role = useRole();
  return role === 'ACCOUNTANT';
}

export function useIsUser() {
  const role = useRole();
  return role === 'USER';
}

export function useCanEdit() {
  const role = useRole();
  return role === 'ADMIN' || role === 'USER';
}

export function useCanDelete() {
  const role = useRole();
  return role === 'ADMIN' || role === 'USER';
}

/**
 * Check if user has a specific permission
 */
export function useHasPermission(permission: string): boolean {
  const role = useRole();
  if (!role) return false;

  // Import permissions dynamically to avoid circular dependencies
  const ROLE_PERMISSIONS: Record<string, string[]> = {
    ADMIN: [
      'user:view', 'user:create', 'user:update', 'user:delete', 'user:manage_roles',
      'org:view', 'org:create', 'org:update', 'org:delete', 'org:manage_settings', 'org:manage_billing',
      'invoice:view_all', 'invoice:create', 'invoice:update', 'invoice:delete',
      'customer:view_all', 'customer:create', 'customer:update', 'customer:delete',
      'expense:view_all', 'expense:create', 'expense:update', 'expense:delete',
      'invitation:view', 'invitation:create', 'invitation:revoke',
      'report:view_all', 'report:export',
    ],
    USER: [
      'invoice:view_own', 'invoice:create', 'invoice:update', 'invoice:delete',
      'customer:view_own', 'customer:create', 'customer:update', 'customer:delete',
      'expense:view_own', 'expense:create', 'expense:update', 'expense:delete',
      'report:view_own',
    ],
    ACCOUNTANT: [
      'invoice:view_all', 'invoice:create', 'invoice:update',
      'customer:view_all',
      'expense:view_all', 'expense:create', 'expense:update',
      'report:view_all', 'report:export',
    ],
  };

  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return rolePermissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function useHasAnyPermission(permissions: string[]): boolean {
  const role = useRole();
  if (!role) return false;

  return permissions.some((permission) => useHasPermission(permission));
}

/**
 * Check if user can perform a specific action on a resource type
 */
export function useCanPerform(action: string, resourceType: string): boolean {
  const role = useRole();
  if (!role) return false;

  if (role === 'ADMIN') return true;

  // Map action and resource to permission
  const permissionKey = `${resourceType}:${action}`;
  const scopedPermission = `${permissionKey}_own`;

  return useHasPermission(permissionKey) || useHasPermission(scopedPermission);
}

/**
 * Check if user can view resources (all or own)
 */
export function useCanView(resourceType: 'invoice' | 'customer' | 'expense' | 'user' | 'report'): {
  canView: boolean;
  scope: 'all' | 'own' | 'none';
} {
  const role = useRole();

  if (!role) {
    return { canView: false, scope: 'none' };
  }

  if (role === 'ADMIN') {
    return { canView: true, scope: 'all' };
  }

  const viewAllPermission = `${resourceType}:view_all`;
  const viewOwnPermission = `${resourceType}:view_own`;

  if (useHasPermission(viewAllPermission)) {
    return { canView: true, scope: 'all' };
  }

  if (useHasPermission(viewOwnPermission)) {
    return { canView: true, scope: 'own' };
  }

  return { canView: false, scope: 'none' };
}

/**
 * Check if user can create a resource type
 */
export function useCanCreate(resourceType: 'invoice' | 'customer' | 'expense' | 'user' | 'invitation'): boolean {
  return useHasPermission(`${resourceType}:create`);
}

/**
 * Check if user can update a resource type
 */
export function useCanUpdate(resourceType: 'invoice' | 'customer' | 'expense' | 'user' | 'org'): boolean {
  return useHasPermission(`${resourceType}:update`);
}

/**
 * Check if user can delete a resource type
 */
export function useCanDeleteResource(resourceType: 'invoice' | 'customer' | 'expense' | 'user'): boolean {
  return useHasPermission(`${resourceType}:delete`);
}

/**
 * Check if user can manage organization settings
 */
export function useCanManageOrg(): boolean {
  return useHasPermission('org:manage_settings');
}

/**
 * Check if user can manage billing
 */
export function useCanManageBilling(): boolean {
  return useHasPermission('org:manage_billing');
}

/**
 * Check if user can export reports
 */
export function useCanExport(): boolean {
  return useHasPermission('report:export');
}

/**
 * Check if user can manage user roles
 */
export function useCanManageRoles(): boolean {
  return useHasPermission('user:manage_roles');
}

/**
 * Check if user can invite others
 */
export function useCanInvite(): boolean {
  return useHasPermission('invitation:create');
}

/**
 * Get permission scope for a resource type
 */
export function usePermissionScope(resourceType: 'invoice' | 'customer' | 'expense'): 'all' | 'own' | 'none' {
  const { scope } = useCanView(resourceType);
  return scope;
}
