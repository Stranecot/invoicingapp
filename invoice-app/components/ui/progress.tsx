import React from 'react';

interface ProgressProps {
  value: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  className?: string;
}

export function Progress({
  value,
  max = 100,
  variant = 'default',
  showLabel = false,
  className = '',
}: ProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const getVariant = () => {
    if (variant !== 'default') return variant;
    if (percentage >= 100) return 'danger';
    if (percentage >= 80) return 'warning';
    return 'success';
  };

  const currentVariant = getVariant();

  const variants = {
    default: 'bg-blue-700',
    success: 'bg-green-700',
    warning: 'bg-yellow-600',
    danger: 'bg-red-700',
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${variants[currentVariant]} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      {showLabel && (
        <div className="mt-1 text-xs text-gray-900">
          {value.toFixed(2)} / {max.toFixed(2)} ({percentage.toFixed(0)}%)
        </div>
      )}
    </div>
  );
}
