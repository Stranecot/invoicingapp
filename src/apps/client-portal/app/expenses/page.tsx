'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Download, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { ExpenseForm } from '@/components/expense-form';
import { ExpenseStats } from '@/components/expense-stats';
import { BudgetIndicator } from '@/components/budget-indicator';
import { startOfMonth, endOfMonth } from 'date-fns';
import { formatDateISO, formatDate } from '@/lib/eu-format';

interface Expense {
  id: string;
  date: string;
  amount: number;
  description: string;
  vendorName: string | null;
  status: string;
  paymentMethod: string | null;
  category: {
    id: string;
    name: string;
  };
  customer?: {
    id: string;
    name: string;
  } | null;
  invoice?: {
    id: string;
    invoiceNumber: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
}

interface Customer {
  id: string;
  name: string;
}

interface Budget {
  id: string;
  limit: number;
  spent: number;
  percentage: number;
  remaining: number;
  period: string;
  category: {
    id: string;
    name: string;
  };
}

interface Stats {
  monthlyTotal: number;
  totalAllTime: number;
  byCategory: Array<{
    category: string;
    total: number;
    count: number;
  }>;
}

function ExpensesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState(formatDateISO(startOfMonth(new Date())));
  const [endDate, setEndDate] = useState(formatDateISO(endOfMonth(new Date())));

  const fetchExpenses = useCallback(async () => {
    const res = await fetch('/api/expenses');
    const data = await res.json();
    setExpenses(Array.isArray(data) ? data : []);
  }, []);

  const fetchCategories = useCallback(async () => {
    const res = await fetch('/api/expenses/categories');
    const data = await res.json();
    setCategories(Array.isArray(data) ? data : []);
  }, []);

  const fetchCustomers = useCallback(async () => {
    const res = await fetch('/api/customers');
    const data = await res.json();
    setCustomers(Array.isArray(data) ? data : []);
  }, []);

  const fetchBudgets = useCallback(async () => {
    const res = await fetch('/api/expenses/budgets');
    const data = await res.json();
    setBudgets(Array.isArray(data) ? data : []);
  }, []);

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/expenses/stats');
    const data = await res.json();
    setStats(data);
  }, []);

  const openCreateModal = useCallback(() => {
    setEditingExpense(null);
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchExpenses(),
        fetchCategories(),
        fetchCustomers(),
        fetchBudgets(),
        fetchStats()
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchExpenses, fetchCategories, fetchCustomers, fetchBudgets, fetchStats]);

  // Check for action=new query parameter to open modal
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openCreateModal();
      router.replace('/expenses');
    }
  }, [searchParams, router, openCreateModal]);

  const handleDelete = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        setDeletingId(id);
        await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
        fetchExpenses();
        fetchStats();
        fetchBudgets();
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Failed to delete expense');
      } finally {
        setDeletingId(null);
      }
    }
  }, [fetchExpenses, fetchStats, fetchBudgets]);

  const handleSubmit = useCallback(async (data: any) => {
    const url = editingExpense ? `/api/expenses/${editingExpense.id}` : '/api/expenses';
    const method = editingExpense ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      setIsModalOpen(false);
      setEditingExpense(null);
      fetchExpenses();
      fetchStats();
      fetchBudgets();
    } else {
      const error = await response.json();
      alert(`Failed to save expense: ${error.error || 'Unknown error'}`);
    }
  }, [editingExpense, fetchExpenses, fetchStats, fetchBudgets]);

  const handleExport = useCallback(async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/expenses/export?${params.toString()}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expenses-${formatDateISO(new Date())}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to export expenses');
      }
    } catch (error) {
      console.error('Error exporting expenses:', error);
      alert('An error occurred while exporting');
    } finally {
      setExporting(false);
    }
  }, [startDate, endDate]);

  const openEditModal = useCallback((expense: Expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingExpense(null);
  }, []);

  const getStatusBadgeVariant = useCallback((status: string) => {
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
  }, []);

  // Memoize filtered expenses to prevent recalculation on every render
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (statusFilter !== 'all' && expense.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && expense.category.id !== categoryFilter) return false;
      if (customerFilter !== 'all' && expense.customer?.id !== customerFilter) return false;

      const expenseDate = new Date(expense.date);
      if (startDate && expenseDate < new Date(startDate)) return false;
      if (endDate && expenseDate > new Date(endDate)) return false;

      return true;
    });
  }, [expenses, statusFilter, categoryFilter, customerFilter, startDate, endDate]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Add Expense</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-gray-600">Loading expenses...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Add Expense</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
        <Button variant="secondary" onClick={handleExport} disabled={exporting}>
          <Download className="w-4 h-4 mr-2" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </div>

      {stats && <ExpenseStats {...stats} />}

      {budgets.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Budget Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((budget) => (
              <BudgetIndicator
                key={budget.id}
                categoryName={budget.category.name}
                spent={budget.spent}
                limit={budget.limit}
                period={budget.period}
              />
            ))}
          </div>
        </div>
      )}

      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'paid', label: 'Paid' },
                  { value: 'reimbursed', label: 'Reimbursed' },
                ]}
              />
              <Select
                label="Category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Categories' },
                  ...categories.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
              <Select
                label="Customer"
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Customers' },
                  ...customers.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Date Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={statusFilter === 'all' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('all')}
        >
          All
        </Button>
        <Button
          variant={statusFilter === 'pending' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('pending')}
        >
          Pending
        </Button>
        <Button
          variant={statusFilter === 'paid' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('paid')}
        >
          Paid
        </Button>
        <Button
          variant={statusFilter === 'reimbursed' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('reimbursed')}
        >
          Reimbursed
        </Button>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredExpenses.length > 0 ? (
          filteredExpenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getStatusBadgeVariant(expense.status)}>
                        {expense.status}
                      </Badge>
                      <span className="text-xs text-gray-600">
                        {formatDate(expense.date)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">{expense.description}</h3>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(expense)}
                      title="Edit"
                      disabled={deletingId === expense.id}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(expense.id)}
                      title="Delete"
                      disabled={deletingId === expense.id}
                    >
                      {deletingId === expense.id ? (
                        <span className="text-xs">Deleting...</span>
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-700" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className="text-lg font-bold text-gray-900">${expense.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-sm text-gray-600 w-24">Category:</span>
                    <span className="text-sm text-gray-900 flex-1">{expense.category.name}</span>
                  </div>
                  {expense.vendorName && (
                    <div className="flex items-start">
                      <span className="text-sm text-gray-600 w-24">Vendor:</span>
                      <span className="text-sm text-gray-900 flex-1">{expense.vendorName}</span>
                    </div>
                  )}
                  {expense.paymentMethod && (
                    <div className="flex items-start">
                      <span className="text-sm text-gray-600 w-24">Payment:</span>
                      <span className="text-sm text-gray-900 flex-1">
                        {expense.paymentMethod.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </div>
                  )}
                  {expense.customer && (
                    <div className="flex items-start">
                      <span className="text-sm text-gray-600 w-24">Customer:</span>
                      <span className="text-sm text-gray-900 flex-1">{expense.customer.name}</span>
                    </div>
                  )}
                  {expense.invoice && (
                    <div className="flex items-start">
                      <span className="text-sm text-gray-600 w-24">Invoice:</span>
                      <span className="text-sm text-gray-900 flex-1">{expense.invoice.invoiceNumber}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-gray-600">
              No expenses found. Click &quot;Add Expense&quot; to create one.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Description</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Vendor</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Payment</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">
                      {formatDate(expense.date)}
                    </td>
                    <td className="py-3 px-4 text-gray-900">{expense.category.name}</td>
                    <td className="py-3 px-4 text-gray-900">
                      {expense.description}
                      {expense.customer && (
                        <div className="text-xs text-gray-600 mt-1">
                          Customer: {expense.customer.name}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-900">{expense.vendorName || '-'}</td>
                    <td className="py-3 px-4 text-gray-900 font-medium">
                      ${expense.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      {expense.paymentMethod
                        ? expense.paymentMethod.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
                        : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusBadgeVariant(expense.status)}>
                        {expense.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(expense)}
                          title="Edit"
                          disabled={deletingId === expense.id}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(expense.id)}
                          title={deletingId === expense.id ? 'Deleting...' : 'Delete'}
                          disabled={deletingId === expense.id}
                        >
                          <Trash2 className="w-4 h-4 text-red-700" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-600">
                      No expenses found. Click &quot;Add Expense&quot; to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingExpense ? 'Edit Expense' : 'Add Expense'}>
        <ExpenseForm expense={editingExpense} onSubmit={handleSubmit} onCancel={closeModal} />
      </Modal>
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="flex justify-between items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-gray-600">Loading...</div>
          </CardContent>
        </Card>
      </div>
    }>
      <ExpensesContent />
    </Suspense>
  );
}
