/**
 * Next.js Instrumentation for Client Portal
 *
 * This file is automatically loaded by Next.js when the application starts.
 * It's used to initialize monitoring and error tracking.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only initialize Sentry if DSN is configured
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      // Server-side initialization
      await import('./sentry.server.config');
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
      // Edge runtime initialization
      await import('./sentry.edge.config');
    }
  }

  // Additional instrumentation can be added here
  // For example: OpenTelemetry, custom logging, etc.
}
