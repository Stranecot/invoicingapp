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
