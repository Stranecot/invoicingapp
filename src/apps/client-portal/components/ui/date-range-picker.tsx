'use client';

import React from 'react';
import { Input } from './input';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  className?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className = '',
}: DateRangePickerProps) {
  return (
    <div className={`flex gap-2 items-center ${className}`}>
      <Input
        type="date"
        label="From"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
      />
      <span className="text-gray-900 mt-6">to</span>
      <Input
        type="date"
        label="To"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
      />
    </div>
  );
}
