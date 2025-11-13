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
  billingEmail: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  registrationNumber: z.string().optional(),
  isVatRegistered: z.boolean().optional(),
  vatId: z.string().optional(),
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
 * Requires: OWNER or ADMIN role
 * Returns: Organization with user count, invitation count, and active users
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user (allow OWNER and ADMIN)
    const { getCurrentUser } = await import('@invoice-app/auth/server');
    const user = await getCurrentUser();

    if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Forbidden: Only organization owners and admins can access this' },
        { status: 403 }
      );
    }

    // Get user's organization with all related data
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        organization: {
          include: {
            settings: true,
            subscriptionPlan: true,
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

    if (!userWithOrg?.organization) {
      return NextResponse.json(
        { error: 'User must belong to an organization' },
        { status: 400 }
      );
    }

    const organization = userWithOrg.organization;

    // Determine maxUsers with fallback logic:
    // 1. If subscriptionPlan exists, use its maxUsers
    // 2. If organization.maxUsers > 0, use that
    // 3. Otherwise, map legacy plan enum to maxUsers (FREE=5, PRO=25, ENTERPRISE=999)
    let effectiveMaxUsers = organization.subscriptionPlan?.maxUsers;

    if (!effectiveMaxUsers) {
      if (organization.maxUsers > 0) {
        effectiveMaxUsers = organization.maxUsers;
      } else {
        // Fallback based on legacy plan enum
        const planLimits = {
          FREE: 5,
          PRO: 25,
          ENTERPRISE: 999,
        };
        effectiveMaxUsers = planLimits[organization.plan] ?? 5;
      }
    }

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
      phone: organization.phone,
      address: organization.address,
      country: organization.country,
      registrationNumber: organization.registrationNumber,
      isVatRegistered: organization.isVatRegistered,
      vatId: organization.vatId,
      status: organization.status,
      plan: organization.plan,
      maxUsers: effectiveMaxUsers,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
      settings,
      stats: {
        totalUsers: organization._count.users,
        activeUsers: activeUsersCount,
        pendingInvitations: organization._count.invitations,
        usersByRole: roleBreakdown,
        usagePercentage: Math.round((organization._count.users / effectiveMaxUsers) * 100),
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
 * Requires: OWNER or ADMIN role
 * Body: { name?: string, slug?: string, phone?: string, address?: string, registrationNumber?: string, isVatRegistered?: boolean, vatId?: string, settings?: object }
 * Returns: Updated organization
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get current user (allow OWNER and ADMIN)
    const { getCurrentUser } = await import('@invoice-app/auth/server');
    const user = await getCurrentUser();

    if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Forbidden: Only organization owners and admins can update this' },
        { status: 403 }
      );
    }

    // Get user's organization
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      select: { organizationId: true },
    });

    if (!userWithOrg?.organizationId) {
      return NextResponse.json(
        { error: 'User must belong to an organization' },
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

    const { name, slug, billingEmail, phone, address, country, registrationNumber, isVatRegistered, vatId, settings } = validation.data;

    // Check if slug is unique (if provided and different from current)
    if (slug) {
      const currentOrg = await prisma.organization.findUnique({
        where: { id: userWithOrg.organizationId },
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
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (billingEmail !== undefined) updateData.billingEmail = billingEmail;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (country !== undefined) updateData.country = country;
    if (registrationNumber !== undefined) updateData.registrationNumber = registrationNumber;
    if (isVatRegistered !== undefined) updateData.isVatRegistered = isVatRegistered;
    if (vatId !== undefined) updateData.vatId = vatId;

    const updatedOrganization = await prisma.organization.update({
      where: { id: userWithOrg.organizationId },
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
          where: { organizationId: userWithOrg.organizationId },
          update: settingsUpdateData,
          create: {
            organizationId: userWithOrg.organizationId,
            ...settingsUpdateData,
          },
        });
      }
    }

    // Fetch updated organization with settings
    const finalOrganization = await prisma.organization.findUnique({
      where: { id: userWithOrg.organizationId },
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
