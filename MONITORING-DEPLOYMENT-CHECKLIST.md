# Monitoring Deployment Checklist

Use this checklist to ensure monitoring is properly set up and working in production.

## Pre-Deployment

### 1. Install Dependencies

- [ ] Install Sentry SDK in client-portal
  ```bash
  cd src/apps/client-portal
  npm install @sentry/nextjs
  ```

- [ ] Install Sentry SDK in admin-dashboard
  ```bash
  cd src/apps/admin-dashboard
  npm install @sentry/nextjs
  ```

- [ ] Install logger dependencies
  ```bash
  cd src/packages/logger
  npm install pino pino-pretty
  ```

- [ ] Install analytics dependencies
  ```bash
  cd src/packages/analytics
  npm install @vercel/analytics @vercel/speed-insights
  ```

- [ ] Run `npm install` in root to link workspaces
  ```bash
  cd /path/to/invoicingapp
  npm install
  ```

### 2. Sentry Setup

- [ ] Create Sentry account at https://sentry.io
- [ ] Create organization
- [ ] Create `client-portal` project
- [ ] Create `admin-dashboard` project
- [ ] Copy DSN from client-portal project
- [ ] Copy DSN from admin-dashboard project
- [ ] Generate auth token with `project:releases` and `org:read` scopes
- [ ] Save Sentry organization slug

### 3. Slack Setup (Optional but Recommended)

- [ ] Go to https://api.slack.com/apps
- [ ] Create new Slack app
- [ ] Enable Incoming Webhooks
- [ ] Add webhook to `#alerts` channel
- [ ] Copy webhook URL
- [ ] Test webhook with curl

### 4. Environment Variables

#### Client Portal

- [ ] Set `NEXT_PUBLIC_SENTRY_DSN` in Vercel
- [ ] Set `SENTRY_ORG` in Vercel
- [ ] Set `SENTRY_PROJECT=client-portal` in Vercel
- [ ] Set `SENTRY_AUTH_TOKEN` in Vercel
- [ ] Set `SLACK_WEBHOOK_URL` in Vercel (optional)

#### Admin Dashboard

- [ ] Set `NEXT_PUBLIC_SENTRY_DSN` in Vercel
- [ ] Set `SENTRY_ORG` in Vercel
- [ ] Set `SENTRY_PROJECT=admin-dashboard` in Vercel
- [ ] Set `SENTRY_AUTH_TOKEN` in Vercel
- [ ] Set `SLACK_WEBHOOK_URL` in Vercel (optional)

### 5. Code Integration

#### Client Portal

- [ ] Add Analytics component to `app/layout.tsx`
  ```tsx
  import { Analytics } from '@vercel/analytics/react';
  import { SpeedInsights } from '@vercel/speed-insights/react';
  ```

- [ ] Verify error boundaries are in place
  - [ ] `app/error.tsx` exists
  - [ ] `app/global-error.tsx` exists
  - [ ] `components/error-boundary.tsx` exists

#### Admin Dashboard

- [ ] Add Analytics component to `app/layout.tsx`
  ```tsx
  import { Analytics } from '@vercel/analytics/react';
  import { SpeedInsights } from '@vercel/speed-insights/react';
  ```

- [ ] Verify error boundaries are in place
  - [ ] `app/error.tsx` exists
  - [ ] `app/global-error.tsx` exists
  - [ ] `components/error-boundary.tsx` exists

### 6. Build Test

- [ ] Build both apps locally
  ```bash
  npm run build
  ```

- [ ] Check for build errors
- [ ] Verify source maps are generated
- [ ] Check build output size

## Deployment

### 1. Deploy to Vercel

- [ ] Commit all changes
  ```bash
  git add .
  git commit -m "Add monitoring and error tracking"
  ```

- [ ] Push to repository
  ```bash
  git push origin main
  ```

- [ ] Wait for Vercel deployment to complete
- [ ] Check deployment logs for errors

### 2. Verify Sentry Integration

- [ ] Trigger test error in client-portal
  ```typescript
  import * as Sentry from '@sentry/nextjs';
  Sentry.captureException(new Error('Test error - client portal'));
  ```

- [ ] Trigger test error in admin-dashboard
  ```typescript
  import * as Sentry from '@sentry/nextjs';
  Sentry.captureException(new Error('Test error - admin dashboard'));
  ```

- [ ] Check Sentry dashboard for both errors
- [ ] Verify source maps are working (stack traces show actual code)
- [ ] Verify error context (environment, release, user)

### 3. Verify Analytics

- [ ] Visit client-portal homepage
- [ ] Navigate to a few pages
- [ ] Check Vercel Analytics dashboard
- [ ] Wait 5-10 minutes for data to appear
- [ ] Verify page views are tracked
- [ ] Check Speed Insights for Core Web Vitals

### 4. Verify Logging

- [ ] Check Vercel logs for client-portal
- [ ] Check Vercel logs for admin-dashboard
- [ ] Verify logs are structured (JSON format)
- [ ] Check logs are filtered (no sensitive data)
- [ ] Test different log levels

### 5. Enable Vercel Analytics

- [ ] Go to Vercel dashboard
- [ ] Select client-portal project
- [ ] Navigate to Analytics tab
- [ ] Click "Enable Analytics"
- [ ] Repeat for admin-dashboard

### 6. Enable Speed Insights

- [ ] In Analytics tab for each project
- [ ] Enable "Speed Insights"
- [ ] Verify it's collecting data

## Post-Deployment

### 1. Configure Sentry Alerts

- [ ] Go to Sentry → Alerts
- [ ] Create "High Error Rate" alert
  - Condition: Error rate > 5% in 5 minutes
  - Actions: Email, Slack notification

- [ ] Create "New Issue" alert
  - Condition: First time seen
  - Actions: Slack notification

- [ ] Create "Performance Degradation" alert
  - Condition: P95 response time > 2 seconds
  - Actions: Slack notification

- [ ] Test alerts by triggering conditions

### 2. Connect Slack to Sentry

- [ ] Go to Sentry → Settings → Integrations
- [ ] Find Slack integration
- [ ] Click "Add to Slack"
- [ ] Authorize and select channels
- [ ] Test integration

### 3. Set Up Uptime Monitoring

#### Option A: UptimeRobot (Recommended)

- [ ] Create account at https://uptimerobot.com
- [ ] Add client-portal monitor
  - URL: https://your-client-portal.vercel.app
  - Type: HTTP(s)
  - Interval: 5 minutes

- [ ] Add admin-dashboard monitor
  - URL: https://your-admin-dashboard.vercel.app
  - Type: HTTP(s)
  - Interval: 5 minutes

- [ ] Add health check monitors
  - URL: https://your-app.vercel.app/api/health
  - Type: HTTP(s)
  - Expected status: 200

- [ ] Configure alert contacts
- [ ] Test by pausing a monitor

#### Option B: Vercel Monitoring

- [ ] Enable deployment notifications in Vercel
- [ ] Set up downtime alerts
- [ ] Configure notification channels

### 4. Create Health Check Endpoints

- [ ] Create `/api/health` route in client-portal
- [ ] Create `/api/health` route in admin-dashboard
- [ ] Test health checks return 200 OK
- [ ] Add database connectivity check
- [ ] Add external service checks (email, etc.)

### 5. Dashboard Setup

- [ ] Bookmark Sentry dashboard
- [ ] Bookmark Vercel Analytics
- [ ] Bookmark Vercel Logs
- [ ] Bookmark uptime monitor dashboard
- [ ] Create team access accounts
- [ ] Set up mobile notifications

## Verification Tests

### 1. Error Tracking Test

- [ ] Trigger 500 error in API route
- [ ] Verify error appears in Sentry within 30 seconds
- [ ] Check error details (stack trace, context)
- [ ] Verify alert is sent (if configured)
- [ ] Resolve error in Sentry
- [ ] Trigger same error again
- [ ] Verify it's marked as regression

### 2. Performance Monitoring Test

- [ ] Navigate through all major pages
- [ ] Check Sentry Performance tab
- [ ] Verify transactions are recorded
- [ ] Check transaction details
- [ ] Verify slow operations are highlighted

### 3. Analytics Test

- [ ] Perform key user actions:
  - [ ] Sign in
  - [ ] Create invoice
  - [ ] View customer list
  - [ ] Export data

- [ ] Wait 5-10 minutes
- [ ] Check Vercel Analytics
- [ ] Verify events are tracked
- [ ] Check custom events (if implemented)

### 4. Logging Test

- [ ] Perform API requests
- [ ] Check Vercel logs
- [ ] Verify request/response logs
- [ ] Verify log structure (JSON)
- [ ] Check sensitive data is filtered
- [ ] Test log search and filtering

### 5. Alert Test

- [ ] Trigger test alert in Slack
- [ ] Verify alert appears in correct channel
- [ ] Verify alert format is correct
- [ ] Test alert for each severity level
- [ ] Verify email alerts work (if configured)

### 6. Uptime Test

- [ ] Wait for uptime monitor to check
- [ ] Verify monitor shows "Up" status
- [ ] Check response time metrics
- [ ] Test downtime alert (optional - pause monitor)
- [ ] Verify uptime percentage calculation

## Final Checks

### Documentation

- [ ] Review MONITORING.md
- [ ] Review MONITORING-QUICK-START.md
- [ ] Review ISSUE-26-IMPLEMENTATION.md
- [ ] Update team wiki with setup instructions
- [ ] Add monitoring links to README

### Team Training

- [ ] Schedule monitoring overview session
- [ ] Walk through dashboards
- [ ] Demonstrate alert response procedures
- [ ] Review troubleshooting guide
- [ ] Share access credentials securely

### Runbook

- [ ] Document alert response procedures
- [ ] Create incident response template
- [ ] Define escalation paths
- [ ] Set up on-call rotation (if applicable)
- [ ] Document common issues and solutions

### Monitoring the Monitoring

- [ ] Set up weekly monitoring review
- [ ] Schedule monthly dashboard review
- [ ] Plan quarterly monitoring improvements
- [ ] Set up alerts for monitoring failures
- [ ] Document monitoring costs and quotas

## Ongoing Maintenance

### Daily

- [ ] Check Sentry for new errors
- [ ] Review critical alerts
- [ ] Monitor uptime status

### Weekly

- [ ] Review error trends
- [ ] Check performance metrics
- [ ] Review alert effectiveness
- [ ] Clean up resolved issues

### Monthly

- [ ] Review monitoring costs
- [ ] Analyze long-term trends
- [ ] Update alert thresholds
- [ ] Review and update documentation
- [ ] Team retrospective on monitoring

### Quarterly

- [ ] Review SLA compliance
- [ ] Analyze incident patterns
- [ ] Update monitoring strategy
- [ ] Review and optimize alert rules
- [ ] Plan monitoring improvements

## Rollback Plan

If monitoring causes issues:

### 1. Quick Disable

- [ ] Remove environment variables:
  ```bash
  # In Vercel, remove:
  NEXT_PUBLIC_SENTRY_DSN
  SENTRY_AUTH_TOKEN
  ```

- [ ] Comment out Analytics components:
  ```tsx
  // <Analytics />
  // <SpeedInsights />
  ```

- [ ] Redeploy

### 2. Partial Rollback

- [ ] Keep error tracking, disable analytics
- [ ] Disable session replay (adjust sample rate to 0)
- [ ] Reduce performance monitoring (sample rate to 0.1)
- [ ] Disable specific integrations

### 3. Full Rollback

- [ ] Revert to previous git commit
- [ ] Remove Sentry configuration files
- [ ] Remove analytics components
- [ ] Redeploy
- [ ] Document issues for investigation

## Success Criteria

Monitoring is successfully deployed when:

- ✅ All dependencies installed without errors
- ✅ Both apps build successfully
- ✅ Sentry captures errors from both apps
- ✅ Source maps work (readable stack traces)
- ✅ Vercel Analytics tracks page views
- ✅ Speed Insights shows Core Web Vitals
- ✅ Logs appear in Vercel dashboard
- ✅ Alerts fire correctly (test alerts work)
- ✅ Uptime monitors show "Up" status
- ✅ No increase in error rates after deployment
- ✅ No significant performance degradation
- ✅ Team can access all dashboards
- ✅ Documentation is complete and accessible

## Troubleshooting

### Build Fails

**Issue:** Build fails with Sentry errors

**Solution:**
```bash
# Temporarily disable Sentry in build
export SENTRY_DISABLED=true
npm run build
```

### Source Maps Not Working

**Issue:** Stack traces show minified code

**Solution:**
- Verify `SENTRY_AUTH_TOKEN` is set
- Check build logs for upload errors
- Ensure token has correct permissions

### Analytics Not Tracking

**Issue:** No data in Vercel Analytics

**Solution:**
- Verify Analytics is enabled in Vercel dashboard
- Check `<Analytics />` component is mounted
- Wait 10-15 minutes for data to appear
- Test in incognito mode (ad blockers may interfere)

### Alerts Not Firing

**Issue:** Expected alerts not received

**Solution:**
- Test webhook URL manually with curl
- Check Sentry alert rules are active
- Verify alert thresholds are being exceeded
- Check notification channel settings

## Contact Information

**Primary Contact:** DevOps Team
**Slack Channel:** #devops
**Email:** devops@yourcompany.com
**On-Call:** See PagerDuty rotation

**Sentry Support:** https://sentry.io/support/
**Vercel Support:** https://vercel.com/support

---

**Checklist Version:** 1.0
**Last Updated:** 2025-11-11
**Next Review:** After first production deployment
