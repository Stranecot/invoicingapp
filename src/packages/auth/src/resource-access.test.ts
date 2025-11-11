/**
 * Unit tests for resource-access module
 * Tests resource-level access control and permission checks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockPrismaClient, mockTestData, resetPrismaMocks } from '../../../../test/mocks/prisma';
import { ResourceType, Action } from './permissions';
import type { UserWithRole } from './types';

// Mock database
const mockPrisma = createMockPrismaClient();
vi.mock('@invoice-app/database', () => ({
  prisma: mockPrisma,
}));

// Import after mocks are set up
import {
  verifyOrgMembership,
  canAccessResource,
  canPerformAction,
  getResourceAccessFilter,
} from './resource-access';

describe('resource-access', () => {
  beforeEach(() => {
    resetPrismaMocks(mockPrisma);
  });

  describe('verifyOrgMembership', () => {
    it('should return true when user belongs to organization', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        organizationId: 'org-123',
      });

      const result = await verifyOrgMembership('user-123', 'org-123');

      expect(result).toBe(true);
    });

    it('should return false when user belongs to different organization', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        organizationId: 'different-org',
      });

      const result = await verifyOrgMembership('user-123', 'org-123');

      expect(result).toBe(false);
    });

    it('should return false when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await verifyOrgMembership('nonexistent', 'org-123');

      expect(result).toBe(false);
    });
  });

  describe('canAccessResource - Invoice', () => {
    it('should allow admin to access any invoice in their org', async () => {
      const adminUser: UserWithRole = mockTestData.adminUser;
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...mockTestData.invoice,
        userId: 'different-user',
      });

      const result = await canAccessResource(adminUser, ResourceType.INVOICE, 'invoice-123');

      expect(result).toBe(true);
    });

    it('should allow user to access their own invoice', async () => {
      const regularUser: UserWithRole = mockTestData.regularUser;
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...mockTestData.invoice,
        userId: 'user-regular-123',
      });

      const result = await canAccessResource(regularUser, ResourceType.INVOICE, 'invoice-123');

      expect(result).toBe(true);
    });

    it('should deny user access to someone elses invoice', async () => {
      const regularUser: UserWithRole = mockTestData.regularUser;
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...mockTestData.invoice,
        userId: 'different-user',
      });
      mockPrisma.accountantAssignment.findFirst.mockResolvedValue(null);

      const result = await canAccessResource(regularUser, ResourceType.INVOICE, 'invoice-123');

      expect(result).toBe(false);
    });

    it('should allow accountant to access invoice for assigned customer', async () => {
      const accountantUser: UserWithRole = mockTestData.accountantUser;
      mockPrisma.invoice.findUnique.mockResolvedValue(mockTestData.invoice);
      mockPrisma.accountantAssignment.findFirst.mockResolvedValue({
        accountantId: 'user-accountant-123',
        customerId: 'customer-123',
      });

      const result = await canAccessResource(accountantUser, ResourceType.INVOICE, 'invoice-123');

      expect(result).toBe(true);
    });

    it('should deny access to invoice in different organization', async () => {
      const regularUser: UserWithRole = mockTestData.regularUser;
      mockPrisma.invoice.findUnique.mockResolvedValue({
        ...mockTestData.invoice,
        organizationId: 'different-org',
      });

      const result = await canAccessResource(regularUser, ResourceType.INVOICE, 'invoice-123');

      expect(result).toBe(false);
    });

    it('should deny access to nonexistent invoice', async () => {
      const regularUser: UserWithRole = mockTestData.regularUser;
      mockPrisma.invoice.findUnique.mockResolvedValue(null);

      const result = await canAccessResource(regularUser, ResourceType.INVOICE, 'nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('canAccessResource - Customer', () => {
    it('should allow admin to access any customer in their org', async () => {
      const adminUser: UserWithRole = mockTestData.adminUser;
      mockPrisma.customer.findUnique.mockResolvedValue({
        ...mockTestData.customer,
        accountantAssignments: [],
      });

      const result = await canAccessResource(adminUser, ResourceType.CUSTOMER, 'customer-123');

      expect(result).toBe(true);
    });

    it('should allow user to access their own customer', async () => {
      const regularUser: UserWithRole = mockTestData.regularUser;
      mockPrisma.customer.findUnique.mockResolvedValue({
        ...mockTestData.customer,
        userId: 'user-regular-123',
        accountantAssignments: [],
      });

      const result = await canAccessResource(regularUser, ResourceType.CUSTOMER, 'customer-123');

      expect(result).toBe(true);
    });

    it('should allow accountant to access assigned customer', async () => {
      const accountantUser: UserWithRole = mockTestData.accountantUser;
      mockPrisma.customer.findUnique.mockResolvedValue({
        ...mockTestData.customer,
        accountantAssignments: [{ accountantId: 'user-accountant-123' }],
      });

      const result = await canAccessResource(accountantUser, ResourceType.CUSTOMER, 'customer-123');

      expect(result).toBe(true);
    });

    it('should deny accountant access to unassigned customer', async () => {
      const accountantUser: UserWithRole = mockTestData.accountantUser;
      mockPrisma.customer.findUnique.mockResolvedValue({
        ...mockTestData.customer,
        accountantAssignments: [],
      });

      const result = await canAccessResource(accountantUser, ResourceType.CUSTOMER, 'customer-123');

      expect(result).toBe(false);
    });
  });

  describe('canAccessResource - Expense', () => {
    it('should allow user to access their own expense', async () => {
      const regularUser: UserWithRole = mockTestData.regularUser;
      mockPrisma.expense.findUnique.mockResolvedValue({
        id: 'expense-123',
        userId: 'user-regular-123',
        organizationId: 'org-123',
        customerId: 'customer-123',
      });

      const result = await canAccessResource(regularUser, ResourceType.EXPENSE, 'expense-123');

      expect(result).toBe(true);
    });

    it('should allow accountant to access expense for assigned customer', async () => {
      const accountantUser: UserWithRole = mockTestData.accountantUser;
      mockPrisma.expense.findUnique.mockResolvedValue({
        id: 'expense-123',
        userId: 'different-user',
        organizationId: 'org-123',
        customerId: 'customer-123',
      });
      mockPrisma.accountantAssignment.findFirst.mockResolvedValue({
        accountantId: 'user-accountant-123',
        customerId: 'customer-123',
      });

      const result = await canAccessResource(accountantUser, ResourceType.EXPENSE, 'expense-123');

      expect(result).toBe(true);
    });

    it('should deny access to expense in different org', async () => {
      const regularUser: UserWithRole = mockTestData.regularUser;
      mockPrisma.expense.findUnique.mockResolvedValue({
        id: 'expense-123',
        userId: 'user-regular-123',
        organizationId: 'different-org',
        customerId: null,
      });

      const result = await canAccessResource(regularUser, ResourceType.EXPENSE, 'expense-123');

      expect(result).toBe(false);
    });
  });

  describe('canAccessResource - User', () => {
    it('should allow user to access their own profile', async () => {
      const regularUser: UserWithRole = mockTestData.regularUser;
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.regularUser);

      const result = await canAccessResource(regularUser, ResourceType.USER, 'user-regular-123');

      expect(result).toBe(true);
    });

    it('should allow admin to access other users', async () => {
      const adminUser: UserWithRole = mockTestData.adminUser;

      const result = await canAccessResource(adminUser, ResourceType.USER, 'other-user');

      expect(result).toBe(true);
    });

    it('should deny regular user access to other users', async () => {
      const regularUser: UserWithRole = mockTestData.regularUser;
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockTestData.regularUser,
        id: 'other-user',
      });

      const result = await canAccessResource(regularUser, ResourceType.USER, 'other-user');

      expect(result).toBe(false);
    });
  });

  describe('canAccessResource - Organization', () => {
    it('should allow user to access their own organization', async () => {
      const regularUser: UserWithRole = mockTestData.regularUser;

      const result = await canAccessResource(regularUser, ResourceType.ORGANIZATION, 'org-123');

      expect(result).toBe(true);
    });

    it('should deny user access to different organization', async () => {
      const regularUser: UserWithRole = mockTestData.regularUser;

      const result = await canAccessResource(regularUser, ResourceType.ORGANIZATION, 'different-org');

      expect(result).toBe(false);
    });
  });

  describe('canAccessResource - Invitation', () => {
    it('should allow admin to access invitation in their org', async () => {
      const adminUser: UserWithRole = mockTestData.adminUser;
      mockPrisma.invitation.findUnique.mockResolvedValue(mockTestData.invitation);

      const result = await canAccessResource(adminUser, ResourceType.INVITATION, 'invitation-123');

      expect(result).toBe(true);
    });

    it('should deny non-admin access to invitations', async () => {
      const regularUser: UserWithRole = mockTestData.regularUser;
      mockPrisma.invitation.findUnique.mockResolvedValue(mockTestData.invitation);

      const result = await canAccessResource(regularUser, ResourceType.INVITATION, 'invitation-123');

      expect(result).toBe(false);
    });

    it('should deny admin access to invitation in different org', async () => {
      const adminUser: UserWithRole = mockTestData.adminUser;
      mockPrisma.invitation.findUnique.mockResolvedValue({
        ...mockTestData.invitation,
        organizationId: 'different-org',
      });

      const result = await canAccessResource(adminUser, ResourceType.INVITATION, 'invitation-123');

      expect(result).toBe(false);
    });
  });

  describe('canAccessResource - Company', () => {
    it('should allow user to access their own company', async () => {
      const regularUser: UserWithRole = mockTestData.regularUser;
      mockPrisma.company.findUnique.mockResolvedValue({
        id: 'company-123',
        userId: 'user-regular-123',
      });

      const result = await canAccessResource(regularUser, ResourceType.COMPANY, 'company-123');

      expect(result).toBe(true);
    });

    it('should allow admin to access any company', async () => {
      const adminUser: UserWithRole = mockTestData.adminUser;

      const result = await canAccessResource(adminUser, ResourceType.COMPANY, 'company-123');

      expect(result).toBe(true);
    });

    it('should deny user access to different users company', async () => {
      const regularUser: UserWithRole = mockTestData.regularUser;
      mockPrisma.company.findUnique.mockResolvedValue({
        id: 'company-123',
        userId: 'different-user',
      });

      const result = await canAccessResource(regularUser, ResourceType.COMPANY, 'company-123');

      expect(result).toBe(false);
    });
  });

  describe('canAccessResource - Note', () => {
    it('should allow user to access their own note', async () => {
      const regularUser: UserWithRole = mockTestData.regularUser;
      mockPrisma.note.findUnique.mockResolvedValue({
        id: 'note-123',
        userId: 'user-regular-123',
        entityType: 'INVOICE',
        entityId: 'invoice-123',
      });

      const result = await canAccessResource(regularUser, ResourceType.NOTE, 'note-123');

      expect(result).toBe(true);
    });

    it('should allow admin to access any note', async () => {
      const adminUser: UserWithRole = mockTestData.adminUser;

      const result = await canAccessResource(adminUser, ResourceType.NOTE, 'note-123');

      expect(result).toBe(true);
    });
  });

  describe('canPerformAction', () => {
    it('should allow admin to perform any action', () => {
      const adminUser: UserWithRole = mockTestData.adminUser;

      expect(canPerformAction(adminUser, Action.DELETE, ResourceType.INVOICE)).toBe(true);
      expect(canPerformAction(adminUser, Action.DELETE, ResourceType.CUSTOMER)).toBe(true);
      expect(canPerformAction(adminUser, Action.DELETE, ResourceType.USER)).toBe(true);
    });

    it('should allow user to create invoices', () => {
      const regularUser: UserWithRole = mockTestData.regularUser;

      expect(canPerformAction(regularUser, Action.CREATE, ResourceType.INVOICE)).toBe(true);
    });

    it('should deny user from deleting invoices', () => {
      const regularUser: UserWithRole = mockTestData.regularUser;

      expect(canPerformAction(regularUser, Action.DELETE, ResourceType.INVOICE)).toBe(false);
    });

    it('should allow accountant to view all invoices', () => {
      const accountantUser: UserWithRole = mockTestData.accountantUser;

      expect(canPerformAction(accountantUser, Action.VIEW, ResourceType.INVOICE)).toBe(true);
    });

    it('should deny accountant from deleting customers', () => {
      const accountantUser: UserWithRole = mockTestData.accountantUser;

      expect(canPerformAction(accountantUser, Action.DELETE, ResourceType.CUSTOMER)).toBe(false);
    });

    it('should return false for unmapped actions', () => {
      const regularUser: UserWithRole = mockTestData.regularUser;

      expect(canPerformAction(regularUser, Action.EXPORT, ResourceType.INVOICE)).toBe(false);
    });
  });

  describe('getResourceAccessFilter - Invoice', () => {
    it('should return org filter for admin', async () => {
      const adminUser: UserWithRole = mockTestData.adminUser;

      const filter = await getResourceAccessFilter(adminUser, ResourceType.INVOICE);

      expect(filter).toEqual({ organizationId: 'org-123' });
    });

    it('should return user and org filter for regular user', async () => {
      const regularUser: UserWithRole = mockTestData.regularUser;

      const filter = await getResourceAccessFilter(regularUser, ResourceType.INVOICE);

      expect(filter).toEqual({
        userId: 'user-regular-123',
        organizationId: 'org-123',
      });
    });

    it('should return customer filter for accountant', async () => {
      const accountantUser: UserWithRole = mockTestData.accountantUser;
      mockPrisma.accountantAssignment.findMany.mockResolvedValue([
        { customerId: 'customer-1' },
        { customerId: 'customer-2' },
      ]);

      const filter = await getResourceAccessFilter(accountantUser, ResourceType.INVOICE);

      expect(filter).toEqual({
        customerId: { in: ['customer-1', 'customer-2'] },
        organizationId: 'org-123',
      });
    });

    it('should return empty org filter for admin with no org', async () => {
      const adminUser: UserWithRole = {
        ...mockTestData.adminUser,
        organizationId: null,
      };

      const filter = await getResourceAccessFilter(adminUser, ResourceType.INVOICE);

      expect(filter).toEqual({});
    });
  });

  describe('getResourceAccessFilter - Customer', () => {
    it('should return org filter for admin', async () => {
      const adminUser: UserWithRole = mockTestData.adminUser;

      const filter = await getResourceAccessFilter(adminUser, ResourceType.CUSTOMER);

      expect(filter).toEqual({ organizationId: 'org-123' });
    });

    it('should return user and org filter for regular user', async () => {
      const regularUser: UserWithRole = mockTestData.regularUser;

      const filter = await getResourceAccessFilter(regularUser, ResourceType.CUSTOMER);

      expect(filter).toEqual({
        userId: 'user-regular-123',
        organizationId: 'org-123',
      });
    });

    it('should return customer ID filter for accountant', async () => {
      const accountantUser: UserWithRole = mockTestData.accountantUser;
      mockPrisma.accountantAssignment.findMany.mockResolvedValue([
        { customerId: 'customer-1' },
      ]);

      const filter = await getResourceAccessFilter(accountantUser, ResourceType.CUSTOMER);

      expect(filter).toEqual({
        id: { in: ['customer-1'] },
        organizationId: 'org-123',
      });
    });
  });

  describe('getResourceAccessFilter - Expense', () => {
    it('should return org filter for admin', async () => {
      const adminUser: UserWithRole = mockTestData.adminUser;

      const filter = await getResourceAccessFilter(adminUser, ResourceType.EXPENSE);

      expect(filter).toEqual({ organizationId: 'org-123' });
    });

    it('should return user and org filter for regular user', async () => {
      const regularUser: UserWithRole = mockTestData.regularUser;

      const filter = await getResourceAccessFilter(regularUser, ResourceType.EXPENSE);

      expect(filter).toEqual({
        userId: 'user-regular-123',
        organizationId: 'org-123',
      });
    });

    it('should return customer filter for accountant', async () => {
      const accountantUser: UserWithRole = mockTestData.accountantUser;
      mockPrisma.accountantAssignment.findMany.mockResolvedValue([
        { customerId: 'customer-1' },
      ]);

      const filter = await getResourceAccessFilter(accountantUser, ResourceType.EXPENSE);

      expect(filter).toEqual({
        customerId: { in: ['customer-1'] },
        organizationId: 'org-123',
      });
    });
  });

  describe('getResourceAccessFilter - User', () => {
    it('should return org filter for admin', async () => {
      const adminUser: UserWithRole = mockTestData.adminUser;

      const filter = await getResourceAccessFilter(adminUser, ResourceType.USER);

      expect(filter).toEqual({ organizationId: 'org-123' });
    });

    it('should return impossible filter for non-admin', async () => {
      const regularUser: UserWithRole = mockTestData.regularUser;

      const filter = await getResourceAccessFilter(regularUser, ResourceType.USER);

      expect(filter).toEqual({ organizationId: 'org-123' });
    });
  });

  describe('Error handling', () => {
    it('should return false on database errors', async () => {
      const regularUser: UserWithRole = mockTestData.regularUser;
      mockPrisma.invoice.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await canAccessResource(regularUser, ResourceType.INVOICE, 'invoice-123');

      expect(result).toBe(false);
    });

    it('should return false for unknown resource type', async () => {
      const regularUser: UserWithRole = mockTestData.regularUser;

      const result = await canAccessResource(regularUser, 'unknown' as ResourceType, 'resource-123');

      expect(result).toBe(false);
    });
  });
});
