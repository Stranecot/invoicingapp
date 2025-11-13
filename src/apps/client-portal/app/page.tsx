import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FileText, DollarSign, Receipt, TrendingDown, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth } from 'date-fns';
import { formatDate, formatCurrency } from '@/lib/eu-format';
import { getCurrentUserOrNull } from '@invoice-app/auth/server';

async function getDashboardData(organizationId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { organizationId },
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const totalInvoices = await prisma.invoice.count({
    where: { organizationId },
  });

  // Optimized: Use aggregates instead of fetching all records
  const paidInvoicesAggregate = await prisma.invoice.aggregate({
    where: {
      organizationId,
      status: 'paid'
    },
    _sum: { total: true },
    _count: true,
  });

  const pendingInvoicesAggregate = await prisma.invoice.aggregate({
    where: {
      organizationId,
      status: { in: ['sent', 'draft'] }
    },
    _sum: { total: true },
  });

  const totalPaid = paidInvoicesAggregate._sum.total || 0;
  const totalPending = pendingInvoicesAggregate._sum.total || 0;
  const paidCount = paidInvoicesAggregate._count;

  // Expense data
  const now = new Date();
  const startDate = startOfMonth(now);
  const endDate = endOfMonth(now);

  const monthlyExpenses = await prisma.expense.aggregate({
    where: {
      organizationId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      amount: true,
    },
  });

  const totalExpenses = await prisma.expense.aggregate({
    where: { organizationId },
    _sum: {
      amount: true,
    },
  });

  const recentExpenses = await prisma.expense.findMany({
    where: { organizationId },
    take: 5,
    orderBy: { date: 'desc' },
    include: {
      category: true,
      customer: true,
    },
  });

  // Expenses by category this month - optimized to avoid N+1 queries
  const expensesByCategory = await prisma.expense.groupBy({
    by: ['categoryId'],
    where: {
      organizationId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      amount: true,
    },
  });

  // Fetch all categories in one query instead of N queries
  const categoryIds = expensesByCategory.map(item => item.categoryId);
  const categories = await prisma.expenseCategory.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  });

  const categoryMap = new Map(categories.map(c => [c.id, c.name]));

  const categoriesWithExpenses = expensesByCategory.map((item) => ({
    category: categoryMap.get(item.categoryId) || 'Unknown',
    total: item._sum.amount || 0,
  }));

  // Net income (revenue - expenses) for the month
  const monthlyRevenueAggregate = await prisma.invoice.aggregate({
    where: {
      organizationId,
      status: 'paid',
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: { total: true },
  });

  const monthlyRevenue = monthlyRevenueAggregate._sum.total || 0;
  const netIncome = monthlyRevenue - (monthlyExpenses._sum.amount || 0);

  return {
    invoices,
    stats: {
      totalInvoices,
      totalPaid,
      totalPending,
      paidCount,
      monthlyExpenses: monthlyExpenses._sum.amount || 0,
      totalExpenses: totalExpenses._sum.amount || 0,
      netIncome,
    },
    recentExpenses,
    expensesByCategory: categoriesWithExpenses,
  };
}

export default async function Dashboard() {
  // Check if user needs to complete welcome wizard
  const user = await getCurrentUserOrNull();

  if (!user) {
    redirect('/login');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      hasCompletedWelcome: true,
      organizationId: true,
    },
  });

  // Redirect to welcome page if user hasn't completed it
  if (dbUser && !dbUser.hasCompletedWelcome) {
    redirect('/welcome');
  }

  // Require organization membership
  if (!dbUser?.organizationId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Organization</h1>
          <p className="text-gray-600">You must belong to an organization to access the dashboard.</p>
        </div>
      </div>
    );
  }

  const { invoices, stats, recentExpenses, expensesByCategory } = await getDashboardData(dbUser.organizationId);

  const statusColors = {
    draft: 'bg-gray-200 text-gray-900',
    sent: 'bg-blue-200 text-blue-900',
    paid: 'bg-green-200 text-green-900',
    overdue: 'bg-red-200 text-red-900',
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Link href="/invoices/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Create Invoice</span>
            <span className="sm:hidden">New</span>
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-1">
            <div className="flex items-start justify-between mb-1">
              <p className="text-xs font-medium text-gray-600 leading-tight">Total Invoices</p>
              <FileText className="w-5 h-5 text-blue-700 flex-shrink-0" />
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.totalInvoices}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-1">
            <div className="flex items-start justify-between mb-1">
              <p className="text-xs font-medium text-gray-600 leading-tight">Total Paid</p>
              <DollarSign className="w-5 h-5 text-green-700 flex-shrink-0" />
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900 break-all">{formatCurrency(stats.totalPaid)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-1">
            <div className="flex items-start justify-between mb-1">
              <p className="text-xs font-medium text-gray-600 leading-tight">Monthly Expenses</p>
              <Receipt className="w-5 h-5 text-red-700 flex-shrink-0" />
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900 break-all">{formatCurrency(stats.monthlyExpenses)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-1">
            <div className="flex items-start justify-between mb-1">
              <p className="text-xs font-medium text-gray-600 leading-tight">Net Income (Month)</p>
              <TrendingDown className={`w-5 h-5 flex-shrink-0 ${stats.netIncome >= 0 ? 'text-green-700' : 'text-red-700'}`} />
            </div>
            <p className={`text-xl md:text-2xl font-bold break-all ${stats.netIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {formatCurrency(stats.netIncome)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Invoices</CardTitle>
              <Link href="/invoices">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="border-b pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <Link href={`/invoices/${invoice.id}`} className="text-blue-700 hover:underline font-semibold">
                        #{invoice.invoiceNumber}
                      </Link>
                      <p className="text-sm text-gray-900 mt-1">{invoice.customer.name}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[invoice.status as keyof typeof statusColors]}`}>
                      {invoice.status}
                    </span>
                  </div>
                  <p className="font-bold text-gray-900">{formatCurrency(invoice.total)}</p>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Invoice #</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Link href={`/invoices/${invoice.id}`} className="text-blue-700 hover:underline font-medium">
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-gray-900">{invoice.customer.name}</td>
                      <td className="py-3 px-4 text-gray-900">{formatCurrency(invoice.total)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[invoice.status as keyof typeof statusColors]}`}>
                          {invoice.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Expenses</CardTitle>
              <Link href="/expenses">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentExpenses.map((expense) => (
                <div key={expense.id} className="flex justify-between items-start border-b pb-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{expense.description}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="info">{expense.category.name}</Badge>
                      <Badge variant={expense.status === 'paid' ? 'success' : expense.status === 'pending' ? 'warning' : 'default'}>
                        {expense.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{formatDate(expense.date)}</p>
                  </div>
                  <p className="font-bold text-gray-900">{formatCurrency(expense.amount)}</p>
                </div>
              ))}
              {recentExpenses.length === 0 && (
                <p className="text-gray-600 text-center py-4">No expenses yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Breakdown by Category */}
      {expensesByCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expensesByCategory.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">{item.category}</span>
                  <span className="font-bold text-gray-900">{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
