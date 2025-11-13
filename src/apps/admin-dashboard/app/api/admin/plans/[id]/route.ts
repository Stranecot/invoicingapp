import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth';
import { prisma } from '@invoice-app/database';
import { z } from 'zod';

// GET /api/admin/plans/[id] - Get single plan
export const GET = withAdminAuth(async (req: NextRequest, user, context?: { params: Promise<{ id: string }> }) => {
  try {
    const params = context?.params ? await context.params : { id: '' };
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            organizations: true,
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error fetching plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plan' },
      { status: 500 }
    );
  }
});

// PATCH /api/admin/plans/[id] - Update plan
const updatePlanSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  currency: z.string().min(3).max(3).optional(),
  maxUsers: z.number().min(1).max(1000000).optional(),
  maxInvoices: z.number().min(-1).optional(),
  maxCustomers: z.number().min(-1).optional(),
  maxExpenses: z.number().min(-1).optional(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export const PATCH = withAdminAuth(async (req: NextRequest, user, context?: { params: Promise<{ id: string }> }) => {
  try {
    const params = context?.params ? await context.params : { id: '' };
    const body = await req.json();
    const data = updatePlanSchema.parse(body);

    // Check if plan exists
    const existing = await prisma.subscriptionPlan.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // If updating slug, check for conflicts
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.subscriptionPlan.findUnique({
        where: { slug: data.slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'Slug already exists', message: 'A plan with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Update plan
    const plan = await prisma.subscriptionPlan.update({
      where: { id: params.id },
      data,
      include: {
        _count: {
          select: {
            organizations: true,
          },
        },
      },
    });

    // If maxUsers changed, update all organizations using this plan
    if (data.maxUsers !== undefined) {
      await prisma.organization.updateMany({
        where: { planId: params.id },
        data: { maxUsers: data.maxUsers },
      });
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error updating plan:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update plan' },
      { status: 500 }
    );
  }
});

// DELETE /api/admin/plans/[id] - Delete plan
export const DELETE = withAdminAuth(async (req: NextRequest, user, context?: { params: Promise<{ id: string }> }) => {
  try {
    const params = context?.params ? await context.params : { id: '' };

    // Check if plan exists
    const existing = await prisma.subscriptionPlan.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { organizations: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if organizations are using this plan
    if (existing._count.organizations > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete plan',
          message: `This plan is currently used by ${existing._count.organizations} organization(s). Please migrate them to another plan first.`
        },
        { status: 400 }
      );
    }

    // Delete plan
    await prisma.subscriptionPlan.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'Plan deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete plan' },
      { status: 500 }
    );
  }
});
