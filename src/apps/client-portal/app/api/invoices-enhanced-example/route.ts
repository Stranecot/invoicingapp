/**
 * EXAMPLE: Enhanced RBAC Implementation for Invoice Routes
 *
 * This file demonstrates the new enhanced RBAC pattern using the
 * @invoice-app/auth package's advanced features.
 *
 * Copy this pattern when updating existing routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  requireAuth,
  requirePermission,
  canPerformAction,
  getResourceAccessFilter,
  ResourceType,
  Action,
  Permission,
  UnauthorizedError,
  ForbiddenError,
  logAction,
  logResourceAccess,
  successResponse,
  errorResponse,
} from '@invoice-app/auth';

/**
 * GET /api/invoices
 *
 * List all invoices accessible to the current user
 * - ADMIN: All invoices in their organization
 * - USER: Only their own invoices in their organization
 * - ACCOUNTANT: Invoices for assigned customers in their organization
 */
export async function GET() {
  try {
    // Step 1: Authenticate user
    const user = await requireAuth();

    // Step 2: Get organization-scoped access filter
    // This automatically handles ADMIN/USER/ACCOUNTANT logic
    const accessFilter = await getResourceAccessFilter(user, ResourceType.INVOICE);

    // Step 3: Query with filter
    const invoices = await prisma.invoice.findMany({
      where: accessFilter,
      include: {
        customer: true,
        items: true,
        // Only include user info for roles that can see it
        user: user.role === 'ADMIN' || user.role === 'ACCOUNTANT' ? {
          select: {
            name: true,
            email: true,
          },
        } : false,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Step 4: Return success response
    return successResponse(invoices);

  } catch (error) {
    console.error('Error fetching invoices:', error);

    // Step 5: Handle errors with proper status codes
    if (error instanceof UnauthorizedError) {
      return errorResponse(error.message, 401);
    }

    if (error instanceof ForbiddenError) {
      return errorResponse(error.message, 403);
    }

    return errorResponse('Failed to fetch invoices', 500);
  }
}

/**
 * POST /api/invoices
 *
 * Create a new invoice
 * - Requires INVOICE_CREATE permission
 * - Must belong to user's organization
 * - User role can only create for own customers
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Require specific permission
    const user = await requirePermission(Permission.INVOICE_CREATE);

    // Step 2: Parse and validate request
    const { items, ...invoiceData } = await request.json();

    if (!items || items.length === 0) {
      return errorResponse('Invoice must have at least one item', 400);
    }

    if (!invoiceData.customerId) {
      return errorResponse('Customer ID is required', 400);
    }

    // Step 3: Verify customer exists and belongs to user's organization
    const customer = await prisma.customer.findUnique({
      where: { id: invoiceData.customerId },
      select: {
        id: true,
        userId: true,
        organizationId: true,
      },
    });

    if (!customer) {
      return errorResponse('Customer not found', 404);
    }

    // Step 4: Organization membership check
    if (user.organizationId && customer.organizationId !== user.organizationId) {
      await logResourceAccess(
        user,
        ResourceType.CUSTOMER,
        customer.id,
        false,
        'Attempted to create invoice for customer in different organization'
      );

      return errorResponse('Customer does not belong to your organization', 403);
    }

    // Step 5: Role-specific checks
    if (user.role === 'USER' && customer.userId !== user.id) {
      await logResourceAccess(
        user,
        ResourceType.CUSTOMER,
        customer.id,
        false,
        'USER attempted to create invoice for another user\'s customer'
      );

      return errorResponse('You can only create invoices for your own customers', 403);
    }

    // Step 6: Create invoice with organization context
    const invoice = await prisma.invoice.create({
      data: {
        ...invoiceData,
        userId: user.id,
        organizationId: user.organizationId,
        items: {
          create: items,
        },
      },
      include: {
        customer: true,
        items: true,
      },
    });

    // Step 7: Log the action for audit trail
    await logAction(
      user,
      Action.CREATE,
      ResourceType.INVOICE,
      invoice.id,
      true,
      'Invoice created successfully',
      {
        customerId: customer.id,
        itemCount: items.length,
        total: invoice.total,
      }
    );

    // Step 8: Return created resource
    return successResponse(invoice, 201);

  } catch (error) {
    console.error('Error creating invoice:', error);

    if (error instanceof UnauthorizedError) {
      return errorResponse(error.message, 401);
    }

    if (error instanceof ForbiddenError) {
      // Log permission denial
      return errorResponse(error.message, 403);
    }

    return errorResponse(
      error instanceof Error ? error.message : 'Failed to create invoice',
      500
    );
  }
}

/**
 * Alternative implementation using action-based checks
 * This is more dynamic and flexible
 */
export async function POST_ALTERNATIVE(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Check if user can perform CREATE action on INVOICE resource
    if (!canPerformAction(user, Action.CREATE, ResourceType.INVOICE)) {
      return errorResponse('You do not have permission to create invoices', 403);
    }

    const { items, ...invoiceData } = await request.json();

    // Verify customer access
    const customer = await prisma.customer.findUnique({
      where: { id: invoiceData.customerId },
      select: { id: true, userId: true, organizationId: true },
    });

    if (!customer) {
      return errorResponse('Customer not found', 404);
    }

    // Organization check
    if (user.organizationId !== customer.organizationId) {
      return errorResponse('Access denied', 403);
    }

    // User-specific ownership check
    if (user.role === 'USER' && customer.userId !== user.id) {
      return errorResponse('Access denied', 403);
    }

    const invoice = await prisma.invoice.create({
      data: {
        ...invoiceData,
        userId: user.id,
        organizationId: user.organizationId,
        items: { create: items },
      },
      include: { customer: true, items: true },
    });

    await logAction(user, Action.CREATE, ResourceType.INVOICE, invoice.id, true);

    return successResponse(invoice, 201);

  } catch (error) {
    return errorResponse('Failed to create invoice', 500);
  }
}
