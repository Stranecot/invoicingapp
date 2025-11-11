import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, getCurrentUserOrNull } from '@/lib/auth';

export async function GET() {
  try {
    // Get Clerk user
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({
        status: 'error',
        message: 'Not authenticated with Clerk',
      });
    }

    // Try to get database user
    const dbUser = await getCurrentUserOrNull();

    // Get counts
    const userCount = await prisma.user.count();
    const invoiceCount = await prisma.invoice.count();
    const expenseCount = await prisma.expense.count();
    const customerCount = await prisma.customer.count();

    // Get user's data counts if user exists
    let userInvoiceCount = 0;
    let userExpenseCount = 0;
    let userCustomerCount = 0;

    if (dbUser) {
      if (dbUser.role === 'ADMIN') {
        userInvoiceCount = invoiceCount;
        userExpenseCount = expenseCount;
        userCustomerCount = customerCount;
      } else {
        userInvoiceCount = await prisma.invoice.count({
          where: { userId: dbUser.id },
        });
        userExpenseCount = await prisma.expense.count({
          where: { userId: dbUser.id },
        });
        userCustomerCount = await prisma.customer.count({
          where: { userId: dbUser.id },
        });
      }
    }

    return NextResponse.json({
      status: 'success',
      clerk: {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
      },
      database: {
        userExists: !!dbUser,
        user: dbUser ? {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
        } : null,
      },
      counts: {
        totalUsers: userCount,
        totalInvoices: invoiceCount,
        totalExpenses: expenseCount,
        totalCustomers: customerCount,
        yourInvoices: userInvoiceCount,
        yourExpenses: userExpenseCount,
        yourCustomers: userCustomerCount,
      },
      recommendation: !dbUser
        ? 'User not found in database. Run POST /api/sync-user to sync your account.'
        : userInvoiceCount === 0 && userExpenseCount === 0
        ? 'User exists but has no data. Create invoices and expenses or link to seeded data.'
        : 'Everything looks good!',
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      error: String(error),
    });
  }
}
