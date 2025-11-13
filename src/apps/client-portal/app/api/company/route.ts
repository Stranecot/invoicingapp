import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@invoice-app/auth/server';

export async function GET() {
  try {
    const user = await getCurrentUser();

    // If user belongs to an organization, return organization data as company
    if (user.organizationId) {
      const organization = await prisma.organization.findUnique({
        where: { id: user.organizationId },
        include: {
          settings: true,
        },
      });

      if (!organization) {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        );
      }

      // Map organization data to company format for backward compatibility
      const company = {
        id: organization.id,
        name: organization.name,
        email: organization.billingEmail,
        phone: organization.phone,
        address: organization.address,
        country: organization.country,
        isVatRegistered: organization.isVatRegistered,
        vatId: organization.vatId,
        logo: organization.logo,
        taxRate: organization.settings?.taxRate || 0,
      };

      return NextResponse.json(company);
    }

    // Fallback: For users without organization, try to get their individual Company record
    const company = await prisma.company.findUnique({
      where: { userId: user.id },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company settings not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch company' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    // Only admins, owners, and users can update company settings
    // Accountants and employees have read-only access
    if (user.role === 'ACCOUNTANT' || user.role === 'EMPLOYEE') {
      return NextResponse.json(
        { error: 'Forbidden: You cannot modify company settings' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Remove protected fields from data
    delete data.id;

    // If user belongs to an organization, update organization data
    if (user.organizationId) {
      // Only ADMIN and OWNER can update organization settings
      if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
        return NextResponse.json(
          { error: 'Forbidden: Only admins and owners can modify organization settings' },
          { status: 403 }
        );
      }

      const organization = await prisma.organization.findUnique({
        where: { id: user.organizationId },
        include: { settings: true },
      });

      if (!organization) {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        );
      }

      // Update organization fields
      const updatedOrganization = await prisma.organization.update({
        where: { id: user.organizationId },
        data: {
          name: data.name,
          billingEmail: data.email,
          phone: data.phone,
          address: data.address,
          country: data.country,
          isVatRegistered: data.isVatRegistered,
          vatId: data.vatId,
          logo: data.logo,
        },
      });

      // Update or create organization settings for taxRate
      if (data.taxRate !== undefined) {
        if (organization.settings) {
          await prisma.organizationSettings.update({
            where: { id: organization.settings.id },
            data: { taxRate: data.taxRate },
          });
        } else {
          await prisma.organizationSettings.create({
            data: {
              organizationId: user.organizationId,
              taxRate: data.taxRate,
            },
          });
        }
      }

      // Fetch updated data to return
      const refreshedOrg = await prisma.organization.findUnique({
        where: { id: user.organizationId },
        include: { settings: true },
      });

      // Map back to company format
      const company = {
        id: refreshedOrg!.id,
        name: refreshedOrg!.name,
        email: refreshedOrg!.billingEmail,
        phone: refreshedOrg!.phone,
        address: refreshedOrg!.address,
        country: refreshedOrg!.country,
        isVatRegistered: refreshedOrg!.isVatRegistered,
        vatId: refreshedOrg!.vatId,
        logo: refreshedOrg!.logo,
        taxRate: refreshedOrg!.settings?.taxRate || 0,
      };

      return NextResponse.json(company);
    }

    // Fallback: For users without organization, update their individual Company record
    let company = await prisma.company.findUnique({
      where: { userId: user.id },
    });

    if (!company) {
      // Create company for user if doesn't exist
      const newCompany = await prisma.company.create({
        data: {
          ...data,
          userId: user.id,
        },
      });
      return NextResponse.json(newCompany);
    }

    const updatedCompany = await prisma.company.update({
      where: { id: company.id },
      data,
    });

    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update company' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
