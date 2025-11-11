/**
 * Prisma client mock for testing
 * Provides a mock implementation of the Prisma client with common operations
 */

import { vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';

/**
 * Create a mock Prisma client
 * Each model gets standard CRUD operations that can be spied on and mocked
 */
export function createMockPrismaClient(): PrismaClient {
  const mockClient: any = {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    invoice: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    expense: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    invitation: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
    accountantAssignment: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    company: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    note: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $transaction: vi.fn(),
  };

  return mockClient as PrismaClient;
}

/**
 * Reset all mocks on a Prisma client
 */
export function resetPrismaMocks(mockClient: any) {
  Object.keys(mockClient).forEach((key) => {
    if (typeof mockClient[key] === 'object' && mockClient[key] !== null) {
      Object.keys(mockClient[key]).forEach((method) => {
        if (typeof mockClient[key][method]?.mockClear === 'function') {
          mockClient[key][method].mockClear();
        }
      });
    }
  });
}

/**
 * Sample test data
 */
export const mockTestData = {
  adminUser: {
    id: 'user-admin-123',
    clerkId: 'clerk-admin-123',
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'ADMIN' as const,
    organizationId: 'org-123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  regularUser: {
    id: 'user-regular-123',
    clerkId: 'clerk-regular-123',
    email: 'user@test.com',
    name: 'Regular User',
    role: 'USER' as const,
    organizationId: 'org-123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  accountantUser: {
    id: 'user-accountant-123',
    clerkId: 'clerk-accountant-123',
    email: 'accountant@test.com',
    name: 'Accountant User',
    role: 'ACCOUNTANT' as const,
    organizationId: 'org-123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  organization: {
    id: 'org-123',
    name: 'Test Organization',
    slug: 'test-org',
    logo: null,
    status: 'ACTIVE' as const,
    plan: 'PROFESSIONAL' as const,
    maxUsers: 10,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  customer: {
    id: 'customer-123',
    name: 'Test Customer',
    email: 'customer@test.com',
    phone: null,
    address: null,
    userId: 'user-regular-123',
    organizationId: 'org-123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  invoice: {
    id: 'invoice-123',
    invoiceNumber: 'INV-001',
    status: 'DRAFT' as const,
    userId: 'user-regular-123',
    customerId: 'customer-123',
    organizationId: 'org-123',
    issuedAt: new Date('2024-01-01'),
    dueDate: new Date('2024-02-01'),
    subtotal: 1000,
    tax: 100,
    total: 1100,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  invitation: {
    id: 'invitation-123',
    email: 'invited@test.com',
    role: 'USER' as const,
    token: 'test-token-123',
    organizationId: 'org-123',
    invitedBy: 'user-admin-123',
    status: 'PENDING' as const,
    expiresAt: new Date('2024-12-31'),
    invitedAt: new Date('2024-01-01'),
    customerIds: [],
  },
};
