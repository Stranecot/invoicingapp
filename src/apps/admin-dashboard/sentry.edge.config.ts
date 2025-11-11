/**
 * Sentry Edge Runtime Configuration for Admin Dashboard
 *
 * This file configures Sentry for Edge Runtime (middleware, edge functions).
 * It's automatically imported by Next.js instrumentation.
 */

import * as Sentry from '@sentry/nextjs';
import { getSentryConfig } from '../../../sentry.config';

const config = getSentryConfig('admin-dashboard');

Sentry.init({
  ...config,

  // Edge runtime has limited integrations available
  integrations: [],

  // Edge-specific configuration
  beforeSend(event, hint) {
    // Call the base beforeSend from config
    event = config.beforeSend?.(event, hint) || event;

    return event;
  },
});
