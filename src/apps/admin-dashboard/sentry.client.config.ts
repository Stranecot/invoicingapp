/**
 * Sentry Client-Side Configuration for Admin Dashboard
 *
 * This file configures Sentry for the browser/client-side code.
 * It's automatically imported by Next.js instrumentation.
 */

import * as Sentry from '@sentry/nextjs';
import { getSentryConfig } from '../../../sentry.config';

const config = getSentryConfig('admin-dashboard');

Sentry.init({
  ...config,

  // Additional client-side specific configuration
  integrations: [
    // Replay integration for session recording on errors
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
      maskAllInputs: true,
    }),

    // Browser tracing for performance monitoring
    Sentry.browserTracingIntegration({
      // Trace Next.js navigation
      routingInstrumentation: Sentry.nextjsNavigationInstrumentation,
    }),

    // Capture unhandled promise rejections
    Sentry.browserProfilingIntegration(),
  ],

  // Track user context (anonymized)
  beforeSend(event, hint) {
    // Call the base beforeSend from config
    event = config.beforeSend?.(event, hint) || event;

    // Add admin-specific filtering here if needed
    return event;
  },
});
