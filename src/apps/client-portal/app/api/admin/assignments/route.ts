import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@invoice-app/auth/server';

export async function GET() {
  try {
    await requireAdmin();

    const assignments = await prisma.accountantAssignment.findMany({
      include: {
        accountant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        customer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch assignments' },
      { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { accountantId, customerId } = await request.json();

    if (!accountantId || !customerId) {
      return NextResponse.json(
        { error: 'accountantId and customerId are required' },
        { status: 400 }
      );
    }

    // Verify accountant exists and has ACCOUNTANT role
    const accountant = await prisma.user.findUnique({
      where: { id: accountantId },
    });

    if (!accountant || accountant.role !== 'ACCOUNTANT') {
      return NextResponse.json(
        { error: 'Invalid accountant ID or user is not an accountant' },
        { status: 400 }
      );
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check if assignment already exists
    const existing = await prisma.accountantAssignment.findUnique({
      where: {
        accountantId_customerId: {
          accountantId,
          customerId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Assignment already exists' },
        { status: 400 }
      );
    }

    const assignment = await prisma.accountantAssignment.create({
      data: {
        accountantId,
        customerId,
      },
      include: {
        accountant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        customer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create assignment' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('id');

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    await prisma.accountantAssignment.delete({
      where: { id: assignmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}
