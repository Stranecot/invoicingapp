/**
 * Analytics Package
 *
 * Provides analytics tracking for Vercel Analytics and custom events.
 * This package wraps Vercel's analytics SDK with custom event tracking
 * and type-safe event definitions.
 */

import { track } from '@vercel/analytics';

/**
 * Event names for tracking
 */
export enum AnalyticsEvent {
  // Invoice events
  INVOICE_CREATED = 'invoice_created',
  INVOICE_SENT = 'invoice_sent',
  INVOICE_PAID = 'invoice_paid',
  INVOICE_DELETED = 'invoice_deleted',
  INVOICE_EXPORTED = 'invoice_exported',
  INVOICE_VIEWED = 'invoice_viewed',

  // Customer events
  CUSTOMER_CREATED = 'customer_created',
  CUSTOMER_UPDATED = 'customer_updated',
  CUSTOMER_DELETED = 'customer_deleted',
  CUSTOMER_VIEWED = 'customer_viewed',

  // Expense events
  EXPENSE_CREATED = 'expense_created',
  EXPENSE_UPDATED = 'expense_updated',
  EXPENSE_DELETED = 'expense_deleted',
  EXPENSE_EXPORTED = 'expense_exported',

  // User events
  USER_SIGNED_UP = 'user_signed_up',
  USER_SIGNED_IN = 'user_signed_in',
  USER_SIGNED_OUT = 'user_signed_out',
  USER_PROFILE_UPDATED = 'user_profile_updated',

  // Navigation events
  PAGE_VIEW = 'page_view',
  NAVIGATION = 'navigation',

  // Feature usage
  FEATURE_USED = 'feature_used',
  SEARCH_PERFORMED = 'search_performed',
  FILTER_APPLIED = 'filter_applied',
  SORT_APPLIED = 'sort_applied',

  // Errors
  ERROR_OCCURRED = 'error_occurred',
  API_ERROR = 'api_error',
  FORM_ERROR = 'form_error',

  // Performance
  SLOW_API_RESPONSE = 'slow_api_response',
  LARGE_PAYLOAD = 'large_payload',
}

/**
 * Event properties type
 */
export interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Track a custom event
 */
export function trackEvent(event: AnalyticsEvent, properties?: EventProperties) {
  // Only track in production or when explicitly enabled
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== 'true'
  ) {
    console.log('[Analytics]', event, properties);
    return;
  }

  // Filter out sensitive data
  const safeProperties = properties
    ? Object.entries(properties).reduce((acc, [key, value]) => {
        // Don't track sensitive fields
        const sensitiveKeys = ['password', 'token', 'email', 'phone', 'ssn', 'card'];
        if (!sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
          acc[key] = value;
        }
        return acc;
      }, {} as EventProperties)
    : undefined;

  track(event, safeProperties);
}

/**
 * Track page view
 */
export function trackPageView(page: string, properties?: EventProperties) {
  trackEvent(AnalyticsEvent.PAGE_VIEW, {
    page,
    ...properties,
  });
}

/**
 * Track invoice events
 */
export const invoiceAnalytics = {
  created: (id: string, properties?: EventProperties) =>
    trackEvent(AnalyticsEvent.INVOICE_CREATED, { invoiceId: id, ...properties }),

  sent: (id: string, properties?: EventProperties) =>
    trackEvent(AnalyticsEvent.INVOICE_SENT, { invoiceId: id, ...properties }),

  paid: (id: string, properties?: EventProperties) =>
    trackEvent(AnalyticsEvent.INVOICE_PAID, { invoiceId: id, ...properties }),

  deleted: (id: string, properties?: EventProperties) =>
    trackEvent(AnalyticsEvent.INVOICE_DELETED, { invoiceId: id, ...properties }),

  exported: (format: string, properties?: EventProperties) =>
    trackEvent(AnalyticsEvent.INVOICE_EXPORTED, { format, ...properties }),

  viewed: (id: string, properties?: EventProperties) =>
    trackEvent(AnalyticsEvent.INVOICE_VIEWED, { invoiceId: id, ...properties }),
};

/**
 * Track customer events
 */
export const customerAnalytics = {
  created: (id: string, properties?: EventProperties) =>
    trackEvent(AnalyticsEvent.CUSTOMER_CREATED, { customerId: id, ...properties }),

  updated: (id: string, properties?: EventProperties) =>
    trackEvent(AnalyticsEvent.CUSTOMER_UPDATED, { customerId: id, ...properties }),

  deleted: (id: string, properties?: EventProperties) =>
    trackEvent(AnalyticsEvent.CUSTOMER_DELETED, { customerId: id, ...properties }),

  viewed: (id: string, properties?: EventProperties) =>
    trackEvent(AnalyticsEvent.CUSTOMER_VIEWED, { customerId: id, ...properties }),
};

/**
 * Track expense events
 */
export const expenseAnalytics = {
  created: (id: string, properties?: EventProperties) =>
    trackEvent(AnalyticsEvent.EXPENSE_CREATED, { expenseId: id, ...properties }),

  updated: (id: string, properties?: EventProperties) =>
    trackEvent(AnalyticsEvent.EXPENSE_UPDATED, { expenseId: id, ...properties }),

  deleted: (id: string, properties?: EventProperties) =>
    trackEvent(AnalyticsEvent.EXPENSE_DELETED, { expenseId: id, ...properties }),

  exported: (format: string, properties?: EventProperties) =>
    trackEvent(AnalyticsEvent.EXPENSE_EXPORTED, { format, ...properties }),
};

/**
 * Track user events
 */
export const userAnalytics = {
  signedUp: (properties?: EventProperties) =>
    trackEvent(AnalyticsEvent.USER_SIGNED_UP, properties),

  signedIn: (properties?: EventProperties) =>
    trackEvent(AnalyticsEvent.USER_SIGNED_IN, properties),

  signedOut: (properties?: EventProperties) =>
    trackEvent(AnalyticsEvent.USER_SIGNED_OUT, properties),

  profileUpdated: (properties?: EventProperties) =>
    trackEvent(AnalyticsEvent.USER_PROFILE_UPDATED, properties),
};

/**
 * Track feature usage
 */
export function trackFeatureUsage(feature: string, properties?: EventProperties) {
  trackEvent(AnalyticsEvent.FEATURE_USED, {
    feature,
    ...properties,
  });
}

/**
 * Track search
 */
export function trackSearch(query: string, results: number, properties?: EventProperties) {
  trackEvent(AnalyticsEvent.SEARCH_PERFORMED, {
    query: query.substring(0, 50), // Limit length for privacy
    results,
    ...properties,
  });
}

/**
 * Track filter usage
 */
export function trackFilter(filter: string, value: string, properties?: EventProperties) {
  trackEvent(AnalyticsEvent.FILTER_APPLIED, {
    filter,
    value,
    ...properties,
  });
}

/**
 * Track errors
 */
export function trackError(
  error: Error | string,
  context?: string,
  properties?: EventProperties
) {
  const errorMessage = error instanceof Error ? error.message : error;

  trackEvent(AnalyticsEvent.ERROR_OCCURRED, {
    error: errorMessage.substring(0, 100), // Limit length
    context,
    ...properties,
  });
}

/**
 * Track API errors
 */
export function trackApiError(
  endpoint: string,
  statusCode: number,
  properties?: EventProperties
) {
  trackEvent(AnalyticsEvent.API_ERROR, {
    endpoint,
    statusCode,
    ...properties,
  });
}

/**
 * Track performance issues
 */
export function trackSlowApiResponse(
  endpoint: string,
  duration: number,
  properties?: EventProperties
) {
  trackEvent(AnalyticsEvent.SLOW_API_RESPONSE, {
    endpoint,
    duration,
    ...properties,
  });
}

// Export analytics components
export { Analytics, type AnalyticsProps } from '@vercel/analytics/react';
export { SpeedInsights } from '@vercel/speed-insights/react';

// Default export
export default {
  trackEvent,
  trackPageView,
  trackFeatureUsage,
  trackSearch,
  trackFilter,
  trackError,
  trackApiError,
  trackSlowApiResponse,
  invoice: invoiceAnalytics,
  customer: customerAnalytics,
  expense: expenseAnalytics,
  user: userAnalytics,
};
