# Monitoring Quick Start Guide

Get your monitoring stack up and running in 30 minutes.

## Prerequisites

- Vercel account (for deployment and analytics)
- Sentry account (for error tracking)
- Slack workspace (for alerts)

## 5-Step Setup

### Step 1: Sentry Setup (10 minutes)

1. **Create Sentry account** at [sentry.io](https://sentry.io)

2. **Create two projects:**
   - `client-portal` (Platform: Next.js)
   - `admin-dashboard` (Platform: Next.js)

3. **Get DSN from each project:**
   - Settings → Projects → [Project] → Client Keys (DSN)
   - Copy the DSN URL

4. **Generate auth token:**
   - Settings → Account → API → Auth Tokens
   - Create token with `project:releases` and `org:read` scopes
   - Copy the token

5. **Set environment variables in Vercel:**
   ```bash
   # For both client-portal and admin-dashboard
   NEXT_PUBLIC_SENTRY_DSN=https://key@org.ingest.sentry.io/id
   SENTRY_ORG=your-org-slug
   SENTRY_PROJECT=client-portal  # or admin-dashboard
   SENTRY_AUTH_TOKEN=sntrys_your_token
   ```

### Step 2: Vercel Analytics (5 minutes)

1. **Enable Analytics:**
   - Go to Vercel dashboard
   - Select project → Analytics tab
   - Click "Enable Analytics"

2. **Enable Speed Insights:**
   - Same Analytics tab
   - Enable "Speed Insights"

3. **Install packages:**
   ```bash
   cd src/apps/client-portal
   npm install @vercel/analytics @vercel/speed-insights

   cd ../admin-dashboard
   npm install @vercel/analytics @vercel/speed-insights
   ```

4. **Add to layout:**
   ```tsx
   // app/layout.tsx
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

### Step 3: Slack Alerts (5 minutes)

1. **Create Slack app:**
   - Go to [api.slack.com/apps](https://api.slack.com/apps)
   - Create New App → From scratch
   - Name: "Invoice App Monitoring"

2. **Enable Incoming Webhooks:**
   - Incoming Webhooks → Activate
   - Add New Webhook to Workspace
   - Select `#alerts` channel
   - Copy webhook URL

3. **Set environment variable:**
   ```bash
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

4. **Test:**
   ```bash
   curl -X POST $SLACK_WEBHOOK_URL \
     -H 'Content-Type: application/json' \
     -d '{"text":"Monitoring is live!"}'
   ```

### Step 4: Sentry Alerts (5 minutes)

1. **Connect Slack to Sentry:**
   - Sentry → Settings → Integrations
   - Find Slack → Add to Slack
   - Authorize and select channels

2. **Create alert rules:**
   - Sentry → Alerts → Create Alert Rule
   - Configure these alerts:
     - **High Error Rate**: > 5% errors in 5 minutes
     - **New Issue**: First occurrence of error
     - **Performance Degradation**: P95 > 2 seconds

### Step 5: Install Dependencies (5 minutes)

1. **Install Sentry SDK:**
   ```bash
   cd src/apps/client-portal
   npm install @sentry/nextjs

   cd ../admin-dashboard
   npm install @sentry/nextjs
   ```

2. **Install logger dependencies:**
   ```bash
   cd src/packages/logger
   npm install pino pino-pretty
   ```

3. **Install analytics dependencies:**
   ```bash
   cd src/packages/analytics
   npm install @vercel/analytics @vercel/speed-insights
   ```

4. **Build and deploy:**
   ```bash
   cd ../../../../
   npm run build
   git add .
   git commit -m "Add monitoring and error tracking"
   git push
   ```

## Verify Setup

### 1. Check Sentry

Trigger a test error:

```typescript
// In any page component
import * as Sentry from '@sentry/nextjs';

Sentry.captureException(new Error('Test error - monitoring works!'));
```

Visit Sentry dashboard - you should see the error appear within seconds.

### 2. Check Vercel Analytics

- Deploy your app to Vercel
- Visit a few pages
- Go to Vercel Dashboard → Analytics
- Should see page views within a few minutes

### 3. Check Logs

View logs in Vercel:
- Vercel Dashboard → Project → Logs
- Should see application logs

### 4. Check Alerts

- Go to Sentry → Alerts
- Should see configured alert rules
- Check Slack channel for test message

## Next Steps

1. **Review dashboards:**
   - [Sentry Dashboard](https://sentry.io)
   - [Vercel Analytics](https://vercel.com/dashboard)
   - [Vercel Logs](https://vercel.com/dashboard)

2. **Configure uptime monitoring:**
   - Set up [UptimeRobot](https://uptimerobot.com) (free)
   - Monitor your production URLs

3. **Read full documentation:**
   - See `MONITORING.md` for complete guide
   - Learn about logging, custom events, and best practices

4. **Set up health checks:**
   - Create `/api/health` endpoints
   - Monitor with uptime service

## Common Issues

### Sentry errors not appearing

**Solution:** Check that `NEXT_PUBLIC_SENTRY_DSN` is set in Vercel environment variables.

### Analytics not tracking

**Solution:** Ensure `<Analytics />` component is in your root layout.

### Slack alerts not working

**Solution:** Verify webhook URL is correct and test with curl.

### Logs not showing

**Solution:** Check Vercel logs tab - may take a few seconds to appear.

## Support

- Full documentation: `MONITORING.md`
- Configuration files: `sentry.config.js`, `alerting.config.yml`
- Environment template: `.env.monitoring.example`

---

**Setup Time:** ~30 minutes
**Difficulty:** Easy
**Last Updated:** 2025-11-11
