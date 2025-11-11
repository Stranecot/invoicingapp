/**
 * Vercel Analytics Configuration
 *
 * Configuration for Vercel Analytics and Speed Insights.
 * This provides performance monitoring and user analytics for production deployments.
 *
 * @see https://vercel.com/docs/analytics
 * @see https://vercel.com/docs/speed-insights
 */

export const analyticsConfig = {
  /**
   * Enable Vercel Analytics
   * Tracks page views, custom events, and user sessions
   */
  analytics: {
    enabled: true,

    // Enable in production only
    debug: process.env.NODE_ENV === 'development',

    // Custom event tracking
    trackPageViews: true,

    // Privacy settings
    anonymize: true, // Anonymize user IPs

    // Sample rate (1.0 = 100% of users)
    sampleRate: 1.0,
  },

  /**
   * Speed Insights Configuration
   * Tracks Core Web Vitals and performance metrics
   */
  speedInsights: {
    enabled: true,

    // Debug mode (only in development)
    debug: process.env.NODE_ENV === 'development',

    // Route tracking
    route: true, // Track performance per route

    // Sample rate for performance monitoring
    sampleRate: 1.0, // 100% in production, adjust based on traffic
  },

  /**
   * Custom event names for tracking
   */
  events: {
    // Invoice events
    INVOICE_CREATED: 'invoice_created',
    INVOICE_SENT: 'invoice_sent',
    INVOICE_PAID: 'invoice_paid',
    INVOICE_DELETED: 'invoice_deleted',
    INVOICE_EXPORTED: 'invoice_exported',

    // Customer events
    CUSTOMER_CREATED: 'customer_created',
    CUSTOMER_UPDATED: 'customer_updated',
    CUSTOMER_DELETED: 'customer_deleted',

    // Expense events
    EXPENSE_CREATED: 'expense_created',
    EXPENSE_UPDATED: 'expense_updated',
    EXPENSE_DELETED: 'expense_deleted',

    // User events
    USER_SIGNED_UP: 'user_signed_up',
    USER_SIGNED_IN: 'user_signed_in',
    USER_SIGNED_OUT: 'user_signed_out',

    // Feature usage
    FEATURE_USED: 'feature_used',
    SEARCH_PERFORMED: 'search_performed',
    FILTER_APPLIED: 'filter_applied',

    // Errors
    ERROR_OCCURRED: 'error_occurred',
    API_ERROR: 'api_error',
  },
};

export default analyticsConfig;
