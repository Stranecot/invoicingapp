import { formatDistanceToNow, format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

/**
 * Format a date as a relative time string (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Format a date as a readable string (e.g., "Jan 15, 2024")
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMM dd, yyyy');
}

/**
 * Format a date as a full readable string with time (e.g., "Jan 15, 2024 at 3:45 PM")
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMM dd, yyyy \'at\' h:mm a');
}

/**
 * Get the start and end dates for the current month
 */
export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
  };
}

/**
 * Get the start and end dates for last N days
 */
export function getLastNDaysRange(days: number): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);

  return {
    start,
    end: now,
  };
}

/**
 * Get the start date for N months ago
 */
export function getNMonthsAgo(months: number): Date {
  return subMonths(new Date(), months);
}

/**
 * Check if a date is within the last N days
 */
export function isWithinLastNDays(date: Date | string, days: number): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const { start } = getLastNDaysRange(days);
  return dateObj >= start;
}
