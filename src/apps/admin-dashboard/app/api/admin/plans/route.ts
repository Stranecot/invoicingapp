import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth';
import { prisma } from '@invoice-app/database';
import { z } from 'zod';

// GET /api/admin/plans - List all plans with pagination and filtering
export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');
    const sortBy = searchParams.get('sortBy') || 'sortOrder';
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    // Get total count
    const total = await prisma.subscriptionPlan.count({ where });

    // Get paginated results
    const plans = await prisma.subscriptionPlan.findMany({
      where,
      include: {
        _count: {
          select: {
            organizations: true,
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
      plans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
});

// POST /api/admin/plans - Create new plan
const createPlanSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  price: z.number().min(0),
  currency: z.string().min(3).max(3).default('USD'),
  maxUsers: z.number().min(1).max(1000000),
  maxInvoices: z.number().min(-1),
  maxCustomers: z.number().min(-1),
  maxExpenses: z.number().min(-1),
  features: z.array(z.string()),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const data = createPlanSchema.parse(body);

    // Check if slug already exists
    const existing = await prisma.subscriptionPlan.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Slug already exists', message: 'A plan with this slug already exists' },
        { status: 400 }
      );
    }

    // Create plan
    const plan = await prisma.subscriptionPlan.create({
      data,
      include: {
        _count: {
          select: {
            organizations: true,
          },
        },
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('Error creating plan:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create plan' },
      { status: 500 }
    );
  }
});
