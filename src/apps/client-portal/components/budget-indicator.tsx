'use client';

import React from 'react';
import { Progress } from './ui/progress';
import { AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/eu-format';

interface BudgetIndicatorProps {
  categoryName: string;
  spent: number;
  limit: number;
  period?: string;
  className?: string;
}

export function BudgetIndicator({
  categoryName,
  spent,
  limit,
  period = 'monthly',
  className = '',
}: BudgetIndicatorProps) {
  const percentage = (spent / limit) * 100;
  const remaining = limit - spent;

  const getStatus = () => {
    if (percentage >= 100) return 'Over budget';
    if (percentage >= 80) return 'Warning';
    return 'On track';
  };

  const status = getStatus();

  return (
    <div className={`p-4 border rounded-lg ${className}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-medium text-gray-900">{categoryName}</h4>
          <p className="text-sm text-gray-600 capitalize">{period} budget</p>
        </div>
        {percentage >= 80 && (
          <AlertTriangle
            className={percentage >= 100 ? 'text-red-700' : 'text-yellow-600'}
            size={20}
          />
        )}
      </div>

      <Progress value={spent} max={limit} showLabel className="mb-2" />

      <div className="flex justify-between text-sm mt-2">
        <span className="text-gray-600">Status:</span>
        <span
          className={`font-medium ${
            percentage >= 100
              ? 'text-red-700'
              : percentage >= 80
              ? 'text-yellow-600'
              : 'text-green-700'
          }`}
        >
          {status}
        </span>
      </div>

      <div className="flex justify-between text-sm mt-1">
        <span className="text-gray-600">Remaining:</span>
        <span className={`font-medium ${remaining < 0 ? 'text-red-700' : 'text-gray-900'}`}>
          {formatCurrency(Math.abs(remaining))} {remaining < 0 && 'over'}
        </span>
      </div>
    </div>
  );
}
