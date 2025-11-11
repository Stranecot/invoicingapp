/**
 * Unit tests for auth server module
 * Tests authentication, authorization, and user management functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockPrismaClient, mockTestData, resetPrismaMocks } from '../../../../test/mocks/prisma';
import { mockAuth, mockCurrentUser, setupClerkMocks, resetClerkMocks } from '../../../../test/mocks/clerk';

// Mock Clerk
vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
  currentUser: mockCurrentUser,
}));

// Mock database
const mockPrisma = createMockPrismaClient();
vi.mock('@invoice-app/database', () => ({
  prisma: mockPrisma,
  Role: { ADMIN: 'ADMIN', USER: 'USER', ACCOUNTANT: 'ACCOUNTANT' },
}));

// Import after mocks are set up
import {
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
  getCurrentUserOrg,
  checkPermission,
  getOrgFilter,
  withOrgFilter,
  requireOrganization,
  isInUserOrganization,
} from './server';

describe('server', () => {
  beforeEach(() => {
    resetPrismaMocks(mockPrisma);
    resetClerkMocks();
  });

  describe('getCurrentUser', () => {
    it('should return user when authenticated and exists in database', async () => {
      setupClerkMocks({ userId: 'clerk-admin-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);

      const user = await getCurrentUser();

      expect(user).toEqual(mockTestData.adminUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { clerkId: 'clerk-admin-123' },
        select: {
          id: true,
          clerkId: true,
          email: true,
          name: true,
          role: true,
          organizationId: true,
        },
      });
    });

    it('should throw error when not authenticated', async () => {
      setupClerkMocks({ userId: null });

      await expect(getCurrentUser()).rejects.toThrow('Unauthorized');
    });

    it('should auto-create user if exists in Clerk but not database', async () => {
      setupClerkMocks({ userId: 'clerk-new-123' });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const newUser = {
        ...mockTestData.regularUser,
        id: 'user-new-123',
        clerkId: 'clerk-new-123',
      };
      mockPrisma.user.create.mockResolvedValue(newUser);

      const user = await getCurrentUser();

      expect(user).toEqual(newUser);
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('should throw error if user not in database and not in Clerk', async () => {
      setupClerkMocks({ userId: 'clerk-nonexistent' });
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockCurrentUser.mockResolvedValue(null);

      await expect(getCurrentUser()).rejects.toThrow('Unauthorized');
    });
  });

  describe('getCurrentUserOrNull', () => {
    it('should return user when authenticated', async () => {
      setupClerkMocks({ userId: 'clerk-admin-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);

      const user = await getCurrentUserOrNull();

      expect(user).toEqual(mockTestData.adminUser);
    });

    it('should return null when not authenticated', async () => {
      setupClerkMocks({ userId: null });

      const user = await getCurrentUserOrNull();

      expect(user).toBeNull();
    });
  });

  describe('hasRole', () => {
    it('should return true when user has the specified role', async () => {
      setupClerkMocks({ userId: 'clerk-admin-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);

      const result = await hasRole('ADMIN');

      expect(result).toBe(true);
    });

    it('should return false when user has different role', async () => {
      setupClerkMocks({ userId: 'clerk-admin-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);

      const result = await hasRole('USER');

      expect(result).toBe(false);
    });

    it('should return false when not authenticated', async () => {
      setupClerkMocks({ userId: null });

      const result = await hasRole('ADMIN');

      expect(result).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin user', async () => {
      setupClerkMocks({ userId: 'clerk-admin-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);

      const result = await isAdmin();

      expect(result).toBe(true);
    });

    it('should return false for non-admin user', async () => {
      setupClerkMocks({ userId: 'clerk-regular-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.regularUser);

      const result = await isAdmin();

      expect(result).toBe(false);
    });
  });

  describe('isAccountant', () => {
    it('should return true for accountant user', async () => {
      setupClerkMocks({ userId: 'clerk-accountant-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.accountantUser);

      const result = await isAccountant();

      expect(result).toBe(true);
    });

    it('should return false for non-accountant user', async () => {
      setupClerkMocks({ userId: 'clerk-regular-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.regularUser);

      const result = await isAccountant();

      expect(result).toBe(false);
    });
  });

  describe('isUser', () => {
    it('should return true for regular user', async () => {
      setupClerkMocks({ userId: 'clerk-regular-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.regularUser);

      const result = await isUser();

      expect(result).toBe(true);
    });

    it('should return false for admin user', async () => {
      setupClerkMocks({ userId: 'clerk-admin-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);

      const result = await isUser();

      expect(result).toBe(false);
    });
  });

  describe('requireAdmin', () => {
    it('should return user when admin', async () => {
      setupClerkMocks({ userId: 'clerk-admin-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);

      const user = await requireAdmin();

      expect(user).toEqual(mockTestData.adminUser);
    });

    it('should throw error when not admin', async () => {
      setupClerkMocks({ userId: 'clerk-regular-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.regularUser);

      await expect(requireAdmin()).rejects.toThrow('Forbidden: Admin access required');
    });

    it('should throw error when not authenticated', async () => {
      setupClerkMocks({ userId: null });

      await expect(requireAdmin()).rejects.toThrow('Unauthorized');
    });
  });

  describe('requireAccountantOrAdmin', () => {
    it('should return user when accountant', async () => {
      setupClerkMocks({ userId: 'clerk-accountant-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.accountantUser);

      const user = await requireAccountantOrAdmin();

      expect(user).toEqual(mockTestData.accountantUser);
    });

    it('should return user when admin', async () => {
      setupClerkMocks({ userId: 'clerk-admin-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);

      const user = await requireAccountantOrAdmin();

      expect(user).toEqual(mockTestData.adminUser);
    });

    it('should throw error when regular user', async () => {
      setupClerkMocks({ userId: 'clerk-regular-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.regularUser);

      await expect(requireAccountantOrAdmin()).rejects.toThrow(
        'Forbidden: Accountant or Admin access required'
      );
    });
  });

  describe('canAccessCustomer', () => {
    it('should return true when admin accesses customer in their org', async () => {
      setupClerkMocks({ userId: 'clerk-admin-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);
      mockPrisma.customer.findUnique.mockResolvedValue({
        ...mockTestData.customer,
        accountantAssignments: [],
      });

      const result = await canAccessCustomer('customer-123');

      expect(result).toBe(true);
    });

    it('should return false when customer in different org', async () => {
      setupClerkMocks({ userId: 'clerk-admin-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);
      mockPrisma.customer.findUnique.mockResolvedValue({
        ...mockTestData.customer,
        organizationId: 'different-org',
        accountantAssignments: [],
      });

      const result = await canAccessCustomer('customer-123');

      expect(result).toBe(false);
    });

    it('should return true when user owns customer', async () => {
      setupClerkMocks({ userId: 'clerk-regular-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.regularUser);
      mockPrisma.customer.findUnique.mockResolvedValue({
        ...mockTestData.customer,
        userId: 'user-regular-123',
        accountantAssignments: [],
      });

      const result = await canAccessCustomer('customer-123');

      expect(result).toBe(true);
    });

    it('should return false when user does not own customer', async () => {
      setupClerkMocks({ userId: 'clerk-regular-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.regularUser);
      mockPrisma.customer.findUnique.mockResolvedValue({
        ...mockTestData.customer,
        userId: 'different-user',
        accountantAssignments: [],
      });

      const result = await canAccessCustomer('customer-123');

      expect(result).toBe(false);
    });

    it('should return true when accountant is assigned to customer', async () => {
      setupClerkMocks({ userId: 'clerk-accountant-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.accountantUser);
      mockPrisma.customer.findUnique.mockResolvedValue({
        ...mockTestData.customer,
        accountantAssignments: [{ accountantId: 'user-accountant-123' }],
      });

      const result = await canAccessCustomer('customer-123');

      expect(result).toBe(true);
    });

    it('should return false when customer does not exist', async () => {
      setupClerkMocks({ userId: 'clerk-admin-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);
      mockPrisma.customer.findUnique.mockResolvedValue(null);

      const result = await canAccessCustomer('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('getAccessibleCustomerIds', () => {
    it('should return all customers for admin in org', async () => {
      setupClerkMocks({ userId: 'clerk-admin-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);
      mockPrisma.customer.findMany.mockResolvedValue([
        { id: 'customer-1' },
        { id: 'customer-2' },
      ]);

      const ids = await getAccessibleCustomerIds();

      expect(ids).toEqual(['customer-1', 'customer-2']);
      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-123' },
        select: { id: true },
      });
    });

    it('should return own customers for regular user', async () => {
      setupClerkMocks({ userId: 'clerk-regular-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.regularUser);
      mockPrisma.customer.findMany.mockResolvedValue([{ id: 'customer-1' }]);

      const ids = await getAccessibleCustomerIds();

      expect(ids).toEqual(['customer-1']);
      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-regular-123', organizationId: 'org-123' },
        select: { id: true },
      });
    });

    it('should return assigned customers for accountant', async () => {
      setupClerkMocks({ userId: 'clerk-accountant-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.accountantUser);
      mockPrisma.accountantAssignment.findMany.mockResolvedValue([
        { customerId: 'customer-1' },
        { customerId: 'customer-2' },
      ]);

      const ids = await getAccessibleCustomerIds();

      expect(ids).toEqual(['customer-1', 'customer-2']);
    });
  });

  describe('getUserAccessFilter', () => {
    it('should return org filter for admin', async () => {
      setupClerkMocks({ userId: 'clerk-admin-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);

      const filter = await getUserAccessFilter();

      expect(filter).toEqual({ organizationId: 'org-123' });
    });

    it('should return user and org filter for regular user', async () => {
      setupClerkMocks({ userId: 'clerk-regular-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.regularUser);

      const filter = await getUserAccessFilter();

      expect(filter).toEqual({
        userId: 'user-regular-123',
        organizationId: 'org-123',
      });
    });

    it('should return customer filter for accountant', async () => {
      setupClerkMocks({ userId: 'clerk-accountant-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.accountantUser);
      mockPrisma.accountantAssignment.findMany.mockResolvedValue([
        { customerId: 'customer-1' },
      ]);

      const filter = await getUserAccessFilter();

      expect(filter).toEqual({
        customerId: { in: ['customer-1'] },
        organizationId: 'org-123',
      });
    });
  });

  describe('getCurrentUserOrg', () => {
    it('should return organization when user has one', async () => {
      setupClerkMocks({ userId: 'clerk-admin-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);
      mockPrisma.organization.findUnique.mockResolvedValue(mockTestData.organization);

      const org = await getCurrentUserOrg();

      expect(org).toBeDefined();
      expect(org?.id).toBe('org-123');
    });

    it('should return null when user has no organization', async () => {
      setupClerkMocks({ userId: 'clerk-regular-123' });
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockTestData.regularUser,
        organizationId: null,
      });

      const org = await getCurrentUserOrg();

      expect(org).toBeNull();
    });
  });

  describe('checkPermission', () => {
    it('should return true when user has permission', async () => {
      setupClerkMocks({ userId: 'clerk-admin-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);

      const result = await checkPermission('user:delete');

      expect(result).toBe(true);
    });

    it('should return false when user lacks permission', async () => {
      setupClerkMocks({ userId: 'clerk-regular-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.regularUser);

      const result = await checkPermission('user:delete');

      expect(result).toBe(false);
    });
  });

  describe('getOrgFilter', () => {
    it('should return organization filter when user has org', async () => {
      setupClerkMocks({ userId: 'clerk-admin-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);

      const filter = await getOrgFilter();

      expect(filter).toEqual({ organizationId: 'org-123' });
    });

    it('should return empty object when user has no org', async () => {
      setupClerkMocks({ userId: 'clerk-regular-123' });
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockTestData.regularUser,
        organizationId: null,
      });

      const filter = await getOrgFilter();

      expect(filter).toEqual({});
    });
  });

  describe('withOrgFilter', () => {
    it('should add org filter to existing where clause', async () => {
      setupClerkMocks({ userId: 'clerk-admin-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);

      const filter = await withOrgFilter({ status: 'ACTIVE' });

      expect(filter).toEqual({
        status: 'ACTIVE',
        organizationId: 'org-123',
      });
    });

    it('should work with empty where clause', async () => {
      setupClerkMocks({ userId: 'clerk-admin-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);

      const filter = await withOrgFilter();

      expect(filter).toEqual({ organizationId: 'org-123' });
    });
  });

  describe('requireOrganization', () => {
    it('should return organization ID when user has one', async () => {
      setupClerkMocks({ userId: 'clerk-admin-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);

      const orgId = await requireOrganization();

      expect(orgId).toBe('org-123');
    });

    it('should throw error when user has no organization', async () => {
      setupClerkMocks({ userId: 'clerk-regular-123' });
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockTestData.regularUser,
        organizationId: null,
      });

      await expect(requireOrganization()).rejects.toThrow(
        'User must belong to an organization'
      );
    });
  });

  describe('isInUserOrganization', () => {
    it('should return true when resource in same org', async () => {
      setupClerkMocks({ userId: 'clerk-admin-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);

      const result = await isInUserOrganization('org-123');

      expect(result).toBe(true);
    });

    it('should return false when resource in different org', async () => {
      setupClerkMocks({ userId: 'clerk-admin-123' });
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);

      const result = await isInUserOrganization('different-org');

      expect(result).toBe(false);
    });

    it('should return false when user has no org and resource has org', async () => {
      setupClerkMocks({ userId: 'clerk-regular-123' });
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockTestData.regularUser,
        organizationId: null,
      });

      const result = await isInUserOrganization('org-123');

      expect(result).toBe(false);
    });

    it('should return true when user has no org and resource has no org', async () => {
      setupClerkMocks({ userId: 'clerk-regular-123' });
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockTestData.regularUser,
        organizationId: null,
      });

      const result = await isInUserOrganization(null);

      expect(result).toBe(true);
    });
  });
});
