/**
 * Clerk authentication mock for testing
 */

import { vi } from 'vitest';

/**
 * Mock Clerk auth function
 */
export const mockAuth = vi.fn(() => {
  return Promise.resolve({ userId: 'clerk-admin-123' });
});

/**
 * Mock Clerk currentUser function
 */
export const mockCurrentUser = vi.fn(() => {
  return Promise.resolve({
    id: 'clerk-admin-123',
    primaryEmailAddressId: 'email-123',
    emailAddresses: [
      {
        id: 'email-123',
        emailAddress: 'admin@test.com',
      },
    ],
    firstName: 'Admin',
    lastName: 'User',
  });
});

/**
 * Mock Clerk clerkClient
 */
export const mockClerkClient = {
  users: {
    getUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    getUserList: vi.fn(),
  },
};

/**
 * Setup Clerk mocks with custom return values
 */
export function setupClerkMocks(config: {
  userId?: string | null;
  user?: any;
}) {
  if (config.userId !== undefined) {
    mockAuth.mockResolvedValue({ userId: config.userId });
  }
  if (config.user !== undefined) {
    mockCurrentUser.mockResolvedValue(config.user);
  }
}

/**
 * Reset Clerk mocks to defaults
 */
export function resetClerkMocks() {
  mockAuth.mockResolvedValue({ userId: 'clerk-admin-123' });
  mockCurrentUser.mockResolvedValue({
    id: 'clerk-admin-123',
    primaryEmailAddressId: 'email-123',
    emailAddresses: [
      {
        id: 'email-123',
        emailAddress: 'admin@test.com',
      },
    ],
    firstName: 'Admin',
    lastName: 'User',
  });
  mockClerkClient.users.getUser.mockClear();
  mockClerkClient.users.updateUser.mockClear();
  mockClerkClient.users.deleteUser.mockClear();
  mockClerkClient.users.getUserList.mockClear();
}
