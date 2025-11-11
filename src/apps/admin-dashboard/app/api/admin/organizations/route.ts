import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth';
import { prisma, BillingPlan, OrgStatus } from '@invoice-app/database';
import { z } from 'zod';

// GET /api/admin/organizations - List organizations with filters, search, and pagination
export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') as OrgStatus | null;
    const plan = searchParams.get('plan') as BillingPlan | null;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { billingEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (plan) {
      where.plan = plan;
    }

    // Get total count
    const total = await prisma.organization.count({ where });

    // Get paginated results
    const organizations = await prisma.organization.findMany({
      where,
      include: {
        _count: {
          select: {
            users: true,
            invoices: true,
            customers: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      organizations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
});

// POST /api/admin/organizations - Create new organization
const createOrgSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  billingEmail: z.string().email(),
  plan: z.nativeEnum(BillingPlan),
  status: z.nativeEnum(OrgStatus),
  maxUsers: z.number().min(1).max(10000),
});

export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const data = createOrgSchema.parse(body);

    // Check if slug already exists
    const existing = await prisma.organization.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Slug already exists', message: 'An organization with this slug already exists' },
        { status: 400 }
      );
    }

    // Create organization and default settings
    const organization = await prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        billingEmail: data.billingEmail,
        plan: data.plan,
        status: data.status,
        maxUsers: data.maxUsers,
        settings: {
          create: {
            primaryColor: '#3B82F6',
            invoicePrefix: 'INV',
            taxRate: 0,
            currency: 'USD',
            allowSignup: true,
            requireApproval: false,
          },
        },
      },
      include: {
        settings: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error('Error creating organization:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
});
