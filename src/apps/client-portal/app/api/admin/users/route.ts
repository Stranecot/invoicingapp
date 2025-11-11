import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@invoice-app/auth/server';

export async function GET() {
  try {
    await requireAdmin();

    const users = await prisma.user.findMany({
      include: {
        company: true,
        customers: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            invoices: true,
            expenses: true,
            customers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch users' },
      { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 }
    );
  }
}
