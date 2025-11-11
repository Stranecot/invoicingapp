/**
 * Unit tests for admin invitations API routes
 * Tests invitation creation, listing, and management endpoints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createMockPrismaClient, mockTestData, resetPrismaMocks } from '../../../../../../../../../test/mocks/prisma';
import { mockAuth, setupClerkMocks, resetClerkMocks } from '../../../../../../../../../test/mocks/clerk';

// Mock Clerk
vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
}));

// Mock database
const mockPrisma = createMockPrismaClient();
vi.mock('@invoice-app/database', () => ({
  prisma: mockPrisma,
  Role: { ADMIN: 'ADMIN', USER: 'USER', ACCOUNTANT: 'ACCOUNTANT' },
  InvitationStatus: {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    EXPIRED: 'EXPIRED',
    REVOKED: 'REVOKED',
  },
  generateInvitationToken: vi.fn(() => 'test-token-123'),
  generateInvitationExpiry: vi.fn(() => new Date('2024-12-31')),
}));

// Import the route handlers
import { GET, POST } from './route';

describe('Admin Invitations API', () => {
  beforeEach(() => {
    resetPrismaMocks(mockPrisma);
    resetClerkMocks();
    setupClerkMocks({ userId: 'clerk-admin-123' });
  });

  describe('GET /api/admin/invitations', () => {
    it('should list all invitations for admin', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);
      mockPrisma.invitation.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.invitation.findMany.mockResolvedValue([mockTestData.invitation]);
      mockPrisma.invitation.count.mockResolvedValue(1);
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);

      const request = new NextRequest('http://localhost:3000/api/admin/invitations');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toBeDefined();
      expect(data.data).toHaveLength(1);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.total).toBe(1);
    });

    it('should filter invitations by status', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);
      mockPrisma.invitation.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.invitation.findMany.mockResolvedValue([]);
      mockPrisma.invitation.count.mockResolvedValue(0);

      const url = new URL('http://localhost:3000/api/admin/invitations?status=PENDING');
      const request = new NextRequest(url);
      const response = await GET(request);

      expect(mockPrisma.invitation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PENDING',
          }),
        })
      );
    });

    it('should filter invitations by email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);
      mockPrisma.invitation.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.invitation.findMany.mockResolvedValue([]);
      mockPrisma.invitation.count.mockResolvedValue(0);

      const url = new URL('http://localhost:3000/api/admin/invitations?email=test@example.com');
      const request = new NextRequest(url);
      const response = await GET(request);

      expect(mockPrisma.invitation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            email: {
              contains: 'test@example.com',
              mode: 'insensitive',
            },
          }),
        })
      );
    });

    it('should filter invitations by organizationId', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);
      mockPrisma.invitation.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.invitation.findMany.mockResolvedValue([]);
      mockPrisma.invitation.count.mockResolvedValue(0);

      const url = new URL('http://localhost:3000/api/admin/invitations?organizationId=org-123');
      const request = new NextRequest(url);
      const response = await GET(request);

      expect(mockPrisma.invitation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-123',
          }),
        })
      );
    });

    it('should support pagination with limit and offset', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);
      mockPrisma.invitation.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.invitation.findMany.mockResolvedValue([]);
      mockPrisma.invitation.count.mockResolvedValue(100);

      const url = new URL('http://localhost:3000/api/admin/invitations?limit=10&offset=20');
      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(mockPrisma.invitation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
      expect(data.pagination.hasMore).toBe(true);
    });

    it('should cap limit at 100', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);
      mockPrisma.invitation.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.invitation.findMany.mockResolvedValue([]);
      mockPrisma.invitation.count.mockResolvedValue(0);

      const url = new URL('http://localhost:3000/api/admin/invitations?limit=1000');
      const request = new NextRequest(url);
      const response = await GET(request);

      expect(mockPrisma.invitation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100, // Should be capped
        })
      );
    });

    it('should update expired invitations before listing', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);
      mockPrisma.invitation.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.invitation.findMany.mockResolvedValue([]);
      mockPrisma.invitation.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/admin/invitations');
      await GET(request);

      expect(mockPrisma.invitation.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'PENDING',
            expiresAt: expect.objectContaining({
              lt: expect.any(Date),
            }),
          },
          data: {
            status: 'EXPIRED',
          },
        })
      );
    });

    it('should exclude sensitive token from response', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);
      mockPrisma.invitation.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.invitation.findMany.mockResolvedValue([
        { ...mockTestData.invitation, token: 'secret-token' },
      ]);
      mockPrisma.invitation.count.mockResolvedValue(1);
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);

      const request = new NextRequest('http://localhost:3000/api/admin/invitations');
      const response = await GET(request);
      const data = await response.json();

      expect(data.data[0].token).toBeUndefined();
    });

    it('should return 401 when not authenticated', async () => {
      setupClerkMocks({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/admin/invitations');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return 403 when not admin', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.regularUser);

      const request = new NextRequest('http://localhost:3000/api/admin/invitations');
      const response = await GET(request);

      expect(response.status).toBe(403);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);
      mockPrisma.invitation.updateMany.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/admin/invitations');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/admin/invitations', () => {
    const validInvitationData = {
      email: 'newuser@example.com',
      role: 'USER',
      organizationId: 'org-123',
    };

    it('should create invitation successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);
      mockPrisma.organization.findUnique.mockResolvedValue(mockTestData.organization);
      mockPrisma.user.findFirst
        .mockResolvedValueOnce(null) // No existing user
        .mockResolvedValueOnce(mockTestData.adminUser); // Admin user for invitedBy
      mockPrisma.invitation.findFirst.mockResolvedValue(null); // No pending invitation
      mockPrisma.user.count.mockResolvedValue(5); // Under max users
      mockPrisma.invitation.create.mockResolvedValue({
        ...mockTestData.invitation,
        organization: mockTestData.organization,
      });

      const request = new NextRequest('http://localhost:3000/api/admin/invitations', {
        method: 'POST',
        body: JSON.stringify(validInvitationData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.email).toBe(validInvitationData.email);
      expect(data.token).toBeUndefined(); // Token should be excluded
    });

    it('should reject invalid email format', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);

      const request = new NextRequest('http://localhost:3000/api/admin/invitations', {
        method: 'POST',
        body: JSON.stringify({
          ...validInvitationData,
          email: 'invalid-email',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject invalid role', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);

      const request = new NextRequest('http://localhost:3000/api/admin/invitations', {
        method: 'POST',
        body: JSON.stringify({
          ...validInvitationData,
          role: 'INVALID_ROLE',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject invalid organizationId format', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);

      const request = new NextRequest('http://localhost:3000/api/admin/invitations', {
        method: 'POST',
        body: JSON.stringify({
          ...validInvitationData,
          organizationId: 'not-a-uuid',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 404 when organization not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);
      mockPrisma.organization.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/invitations', {
        method: 'POST',
        body: JSON.stringify(validInvitationData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Organization not found');
    });

    it('should return 409 when user already exists in organization', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);
      mockPrisma.organization.findUnique.mockResolvedValue(mockTestData.organization);
      mockPrisma.user.findFirst.mockResolvedValue({
        ...mockTestData.regularUser,
        email: validInvitationData.email,
      });

      const request = new NextRequest('http://localhost:3000/api/admin/invitations', {
        method: 'POST',
        body: JSON.stringify(validInvitationData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('already exists');
    });

    it('should return 409 when pending invitation already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);
      mockPrisma.organization.findUnique.mockResolvedValue(mockTestData.organization);
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.invitation.findFirst.mockResolvedValue(mockTestData.invitation);

      const request = new NextRequest('http://localhost:3000/api/admin/invitations', {
        method: 'POST',
        body: JSON.stringify(validInvitationData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('pending invitation already exists');
    });

    it('should return 403 when organization at max user limit', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);
      mockPrisma.organization.findUnique.mockResolvedValue({
        ...mockTestData.organization,
        maxUsers: 10,
      });
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.invitation.findFirst.mockResolvedValue(null);
      mockPrisma.user.count.mockResolvedValue(10); // At max

      const request = new NextRequest('http://localhost:3000/api/admin/invitations', {
        method: 'POST',
        body: JSON.stringify(validInvitationData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('maximum user limit');
    });

    it('should accept optional customerIds for accountant invitations', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);
      mockPrisma.organization.findUnique.mockResolvedValue(mockTestData.organization);
      mockPrisma.user.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockTestData.adminUser);
      mockPrisma.invitation.findFirst.mockResolvedValue(null);
      mockPrisma.user.count.mockResolvedValue(5);
      mockPrisma.invitation.create.mockResolvedValue({
        ...mockTestData.invitation,
        customerIds: ['customer-1', 'customer-2'],
        organization: mockTestData.organization,
      });

      const request = new NextRequest('http://localhost:3000/api/admin/invitations', {
        method: 'POST',
        body: JSON.stringify({
          ...validInvitationData,
          role: 'ACCOUNTANT',
          customerIds: ['customer-1', 'customer-2'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(mockPrisma.invitation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerIds: ['customer-1', 'customer-2'],
          }),
        })
      );
    });

    it('should return 401 when not authenticated', async () => {
      setupClerkMocks({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/admin/invitations', {
        method: 'POST',
        body: JSON.stringify(validInvitationData),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should return 403 when not admin', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.regularUser);

      const request = new NextRequest('http://localhost:3000/api/admin/invitations', {
        method: 'POST',
        body: JSON.stringify(validInvitationData),
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);
      mockPrisma.organization.findUnique.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/admin/invitations', {
        method: 'POST',
        body: JSON.stringify(validInvitationData),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });
});
