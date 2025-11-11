import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth';
import { prisma } from '@invoice-app/database';
import { z } from 'zod';

// PATCH /api/admin/organizations/[id]/settings - Update organization settings
const settingsSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  companyName: z.string().min(1).max(100).optional().or(z.literal('')),
  invoicePrefix: z.string().min(1).max(10).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  currency: z.string().length(3).optional(),
});

export const PATCH = withAdminAuth(async (req: NextRequest, user, context?: { params: Promise<{ id: string }> }) => {
  try {
    const params = context?.params ? await context.params : { id: '' };
    const body = await req.json();
    const data = settingsSchema.parse(body);

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: params.id },
      include: { settings: true },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Update or create settings
    const settings = await prisma.organizationSettings.upsert({
      where: { organizationId: params.id },
      update: data,
      create: {
        organizationId: params.id,
        primaryColor: data.primaryColor || '#3B82F6',
        invoicePrefix: data.invoicePrefix || 'INV',
        taxRate: data.taxRate || 0,
        currency: data.currency || 'USD',
        logoUrl: data.logoUrl || null,
        companyName: data.companyName || null,
      },
    });

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('Error updating organization settings:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update organization settings' },
      { status: 500 }
    );
  }
});
