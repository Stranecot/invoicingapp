/**
 * Sentry Server-Side Configuration for Admin Dashboard
 *
 * This file configures Sentry for the server-side code (API routes, SSR).
 * It's automatically imported by Next.js instrumentation.
 */

import * as Sentry from '@sentry/nextjs';
import { getSentryConfig } from '../../../sentry.config';

const config = getSentryConfig('admin-dashboard');

Sentry.init({
  ...config,

  // Additional server-side specific configuration
  integrations: [
    // Node.js profiling
    Sentry.nodeProfilingIntegration(),
  ],

  // Track server context
  beforeSend(event, hint) {
    // Call the base beforeSend from config
    event = config.beforeSend?.(event, hint) || event;

    // Filter server-specific sensitive data
    if (event.contexts) {
      // Remove runtime context that might contain env vars
      if (event.contexts.runtime) {
        delete event.contexts.runtime.version;
      }
    }

    return event;
  },
});
