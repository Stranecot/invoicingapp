import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { formatDateISO, formatCurrencyForCSV, EU_CURRENCY, EU_LOCALE } from './eu-format';

/**
 * Get date range based on period type
 */
export function getDateRangeForPeriod(period: 'monthly' | 'quarterly' | 'yearly', date: Date = new Date()) {
  switch (period) {
    case 'monthly':
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
      };
    case 'quarterly':
      return {
        start: startOfQuarter(date),
        end: endOfQuarter(date),
      };
    case 'yearly':
      return {
        start: startOfYear(date),
        end: endOfYear(date),
      };
    default:
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
      };
  }
}

/**
 * Calculate budget status
 */
export function calculateBudgetStatus(spent: number, limit: number) {
  const percentage = limit > 0 ? (spent / limit) * 100 : 0;
  const remaining = limit - spent;

  let status: 'on-track' | 'warning' | 'over-budget';
  if (percentage >= 100) {
    status = 'over-budget';
  } else if (percentage >= 80) {
    status = 'warning';
  } else {
    status = 'on-track';
  }

  return {
    percentage,
    remaining,
    status,
    isOverBudget: percentage >= 100,
    isNearLimit: percentage >= 80 && percentage < 100,
  };
}

/**
 * Format expense amount
 */
export function formatExpenseAmount(amount: number, currency: string = EU_CURRENCY): string {
  return new Intl.NumberFormat(EU_LOCALE, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Get status badge variant
 */
export function getExpenseStatusVariant(status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'paid':
      return 'success';
    case 'pending':
      return 'warning';
    case 'reimbursed':
      return 'info';
    default:
      return 'default';
  }
}

/**
 * Format payment method for display
 */
export function formatPaymentMethod(method: string | null): string {
  if (!method) return '-';
  return method.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Group expenses by category
 */
export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
}

export function groupExpensesByCategory(expenses: Expense[]) {
  const grouped = expenses.reduce((acc, expense) => {
    const categoryId = expense.categoryId;
    if (!acc[categoryId]) {
      acc[categoryId] = {
        categoryId,
        categoryName: expense.category.name,
        total: 0,
        count: 0,
        expenses: [],
      };
    }
    acc[categoryId].total += expense.amount;
    acc[categoryId].count += 1;
    acc[categoryId].expenses.push(expense);
    return acc;
  }, {} as Record<string, { categoryId: string; categoryName: string; total: number; count: number; expenses: Expense[] }>);

  return Object.values(grouped).sort((a, b) => b.total - a.total);
}

/**
 * Calculate expense statistics
 */
export function calculateExpenseStats(expenses: Expense[]) {
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const count = expenses.length;
  const average = count > 0 ? total / count : 0;

  const byCategory = groupExpensesByCategory(expenses);
  const topCategory = byCategory.length > 0 ? byCategory[0] : null;

  return {
    total,
    count,
    average,
    byCategory,
    topCategory,
  };
}

/**
 * Export expenses to CSV format
 */
export function exportExpensesToCSV(expenses: any[]): string {
  const headers = [
    'Date',
    'Category',
    'Description',
    'Vendor',
    'Amount',
    'Payment Method',
    'Status',
    'Customer',
    'Invoice',
    'Receipt Reference',
    'Notes',
  ];

  const rows = expenses.map((expense) => [
    formatDateISO(expense.date),
    expense.category.name,
    expense.description,
    expense.vendorName || '',
    formatCurrencyForCSV(expense.amount),
    formatPaymentMethod(expense.paymentMethod),
    expense.status,
    expense.customer?.name || '',
    expense.invoice?.invoiceNumber || '',
    expense.receiptReference || '',
    expense.notes || '',
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csv;
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Validate expense data
 */
export interface ExpenseFormData {
  date: string;
  categoryId: string;
  amount: string | number;
  description: string;
  vendorName?: string;
  paymentMethod?: string;
  status?: string;
  customerId?: string;
  invoiceId?: string;
  receiptReference?: string;
  notes?: string;
}

export function validateExpenseData(data: ExpenseFormData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.date) {
    errors.push('Date is required');
  }

  if (!data.categoryId) {
    errors.push('Category is required');
  }

  if (!data.amount || parseFloat(data.amount.toString()) <= 0) {
    errors.push('Amount must be greater than 0');
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.push('Description is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
