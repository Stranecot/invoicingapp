import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, canAccessCustomer } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      );
    }

    // Verify access to the entity
    if (entityType === 'INVOICE') {
      const invoice = await prisma.invoice.findUnique({
        where: { id: entityId },
        select: { userId: true, customerId: true },
      });

      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      const hasAccess = user.role === 'ADMIN' ||
                        (user.role === 'USER' && invoice.userId === user.id) ||
                        (user.role === 'ACCOUNTANT' && await canAccessCustomer(invoice.customerId));

      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (entityType === 'EXPENSE') {
      const expense = await prisma.expense.findUnique({
        where: { id: entityId },
        select: { userId: true, customerId: true },
      });

      if (!expense) {
        return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
      }

      const hasAccess = user.role === 'ADMIN' ||
                        (user.role === 'USER' && expense.userId === user.id) ||
                        (user.role === 'ACCOUNTANT' && expense.customerId && await canAccessCustomer(expense.customerId));

      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const notes = await prisma.note.findMany({
      where: {
        entityType: entityType as any,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch notes' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { entityType, entityId, content } = await request.json();

    if (!entityType || !entityId || !content) {
      return NextResponse.json(
        { error: 'entityType, entityId, and content are required' },
        { status: 400 }
      );
    }

    // Verify access to the entity
    if (entityType === 'INVOICE') {
      const invoice = await prisma.invoice.findUnique({
        where: { id: entityId },
        select: { userId: true, customerId: true },
      });

      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      const hasAccess = user.role === 'ADMIN' ||
                        (user.role === 'USER' && invoice.userId === user.id) ||
                        (user.role === 'ACCOUNTANT' && await canAccessCustomer(invoice.customerId));

      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (entityType === 'EXPENSE') {
      const expense = await prisma.expense.findUnique({
        where: { id: entityId },
        select: { userId: true, customerId: true },
      });

      if (!expense) {
        return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
      }

      const hasAccess = user.role === 'ADMIN' ||
                        (user.role === 'USER' && expense.userId === user.id) ||
                        (user.role === 'ACCOUNTANT' && expense.customerId && await canAccessCustomer(expense.customerId));

      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const note = await prisma.note.create({
      data: {
        userId: user.id,
        entityType: entityType as any,
        entityId,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create note' },
      { status: 500 }
    );
  }
}
