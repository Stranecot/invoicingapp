import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@invoice-app/auth/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { role } = await request.json();

    if (!['ADMIN', 'USER', 'ACCOUNTANT'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be ADMIN, USER, or ACCOUNTANT' },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      include: {
        company: true,
        _count: {
          select: {
            invoices: true,
            expenses: true,
            customers: true,
          },
        },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update user role' },
      { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 }
    );
  }
}
