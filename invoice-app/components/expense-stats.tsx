'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/eu-format';

interface ExpenseStatsProps {
  monthlyTotal: number;
  totalAllTime: number;
  byCategory: Array<{
    category: string;
    total: number;
    count: number;
  }>;
  className?: string;
}

export function ExpenseStats({
  monthlyTotal = 0,
  totalAllTime = 0,
  byCategory,
  className = '',
}: ExpenseStatsProps) {
  // Ensure byCategory is an array before calling slice
  const topCategories = (byCategory || []).slice(0, 5);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar size={20} />
            This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(monthlyTotal || 0)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign size={20} />
            Total Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAllTime || 0)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp size={20} />
            Top Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topCategories.length > 0 ? (
            <>
              <p className="text-lg font-bold text-gray-900">{topCategories[0].category}</p>
              <p className="text-sm text-gray-600">{formatCurrency(topCategories[0].total)}</p>
            </>
          ) : (
            <p className="text-gray-600">No expenses yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
