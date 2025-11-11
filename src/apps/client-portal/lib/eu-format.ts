/**
 * European (EU) Formatting Utilities
 *
 * Centralized formatting functions for dates, currency, and numbers
 * following EU standards.
 */

import { format } from 'date-fns';

/**
 * EU Date Format Configuration
 * Format: dd MMM yyyy (e.g., "15 Jan 2025")
 */
export const EU_DATE_FORMAT = 'dd MMM yyyy';

/**
 * EU Date-Time Format Configuration
 * Format: dd MMM yyyy HH:mm (e.g., "15 Jan 2025 14:30")
 * Uses 24-hour time format
 */
export const EU_DATETIME_FORMAT = 'dd MMM yyyy HH:mm';

/**
 * ISO Date Format for CSV exports
 * Format: yyyy-MM-dd (e.g., "2025-01-15")
 */
export const ISO_DATE_FORMAT = 'yyyy-MM-dd';

/**
 * EU Currency Configuration
 */
export const EU_CURRENCY = 'EUR';
export const EU_LOCALE = 'de-DE'; // German locale is widely used for EU formatting

/**
 * Formats a date using EU format (dd MMM yyyy)
 */
export function formatDate(date: Date | string): string {
  return format(new Date(date), EU_DATE_FORMAT);
}

/**
 * Formats a date-time using EU format with 24-hour time (dd MMM yyyy HH:mm)
 */
export function formatDateTime(date: Date | string): string {
  return format(new Date(date), EU_DATETIME_FORMAT);
}

/**
 * Formats a date as ISO format for CSV exports (yyyy-MM-dd)
 */
export function formatDateISO(date: Date | string): string {
  return format(new Date(date), ISO_DATE_FORMAT);
}

/**
 * Formats a currency amount using EU standards
 * - Currency: EUR (€)
 * - Locale: de-DE (comma as decimal separator, dot as thousands separator)
 * - Example: 1.234,56 €
 */
export function formatCurrency(amount: number, currency: string = EU_CURRENCY): string {
  return new Intl.NumberFormat(EU_LOCALE, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Formats a number using EU standards (comma as decimal separator)
 * - Example: 1.234,56
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat(EU_LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formats a currency amount for PDF generation (without symbol, with space)
 * - Example: "1.234,56" (for use with manual currency symbol placement)
 */
export function formatCurrencyForPDF(amount: number): string {
  return formatNumber(amount, 2);
}

/**
 * Formats a currency amount for CSV export (plain decimal format)
 * - Example: 1234.56 (uses dot as decimal separator for data interchange)
 */
export function formatCurrencyForCSV(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Parses a number string considering European format
 * Handles both dot and comma as decimal separators
 */
export function parseEuropeanNumber(value: string): number {
  // Remove thousands separators (dots in EU format)
  // Replace comma decimal separator with dot for parsing
  const normalized = value.replace(/\./g, '').replace(',', '.');
  return parseFloat(normalized);
}
