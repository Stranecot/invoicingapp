/**
 * Sentry Configuration for Invoice App Monorepo
 *
 * This is a shared configuration that can be imported by both apps.
 * Environment variables should be set in each app's .env.local file.
 */

/**
 * Common Sentry configuration options
 * @param {string} appName - Name of the application (client-portal or admin-dashboard)
 * @returns {object} Sentry configuration object
 */
export const getSentryConfig = (appName) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    // Sentry DSN - unique for each app or shared
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,

    // Environment helps filter issues in Sentry dashboard
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development',

    // Release tracking for better error context
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'development',

    // Sample rate for error events (1.0 = 100% of errors)
    // In production, capture all errors
    tracesSampleRate: isProduction ? 1.0 : 1.0,

    // Sample rate for performance monitoring
    // Lower in production to reduce quota usage
    // 0.1 = 10% of transactions
    // Adjust based on traffic volume and Sentry quota
    replaysSessionSampleRate: isProduction ? 0.1 : 0.0,

    // Sample rate for session replay on errors
    // 1.0 = 100% of sessions with errors are replayed
    replaysOnErrorSampleRate: isProduction ? 1.0 : 0.0,

    // Don't report errors in development by default
    // Set SENTRY_ENABLED=true in .env.local to test in development
    enabled: process.env.SENTRY_ENABLED === 'true' || isProduction,

    // Tags to help organize and filter errors
    initialScope: {
      tags: {
        app: appName,
        runtime: typeof window === 'undefined' ? 'server' : 'client',
      },
    },

    // Ignore common errors that aren't actionable
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',
      // Network errors
      'NetworkError',
      'Network request failed',
      'Failed to fetch',
      // Random plugins/extensions
      'instantSearchSDKJSBridgeClearHighlight',
      // Harmless errors
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      // Cancelled requests
      'Request aborted',
      'cancelled',
      // Chunk loading errors (usually due to deployments)
      'ChunkLoadError',
      'Loading chunk',
    ],

    // Don't send sensitive data
    beforeSend(event, hint) {
      // Filter out PII from error messages
      if (event.message) {
        event.message = filterSensitiveData(event.message);
      }

      // Filter breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => ({
          ...breadcrumb,
          message: breadcrumb.message ? filterSensitiveData(breadcrumb.message) : undefined,
          data: breadcrumb.data ? filterSensitiveObject(breadcrumb.data) : undefined,
        }));
      }

      // Filter request data
      if (event.request) {
        event.request.headers = filterSensitiveObject(event.request.headers);
        event.request.cookies = undefined; // Never send cookies
      }

      return event;
    },

    // Integration configuration
    integrations: (integrations) => {
      // Filter out integrations that might capture sensitive data
      return integrations.filter(integration => {
        // Keep all integrations by default
        return true;
      });
    },

    // Tracing options
    tracingOptions: {
      // Track component tree information
      trackComponents: true,
    },

    // Debug mode (only in development)
    debug: isDevelopment && process.env.SENTRY_DEBUG === 'true',
  };
};

/**
 * Filter sensitive data from strings
 * @param {string} text - Text to filter
 * @returns {string} Filtered text
 */
function filterSensitiveData(text) {
  if (!text) return text;

  return text
    // Email addresses
    .replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]')
    // API keys and tokens
    .replace(/\b[A-Za-z0-9_-]{32,}\b/g, '[TOKEN]')
    // Credit card numbers
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD]')
    // Phone numbers
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
    // SSN
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');
}

/**
 * Filter sensitive data from objects
 * @param {object} obj - Object to filter
 * @returns {object} Filtered object
 */
function filterSensitiveObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  const sensitiveKeys = [
    'password',
    'token',
    'apiKey',
    'api_key',
    'secret',
    'authorization',
    'cookie',
    'session',
    'csrf',
    'ssn',
    'creditCard',
    'credit_card',
  ];

  const filtered = { ...obj };

  Object.keys(filtered).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      filtered[key] = '[FILTERED]';
    } else if (typeof filtered[key] === 'object') {
      filtered[key] = filterSensitiveObject(filtered[key]);
    } else if (typeof filtered[key] === 'string') {
      filtered[key] = filterSensitiveData(filtered[key]);
    }
  });

  return filtered;
}

// Export for use in Next.js apps
export default getSentryConfig;
