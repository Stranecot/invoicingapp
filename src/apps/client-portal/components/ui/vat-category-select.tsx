'use client';

import { useState, useEffect } from 'react';
import { Select } from './select';

interface VatCategory {
  id: string;
  code: string;
  nameEn: string;
  nameBg?: string;
  description?: string;
}

interface VatCategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export function VatCategorySelect({ value, onChange, required, disabled }: VatCategorySelectProps) {
  const [categories, setCategories] = useState<VatCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/vat/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching VAT categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const options = [
    { value: '', label: loading ? 'Loading...' : 'Select category' },
    ...categories.map((cat) => ({
      value: cat.code,
      label: `${cat.nameEn}`,
    })),
  ];

  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      options={options}
      required={required}
      disabled={disabled || loading}
    />
  );
}
