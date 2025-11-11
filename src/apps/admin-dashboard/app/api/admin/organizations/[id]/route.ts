import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth';
import { prisma, BillingPlan, OrgStatus } from '@invoice-app/database';
import { z } from 'zod';

// GET /api/admin/organizations/[id] - Get single organization
export const GET = withAdminAuth(async (req: NextRequest, user, context?: { params: Promise<{ id: string }> }) => {
  try {
    const params = context?.params ? await context.params : { id: '' };
    const organization = await prisma.organization.findUnique({
      where: { id: params.id },
      include: {
        settings: true,
        _count: {
          select: {
            users: true,
            invoices: true,
            customers: true,
            invitations: true,
            expenses: true,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
});

// PATCH /api/admin/organizations/[id] - Update organization
const updateOrgSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
  billingEmail: z.string().email().optional(),
  plan: z.nativeEnum(BillingPlan).optional(),
  status: z.nativeEnum(OrgStatus).optional(),
  maxUsers: z.number().min(1).max(10000).optional(),
  logo: z.string().url().optional().or(z.literal('')),
});

export const PATCH = withAdminAuth(async (req: NextRequest, user, context?: { params: Promise<{ id: string }> }) => {
  try {
    const params = context?.params ? await context.params : { id: '' };
    const body = await req.json();
    const data = updateOrgSchema.parse(body);

    // Check if organization exists
    const existing = await prisma.organization.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // If updating slug, check for conflicts
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.organization.findUnique({
        where: { slug: data.slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'Slug already exists', message: 'An organization with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Update organization
    const organization = await prisma.organization.update({
      where: { id: params.id },
      data,
      include: {
        settings: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error updating organization:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    );
  }
});

// DELETE /api/admin/organizations/[id] - Delete organization (soft delete by setting status to CANCELLED)
export const DELETE = withAdminAuth(async (req: NextRequest, user, context?: { params: Promise<{ id: string }> }) => {
  try {
    const params = context?.params ? await context.params : { id: '' };
    // Check if organization exists
    const existing = await prisma.organization.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting status to CANCELLED
    const organization = await prisma.organization.update({
      where: { id: params.id },
      data: { status: OrgStatus.CANCELLED },
    });

    return NextResponse.json({
      message: 'Organization deleted successfully',
      organization,
    });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json(
      { error: 'Failed to delete organization' },
      { status: 500 }
    );
  }
});
