import React from 'react';
import { getCountries, CountryTaxRate } from '@invoice-app/database';

interface CountrySelectProps {
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  showTaxRate?: boolean;
}

export function CountrySelect({
  value,
  onChange,
  required = false,
  disabled = false,
  className = '',
  showTaxRate = false,
}: CountrySelectProps) {
  const countries = getCountries();

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      disabled={disabled}
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${className}`}
    >
      <option value="">Select a country...</option>
      {countries.map((country) => (
        <option key={country.countryCode} value={country.countryCode}>
          {country.country}
          {showTaxRate && country.standardRate > 0 && ` (${country.standardRate}% VAT)`}
        </option>
      ))}
    </select>
  );
}

interface CountrySelectWithFlagProps extends CountrySelectProps {
  showFlag?: boolean;
}

export function CountrySelectWithFlag({
  showFlag = true,
  ...props
}: CountrySelectWithFlagProps) {
  // For now, just use the regular select
  // Could be enhanced with flag emojis or icons in the future
  return <CountrySelect {...props} />;
}
