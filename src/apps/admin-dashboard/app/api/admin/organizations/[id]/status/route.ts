import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth';
import { prisma, OrgStatus } from '@invoice-app/database';
import { z } from 'zod';

// PATCH /api/admin/organizations/[id]/status - Change organization status
const statusSchema = z.object({
  status: z.nativeEnum(OrgStatus),
});

export const PATCH = withAdminAuth(async (req: NextRequest, user, context?: { params: Promise<{ id: string }> }) => {
  try {
    const params = context?.params ? await context.params : { id: '' };
    const body = await req.json();
    const { status } = statusSchema.parse(body);

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

    // Update status
    const organization = await prisma.organization.update({
      where: { id: params.id },
      data: { status },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    return NextResponse.json({
      message: `Organization status changed to ${status}`,
      organization,
    });
  } catch (error) {
    console.error('Error updating organization status:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update organization status' },
      { status: 500 }
    );
  }
});
