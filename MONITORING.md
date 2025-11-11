# Monitoring and Error Tracking Guide

Complete guide for setting up and using monitoring, error tracking, logging, and alerting for the Invoice Application.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Setup Instructions](#setup-instructions)
  - [1. Sentry Setup](#1-sentry-setup)
  - [2. Vercel Analytics Setup](#2-vercel-analytics-setup)
  - [3. Logging Infrastructure](#3-logging-infrastructure)
  - [4. Alerting Configuration](#4-alerting-configuration)
  - [5. Uptime Monitoring](#5-uptime-monitoring)
- [Usage Guide](#usage-guide)
- [Dashboard Access](#dashboard-access)
- [Alert Response Procedures](#alert-response-procedures)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

The Invoice Application monitoring stack includes:

- **Error Tracking**: Sentry for capturing and analyzing errors
- **Application Monitoring**: Vercel Analytics for performance and usage metrics
- **Logging**: Structured logging with Pino
- **Alerting**: Multi-channel notifications (Email, Slack, PagerDuty)
- **Uptime Monitoring**: Health checks and availability tracking
- **Performance Monitoring**: Core Web Vitals and API response times

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Production Apps                         │
│  ┌──────────────────┐        ┌─────────────────┐           │
│  │  Client Portal   │        │ Admin Dashboard │           │
│  │   (Port 3001)    │        │   (Port 3002)   │           │
│  └────────┬─────────┘        └────────┬────────┘           │
│           │                            │                    │
│           └────────────┬───────────────┘                    │
└────────────────────────┼────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐    ┌─────▼─────┐   ┌───▼────┐
    │ Sentry  │    │   Vercel  │   │  Logs  │
    │  (Errors)│    │(Analytics)│   │ (Pino) │
    └────┬────┘    └─────┬─────┘   └───┬────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
                    ┌────▼─────┐
                    │ Alerting │
                    │  System  │
                    └────┬─────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐    ┌─────▼─────┐   ┌───▼────────┐
    │  Email  │    │   Slack   │   │ PagerDuty  │
    └─────────┘    └───────────┘   └────────────┘
```

## Architecture

### Monitoring Layers

1. **Application Layer**
   - Error boundaries in React components
   - API route error handling
   - Client-side error tracking
   - Server-side error logging

2. **Infrastructure Layer**
   - Health check endpoints
   - Performance metrics
   - Resource utilization
   - Database connection monitoring

3. **Business Layer**
   - User activity tracking
   - Feature usage analytics
   - Business metric dashboards
   - Custom event tracking

## Setup Instructions

### 1. Sentry Setup

Sentry provides error tracking, performance monitoring, and session replay.

#### Step 1: Create Sentry Account

1. Go to [sentry.io](https://sentry.io) and sign up
2. Create an organization (e.g., "your-company")
3. Create two projects:
   - `client-portal` (Next.js)
   - `admin-dashboard` (Next.js)

#### Step 2: Get Sentry DSN

For each project:
1. Navigate to **Settings** → **Projects** → **[Project Name]** → **Client Keys (DSN)**
2. Copy the DSN URL (format: `https://key@org.ingest.sentry.io/project-id`)

#### Step 3: Configure Environment Variables

In Vercel or your deployment platform, set these environment variables:

```bash
# For both apps
NEXT_PUBLIC_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id

# For source map uploads
SENTRY_ORG=your-organization-slug
SENTRY_PROJECT=client-portal  # or admin-dashboard
SENTRY_AUTH_TOKEN=sntrys_your_auth_token_here
```

To generate an auth token:
1. Go to **Settings** → **Account** → **API** → **Auth Tokens**
2. Click **Create New Token**
3. Select scopes: `project:releases`, `org:read`
4. Copy the token

#### Step 4: Install Sentry SDK

```bash
# In both client-portal and admin-dashboard
npm install @sentry/nextjs
```

#### Step 5: Configure Sentry

The Sentry configuration files are already set up:

- `sentry.config.js` - Shared configuration
- `src/apps/*/sentry.client.config.ts` - Client-side config
- `src/apps/*/sentry.server.config.ts` - Server-side config
- `src/apps/*/sentry.edge.config.ts` - Edge runtime config
- `src/apps/*/instrumentation.ts` - Next.js instrumentation

#### Step 6: Test Sentry

Create a test error to verify Sentry is working:

```typescript
// In any page or component
import * as Sentry from '@sentry/nextjs';

// Trigger a test error
Sentry.captureException(new Error('Test error - Sentry is working!'));
```

Check the Sentry dashboard to see the error appear.

### 2. Vercel Analytics Setup

Vercel Analytics provides performance monitoring and user analytics.

#### Step 1: Enable Vercel Analytics

1. Go to your Vercel dashboard
2. Select your project (client-portal or admin-dashboard)
3. Navigate to **Analytics** tab
4. Click **Enable Analytics**

#### Step 2: Enable Speed Insights

1. In the same Analytics tab
2. Enable **Speed Insights**
3. This tracks Core Web Vitals automatically

#### Step 3: Install Analytics SDK

```bash
# In both client-portal and admin-dashboard
npm install @vercel/analytics @vercel/speed-insights
```

#### Step 4: Add to App

The analytics package is already created at `src/packages/analytics/`.

Add to your root layout:

```tsx
// src/apps/*/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

#### Step 5: Track Custom Events

Use the analytics package to track custom events:

```typescript
import analytics from '@invoice-app/analytics';

// Track invoice creation
analytics.invoice.created('inv-123', {
  amount: 1000,
  currency: 'USD',
});

// Track custom events
analytics.trackEvent(AnalyticsEvent.FEATURE_USED, {
  feature: 'pdf-export',
  page: '/invoices',
});
```

### 3. Logging Infrastructure

Structured logging using Pino for server-side code.

#### Step 1: Install Dependencies

The logger package is already created at `src/packages/logger/`.

```bash
# Install dependencies in the root
cd src/packages/logger
npm install
```

#### Step 2: Use Logger in Code

```typescript
import { logger, getLogger } from '@invoice-app/logger';

// Basic logging
logger.info('User logged in', { userId: '123' });
logger.error('Failed to create invoice', { error });

// Create context-specific logger
const invoiceLogger = getLogger('invoices');
invoiceLogger.info('Invoice created', { invoiceId: 'inv-123' });

// In API routes
import { withLogging } from '@invoice-app/logger';

export const GET = withLogging(async (request) => {
  // Your API logic
  return Response.json({ success: true });
}, 'api/invoices');
```

#### Step 3: Configure Log Levels

Set log level via environment variable:

```bash
# .env.local
LOG_LEVEL=info  # trace, debug, info, warn, error, fatal
LOG_PRETTY=true # Pretty print logs in development
```

#### Step 4: View Logs

**Local Development:**
```bash
npm run dev
# Logs appear in terminal with colors
```

**Production (Vercel):**
1. Go to Vercel Dashboard
2. Select your project
3. Navigate to **Logs** tab
4. Filter by log level, time range, etc.

**Production (Self-hosted):**
```bash
# Stream logs
docker logs -f invoice-app-container

# Search logs
grep "ERROR" /var/log/invoice-app.log

# View recent logs
tail -f /var/log/invoice-app.log
```

### 4. Alerting Configuration

Multi-channel alerting for critical issues.

#### Slack Integration

1. **Create Slack App:**
   - Go to [api.slack.com/apps](https://api.slack.com/apps)
   - Click **Create New App** → **From scratch**
   - Name: "Invoice App Monitoring"

2. **Enable Incoming Webhooks:**
   - Navigate to **Incoming Webhooks**
   - Toggle **Activate Incoming Webhooks** ON
   - Click **Add New Webhook to Workspace**
   - Select channel (e.g., `#alerts`)
   - Copy the webhook URL

3. **Configure Environment Variable:**
   ```bash
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

4. **Test Slack Integration:**
   ```bash
   curl -X POST -H 'Content-type: application/json' \
     --data '{"text":"Test alert from Invoice App"}' \
     $SLACK_WEBHOOK_URL
   ```

#### Sentry Alerts

1. **Configure Alert Rules:**
   - Go to Sentry Dashboard
   - Navigate to **Alerts** → **Create Alert**
   - Choose conditions (e.g., error spike, new issue)
   - Select actions (email, Slack, webhook)

2. **Recommended Alert Rules:**
   - **High Error Rate**: > 5% errors in 5 minutes
   - **New Issue**: First occurrence of a new error
   - **Issue Regression**: Previously resolved issue returns
   - **Performance Degradation**: P95 response time > 2 seconds

3. **Connect Slack:**
   - In Sentry, go to **Settings** → **Integrations**
   - Find **Slack** and click **Add to Slack**
   - Authorize the integration
   - Select channels for alerts

#### Email Alerts

Configure email recipients in `alerting.config.yml`:

```yaml
notification_channels:
  email:
    enabled: true
    recipients:
      critical:
        - ops@yourcompany.com
        - cto@yourcompany.com
      high:
        - dev-team@yourcompany.com
      medium:
        - dev-team@yourcompany.com
```

#### PagerDuty Integration (Optional)

For on-call rotations and escalation:

1. **Create PagerDuty Account:**
   - Go to [pagerduty.com](https://www.pagerduty.com)
   - Set up services and escalation policies

2. **Get Integration Key:**
   - Create a service for Invoice App
   - Use **Events API v2** integration
   - Copy the integration key

3. **Configure Environment Variable:**
   ```bash
   PAGERDUTY_INTEGRATION_KEY=your_pagerduty_integration_key
   ```

4. **Test PagerDuty:**
   ```bash
   curl -X POST https://events.pagerduty.com/v2/enqueue \
     -H 'Content-Type: application/json' \
     -d '{
       "routing_key": "your_integration_key",
       "event_action": "trigger",
       "payload": {
         "summary": "Test alert from Invoice App",
         "severity": "error",
         "source": "invoice-app"
       }
     }'
   ```

### 5. Uptime Monitoring

Monitor application availability and response times.

#### Option 1: Vercel Monitoring (Built-in)

Vercel automatically monitors your deployments.

1. **View Uptime:**
   - Vercel Dashboard → Project → Analytics
   - See uptime percentage and response times

2. **Configure Alerts:**
   - Project Settings → Notifications
   - Enable deployment failure alerts
   - Enable downtime alerts

#### Option 2: UptimeRobot (Free)

1. **Create Account:**
   - Go to [uptimerobot.com](https://uptimerobot.com)
   - Sign up for free account (50 monitors)

2. **Create Monitors:**
   - Add new monitor: `https://client.yourcompany.com`
   - Monitor type: HTTP(s)
   - Interval: 5 minutes
   - Alert when down for: 2 minutes

3. **Configure Alerts:**
   - Add alert contacts (email, SMS, Slack)
   - Choose notification preferences

4. **Get API Key:**
   - Settings → API Settings
   - Copy the Read-Only API Key

5. **Configure Environment Variable:**
   ```bash
   UPTIME_ROBOT_API_KEY=your_api_key
   ```

#### Option 3: Custom Health Checks

Create health check endpoints in your apps:

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'operational',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Service unavailable',
      },
      { status: 503 }
    );
  }
}
```

Then monitor this endpoint with any uptime service.

## Usage Guide

### Tracking Custom Events

```typescript
import analytics from '@invoice-app/analytics';

// Track business events
analytics.invoice.created('inv-123', {
  amount: 1000,
  currency: 'USD',
  customerType: 'enterprise',
});

// Track feature usage
analytics.trackFeatureUsage('pdf-export', {
  page: '/invoices',
  format: 'pdf',
});

// Track searches
analytics.trackSearch('customer:acme', 5, {
  filters: ['status:active'],
});

// Track errors
analytics.trackError(error, 'invoice-creation', {
  step: 'validation',
});
```

### Logging Best Practices

```typescript
import { logger } from '@invoice-app/logger';

// Use appropriate log levels
logger.trace('Entering function', { params });  // Detailed debugging
logger.debug('Processing invoice', { id });     // Debug information
logger.info('Invoice created', { id, amount }); // Important events
logger.warn('Slow query detected', { duration }); // Warnings
logger.error('Failed to send email', { error }); // Errors
logger.fatal('Database connection lost', { error }); // Critical errors

// Add context to logs
const requestLogger = logger.child({
  requestId: req.id,
  userId: user.id,
});

requestLogger.info('Processing request');
```

### Capturing Errors in Sentry

```typescript
import * as Sentry from '@sentry/nextjs';

// Capture exceptions
try {
  await createInvoice(data);
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      feature: 'invoices',
      action: 'create',
    },
    extra: {
      invoiceData: data,
    },
  });
  throw error;
}

// Capture messages
Sentry.captureMessage('Unusual activity detected', {
  level: 'warning',
  tags: {
    userId: user.id,
  },
});

// Add breadcrumbs
Sentry.addBreadcrumb({
  category: 'invoice',
  message: 'User started creating invoice',
  level: 'info',
});

// Set user context
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});
```

### Using Error Boundaries

```tsx
import { ErrorBoundary } from '@/components/error-boundary';

// Wrap components that might error
<ErrorBoundary>
  <InvoiceForm />
</ErrorBoundary>

// Custom fallback UI
<ErrorBoundary
  fallback={
    <div>
      <h2>Oops! Something went wrong.</h2>
      <button onClick={() => window.location.reload()}>
        Reload
      </button>
    </div>
  }
>
  <ComplexComponent />
</ErrorBoundary>

// Handle errors programmatically
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Custom error handling
    console.error('Boundary caught:', error);
    // Send to analytics
    analytics.trackError(error, 'error-boundary');
  }}
>
  <YourComponent />
</ErrorBoundary>
```

## Dashboard Access

### Sentry Dashboard

**URL:** `https://sentry.io/organizations/your-org/`

**Key Features:**
- **Issues**: All errors and exceptions
- **Performance**: Transaction traces and slow queries
- **Releases**: Track errors by deployment
- **Alerts**: Configure and view alerts
- **Discover**: Query error data with SQL-like syntax

**Useful Views:**
- Issues by frequency
- Issues by affected users
- Performance bottlenecks
- Error trends over time

### Vercel Analytics

**URL:** `https://vercel.com/your-team/project/analytics`

**Key Features:**
- **Audience**: User demographics and devices
- **Top Pages**: Most visited pages
- **Top Referrers**: Traffic sources
- **Speed Insights**: Core Web Vitals

**Metrics:**
- Page views
- Unique visitors
- Bounce rate
- Average session duration
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)

### Vercel Logs

**URL:** `https://vercel.com/your-team/project/logs`

**Features:**
- Real-time log streaming
- Filter by deployment, function, log level
- Search logs
- Export logs

**Tips:**
- Use filters to narrow down logs
- Search for error messages
- Check logs around deployment time
- Monitor API route logs

## Alert Response Procedures

### Critical Alerts (Service Down)

**Priority:** P1 - Immediate Response Required

**Response Steps:**
1. **Acknowledge** the alert immediately
2. **Assess** the scope:
   - Check Vercel dashboard for deployment status
   - Check Sentry for error spike
   - Check uptime monitor for downtime
3. **Notify** stakeholders on `#incidents` Slack channel
4. **Investigate** root cause:
   - Check recent deployments
   - Review error logs
   - Check database connectivity
5. **Resolve**:
   - Rollback deployment if needed
   - Fix the issue
   - Deploy fix
6. **Verify** service is restored
7. **Document** incident in post-mortem

**Escalation:**
- If not resolved in 15 minutes, escalate to senior engineer
- If not resolved in 30 minutes, escalate to CTO

### High Priority Alerts (Error Spike)

**Priority:** P2 - Response within 30 minutes

**Response Steps:**
1. **Acknowledge** alert
2. **Identify** the error:
   - Check Sentry for error details
   - Identify affected feature/page
3. **Assess** impact:
   - Number of affected users
   - Severity of error
   - Workaround available?
4. **Fix** or **mitigate**:
   - Deploy hotfix if critical
   - Enable feature flag to disable feature
   - Add error handling to prevent user impact
5. **Monitor** error rate after fix
6. **Update** alert status

### Medium Priority Alerts (Performance Degradation)

**Priority:** P3 - Response within 2 hours

**Response Steps:**
1. **Review** performance metrics
2. **Identify** slow endpoints/pages
3. **Investigate** cause:
   - Database query optimization needed?
   - API rate limiting?
   - Resource constraints?
4. **Plan** optimization:
   - Schedule optimization work
   - Add caching if appropriate
   - Optimize queries
5. **Track** improvement after changes

### Low Priority Alerts (Warnings)

**Priority:** P4 - Review during business hours

**Response Steps:**
1. **Review** the warning
2. **Assess** if action needed
3. **Create** ticket if needed
4. **Schedule** fix in sprint

## Troubleshooting

### Sentry Not Capturing Errors

**Problem:** Errors not appearing in Sentry dashboard.

**Solutions:**

1. **Check DSN is set:**
   ```bash
   echo $NEXT_PUBLIC_SENTRY_DSN
   ```

2. **Verify Sentry is initialized:**
   ```typescript
   import * as Sentry from '@sentry/nextjs';
   console.log('Sentry initialized:', !!Sentry.getCurrentHub().getClient());
   ```

3. **Check environment:**
   - Sentry is disabled by default in development
   - Set `SENTRY_ENABLED=true` to test locally

4. **Verify error is being thrown:**
   ```typescript
   Sentry.captureException(new Error('Test error'));
   ```

5. **Check source maps:**
   - Ensure `SENTRY_AUTH_TOKEN` is set for uploads
   - Check build logs for source map upload status

### Analytics Not Tracking Events

**Problem:** Custom events not appearing in Vercel Analytics.

**Solutions:**

1. **Check environment:**
   ```bash
   echo $NEXT_PUBLIC_ANALYTICS_ENABLED
   ```

2. **Verify Analytics component is mounted:**
   ```tsx
   <Analytics />  // Should be in root layout
   ```

3. **Check event name format:**
   - Event names should be lowercase with underscores
   - Example: `invoice_created`, not `invoiceCreated`

4. **Test in production:**
   - Analytics may not work in development
   - Deploy to preview environment to test

### Logs Not Appearing

**Problem:** Application logs not showing up.

**Solutions:**

1. **Check log level:**
   ```bash
   echo $LOG_LEVEL
   ```
   - Ensure level allows the log (e.g., `debug` shows more than `info`)

2. **Verify logger is imported:**
   ```typescript
   import { logger } from '@invoice-app/logger';
   ```

3. **Check Vercel logs:**
   - Logs may take a few seconds to appear
   - Filter by function and log level

4. **Verify no errors in logger:**
   ```typescript
   try {
     logger.info('Test log');
   } catch (error) {
     console.error('Logger error:', error);
   }
   ```

### Alerts Not Triggering

**Problem:** Expected alerts not being sent.

**Solutions:**

1. **Check webhook URLs:**
   ```bash
   echo $SLACK_WEBHOOK_URL
   ```

2. **Test webhook manually:**
   ```bash
   curl -X POST $SLACK_WEBHOOK_URL \
     -H 'Content-Type: application/json' \
     -d '{"text": "Test alert"}'
   ```

3. **Verify alert thresholds:**
   - Check `alerting.config.yml` for threshold values
   - Ensure threshold is being exceeded

4. **Check Sentry alert rules:**
   - Go to Sentry → Alerts
   - Verify rules are active
   - Check alert history

5. **Review alert suppression:**
   - Check if in maintenance window
   - Verify dedupe settings

## Best Practices

### Error Handling

1. **Always log errors** before throwing:
   ```typescript
   try {
     await riskyOperation();
   } catch (error) {
     logger.error('Operation failed', { error });
     Sentry.captureException(error);
     throw error;
   }
   ```

2. **Add context to errors**:
   ```typescript
   Sentry.captureException(error, {
     tags: { feature: 'invoices', action: 'create' },
     extra: { userId: user.id, data },
   });
   ```

3. **Use error boundaries** for UI components
4. **Don't swallow errors** silently
5. **Provide user-friendly error messages**

### Logging

1. **Use appropriate log levels**:
   - `trace`: Very detailed debugging
   - `debug`: Debugging information
   - `info`: Important events (default)
   - `warn`: Warnings that need attention
   - `error`: Errors that need fixing
   - `fatal`: Critical errors requiring immediate action

2. **Log structured data**:
   ```typescript
   // Good
   logger.info('Invoice created', { invoiceId, amount, userId });

   // Bad
   logger.info(`Invoice ${invoiceId} created for ${amount}`);
   ```

3. **Never log sensitive data**:
   - Passwords
   - API keys
   - Credit card numbers
   - Personal information (PII)

4. **Add request context**:
   ```typescript
   const reqLogger = logger.child({
     requestId: req.id,
     userId: user.id,
     ip: req.ip,
   });
   ```

### Analytics

1. **Track important business events**:
   - User sign-ups
   - Feature usage
   - Conversions (invoice sent, payment received)

2. **Don't track PII**:
   - Filter out email addresses
   - Don't track personal information
   - Anonymize user IDs if possible

3. **Use consistent event names**:
   - Follow naming convention: `entity_action`
   - Examples: `invoice_created`, `customer_deleted`

4. **Add useful properties**:
   ```typescript
   analytics.invoice.created(invoiceId, {
     amount: total,
     currency: 'USD',
     customerType: 'enterprise',
     paymentMethod: 'card',
   });
   ```

### Monitoring

1. **Set up alerts for critical paths**:
   - User authentication
   - Invoice creation/sending
   - Payment processing

2. **Monitor business metrics**:
   - Number of invoices created per day
   - Average response time
   - Error rate by endpoint

3. **Regular dashboard reviews**:
   - Daily: Check for new errors
   - Weekly: Review performance trends
   - Monthly: Analyze long-term patterns

4. **Keep dashboards organized**:
   - Create separate views for different teams
   - Use tags to categorize issues
   - Set up saved searches for common queries

### Performance

1. **Set performance budgets**:
   - LCP < 2.5s
   - FID < 100ms
   - CLS < 0.1

2. **Monitor Core Web Vitals**:
   - Check Speed Insights weekly
   - Address performance regressions immediately

3. **Track slow API endpoints**:
   ```typescript
   const start = Date.now();
   const result = await apiCall();
   const duration = Date.now() - start;

   if (duration > 1000) {
     logger.warn('Slow API call', { endpoint, duration });
     analytics.trackSlowApiResponse(endpoint, duration);
   }
   ```

4. **Set up performance alerts**:
   - P95 response time > 2s
   - P99 response time > 5s

### Security

1. **Monitor failed login attempts**:
   ```typescript
   if (loginFailed) {
     logger.warn('Failed login attempt', { email, ip });

     if (attemptCount > 5) {
       Sentry.captureMessage('Multiple failed logins', {
         level: 'warning',
         tags: { security: 'auth' },
       });
     }
   }
   ```

2. **Track unusual activity**:
   - Rapid API requests
   - Large data exports
   - Unusual access patterns

3. **Set up security alerts**:
   - Multiple failed logins
   - Unauthorized access attempts
   - Rate limit violations

## Additional Resources

### Documentation

- [Sentry Documentation](https://docs.sentry.io/)
- [Vercel Analytics Documentation](https://vercel.com/docs/analytics)
- [Pino Documentation](https://getpino.io/)
- [Next.js Instrumentation](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation)

### Configuration Files

- `sentry.config.js` - Shared Sentry configuration
- `vercel-analytics.config.ts` - Analytics configuration
- `alerting.config.yml` - Alert rules and channels
- `uptime.config.yml` - Uptime monitoring configuration
- `.env.monitoring.example` - Environment variable template

### Support

For questions or issues:
- Check this documentation first
- Review Sentry/Vercel documentation
- Contact DevOps team on Slack: `#devops`
- Create ticket in issue tracker

## Maintenance

### Regular Tasks

**Daily:**
- Review new errors in Sentry
- Check for alert notifications
- Monitor uptime status

**Weekly:**
- Review performance metrics
- Check for trends in error rates
- Review and triage unresolved issues

**Monthly:**
- Review alert configurations
- Update alert thresholds if needed
- Clean up resolved issues
- Review logs retention policy

### Updating Configuration

When updating monitoring configuration:

1. **Test in development first**
2. **Deploy to preview environment**
3. **Verify monitoring works**
4. **Deploy to production**
5. **Monitor for issues**
6. **Document changes**

### Adding New Monitors

To add a new monitor:

1. **Identify what to monitor**:
   - New feature
   - New API endpoint
   - New business metric

2. **Choose monitoring type**:
   - Error tracking (Sentry)
   - Performance monitoring (Vercel)
   - Custom logging
   - Uptime monitoring

3. **Implement monitoring**:
   - Add instrumentation code
   - Configure alerts
   - Set up dashboards

4. **Test monitoring**:
   - Trigger test events
   - Verify alerts fire
   - Check dashboard displays data

5. **Document**:
   - Update this guide
   - Add to runbook
   - Train team members

---

**Last Updated:** 2025-11-11
**Version:** 1.0
**Maintained by:** DevOps Team
