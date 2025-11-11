import { NextRequest, NextResponse } from 'next/server';
import { prisma, OrgStatus, BillingPlan } from '@invoice-app/database';
import { requireAdmin } from '@invoice-app/auth/server';
import { z } from 'zod';

/**
 * Validation schema for updating organization
 */
const updateOrganizationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters').optional(),
  slug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .refine((slug) => !slug.startsWith('-') && !slug.endsWith('-'), {
      message: 'Slug cannot start or end with a hyphen',
    })
    .optional(),
  settings: z.object({
    allowUserInvitations: z.boolean().optional(),
    defaultUserRole: z.enum(['USER', 'ACCOUNTANT']).optional(),
    emailNotifications: z.object({
      newUser: z.boolean().optional(),
      invoiceCreated: z.boolean().optional(),
      paymentReceived: z.boolean().optional(),
    }).optional(),
    customBranding: z.object({
      primaryColor: z.string().optional(),
      logoUrl: z.string().url().optional().or(z.literal('')),
    }).optional(),
  }).optional(),
});

/**
 * GET /api/organizations/current
 * Gets the current user's organization with stats
 * Requires: ADMIN role
 * Returns: Organization with user count, invitation count, and active users
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin access
    const admin = await requireAdmin();

    // Get admin's organization with all related data
    const adminUser = await prisma.user.findUnique({
      where: { id: admin.id },
      include: {
        organization: {
          include: {
            settings: true,
            _count: {
              select: {
                users: true,
                invitations: {
                  where: { status: 'PENDING' }
                },
              },
            },
          },
        },
      },
    });

    if (!adminUser?.organization) {
      return NextResponse.json(
        { error: 'Admin must belong to an organization' },
        { status: 400 }
      );
    }

    const organization = adminUser.organization;

    // Get active users count
    const activeUsersCount = await prisma.user.count({
      where: {
        organizationId: organization.id,
        isActive: true,
      },
    });

    // Get users by role breakdown
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      where: {
        organizationId: organization.id,
      },
      _count: true,
    });

    const roleBreakdown = {
      ADMIN: usersByRole.find(r => r.role === 'ADMIN')?._count || 0,
      USER: usersByRole.find(r => r.role === 'USER')?._count || 0,
      ACCOUNTANT: usersByRole.find(r => r.role === 'ACCOUNTANT')?._count || 0,
    };

    // Construct settings object with defaults if not exists
    const settings = organization.settings ? {
      allowUserInvitations: true,
      defaultUserRole: 'USER' as const,
      emailNotifications: {
        newUser: true,
        invoiceCreated: true,
        paymentReceived: true,
      },
      customBranding: {
        primaryColor: organization.settings.primaryColor || '#3B82F6',
        logoUrl: organization.settings.logoUrl || '',
      },
    } : {
      allowUserInvitations: true,
      defaultUserRole: 'USER' as const,
      emailNotifications: {
        newUser: true,
        invoiceCreated: true,
        paymentReceived: true,
      },
      customBranding: {
        primaryColor: '#3B82F6',
        logoUrl: '',
      },
    };

    // Return organization with computed stats
    return NextResponse.json({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
      billingEmail: organization.billingEmail,
      status: organization.status,
      plan: organization.plan,
      maxUsers: organization.maxUsers,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
      settings,
      stats: {
        totalUsers: organization._count.users,
        activeUsers: activeUsersCount,
        pendingInvitations: organization._count.invitations,
        usersByRole: roleBreakdown,
        usagePercentage: Math.round((organization._count.users / organization.maxUsers) * 100),
      },
    });
  } catch (error) {
    console.error('Error fetching organization:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch organization' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

/**
 * PATCH /api/organizations/current
 * Updates the current user's organization
 * Requires: ADMIN role
 * Body: { name?: string, slug?: string, settings?: object }
 * Returns: Updated organization
 */
export async function PATCH(request: NextRequest) {
  try {
    // Require admin access
    const admin = await requireAdmin();

    // Get admin's organization
    const adminUser = await prisma.user.findUnique({
      where: { id: admin.id },
      select: { organizationId: true },
    });

    if (!adminUser?.organizationId) {
      return NextResponse.json(
        { error: 'Admin must belong to an organization' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateOrganizationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { name, slug, settings } = validation.data;

    // Check if slug is unique (if provided and different from current)
    if (slug) {
      const currentOrg = await prisma.organization.findUnique({
        where: { id: adminUser.organizationId },
        select: { slug: true },
      });

      if (currentOrg && currentOrg.slug !== slug) {
        const existingOrg = await prisma.organization.findUnique({
          where: { slug },
        });

        if (existingOrg) {
          return NextResponse.json(
            { error: 'Organization slug already exists', field: 'slug' },
            { status: 409 }
          );
        }
      }
    }

    // Update organization
    const updateData: any = {};
    if (name) updateData.name = name;
    if (slug) updateData.slug = slug;

    const updatedOrganization = await prisma.organization.update({
      where: { id: adminUser.organizationId },
      data: updateData,
      include: {
        settings: true,
      },
    });

    // Update settings if provided
    if (settings) {
      const settingsUpdateData: any = {};

      if (settings.customBranding?.primaryColor) {
        settingsUpdateData.primaryColor = settings.customBranding.primaryColor;
      }

      if (settings.customBranding?.logoUrl !== undefined) {
        settingsUpdateData.logoUrl = settings.customBranding.logoUrl || null;
      }

      // Update or create settings
      if (Object.keys(settingsUpdateData).length > 0) {
        await prisma.organizationSettings.upsert({
          where: { organizationId: adminUser.organizationId },
          update: settingsUpdateData,
          create: {
            organizationId: adminUser.organizationId,
            ...settingsUpdateData,
          },
        });
      }
    }

    // Fetch updated organization with settings
    const finalOrganization = await prisma.organization.findUnique({
      where: { id: adminUser.organizationId },
      include: {
        settings: true,
      },
    });

    return NextResponse.json(finalOrganization);
  } catch (error) {
    console.error('Error updating organization:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update organization' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
