# Vercel Deployment Guide

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Architecture](#architecture)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Database Setup](#database-setup)
- [Clerk Authentication Setup](#clerk-authentication-setup)
- [Email Service Setup](#email-service-setup)
- [Vercel Project Setup](#vercel-project-setup)
  - [Client Portal Setup](#client-portal-setup)
  - [Admin Dashboard Setup](#admin-dashboard-setup)
- [Environment Variables Configuration](#environment-variables-configuration)
- [Domain Configuration](#domain-configuration)
- [Build Configuration](#build-configuration)
- [Database Migration](#database-migration)
- [Post-Deployment Verification](#post-deployment-verification)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedure](#rollback-procedure)

---

## Overview

This guide provides step-by-step instructions for deploying both applications (Client Portal and Admin Dashboard) to Vercel. The applications are part of a monorepo structure and share common packages.

**Architecture:**
- **Client Portal** (Port 3001 in dev): Customer-facing invoice viewing application
- **Admin Dashboard** (Port 3002 in dev): Internal invoice management and administration
- **Shared Database**: Both apps connect to the same production database
- **Separate Auth**: Each app has its own Clerk authentication instance for security isolation

---

## Prerequisites

Before starting the deployment process, ensure you have:

### Required Accounts
- [ ] Vercel account (https://vercel.com/signup)
- [ ] GitHub/GitLab/Bitbucket repository with the code
- [ ] Clerk account (https://clerk.com/sign-up) - for authentication
- [ ] Database provider account (PostgreSQL recommended):
  - [ ] Vercel Postgres, OR
  - [ ] Supabase, OR
  - [ ] Railway, OR
  - [ ] PlanetScale (MySQL)
- [ ] Resend account (https://resend.com/signup) - for email service

### Local Requirements
- [ ] Node.js 18+ installed
- [ ] npm or yarn package manager
- [ ] Git repository initialized
- [ ] Code pushed to remote repository
- [ ] All features tested locally

### Access Required
- [ ] Admin access to Vercel account
- [ ] Repository access (owner or admin)
- [ ] Domain registrar access (for custom domains)
- [ ] DNS management access

---

## Architecture

### Monorepo Structure
```
invoicingapp/
├── src/
│   ├── apps/
│   │   ├── client-portal/         # Vercel Project 1
│   │   │   ├── vercel.json
│   │   │   └── .env.production.example
│   │   └── admin-dashboard/       # Vercel Project 2
│   │       ├── vercel.json
│   │       └── .env.production.example
│   └── packages/
│       ├── database/              # Shared database package
│       ├── auth/                  # Shared auth utilities
│       └── email/                 # Shared email service
├── turbo.json                     # Turborepo configuration
└── package.json                   # Root workspace configuration
```

### Deployment Architecture
```
┌─────────────────────┐
│   Vercel Project 1  │
│   Client Portal     │──┐
│   portal.domain.com │  │
└─────────────────────┘  │
                         │    ┌──────────────────┐
                         ├────│  Shared Database │
                         │    │  (PostgreSQL)    │
┌─────────────────────┐  │    └──────────────────┘
│   Vercel Project 2  │  │
│   Admin Dashboard   │──┘
│   admin.domain.com  │
└─────────────────────┘
```

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All features implemented and tested
- [ ] Build runs successfully locally: `npm run build`
- [ ] No TypeScript errors
- [ ] No ESLint errors (critical ones fixed)
- [ ] All tests passing (if applicable)

### Database
- [ ] Database schema finalized
- [ ] Migrations created and tested
- [ ] Seed data prepared (if needed)
- [ ] Backup strategy defined

### Security
- [ ] Environment variables documented
- [ ] No secrets in code repository
- [ ] API routes secured
- [ ] Rate limiting configured (if needed)
- [ ] CORS policies configured

### Third-Party Services
- [ ] Clerk applications created (2 separate apps)
- [ ] Database instance provisioned
- [ ] Resend account set up and domain verified
- [ ] Email templates tested

---

## Database Setup

### Step 1: Choose Database Provider

We recommend PostgreSQL for production. Choose one:

#### Option A: Vercel Postgres (Recommended)
1. Go to Vercel Dashboard > Storage > Create Database
2. Select "Postgres"
3. Choose region (same as your Vercel apps)
4. Copy the `DATABASE_URL` connection string

#### Option B: Supabase
1. Go to https://supabase.com/dashboard
2. Create new project
3. Wait for database provisioning (~2 minutes)
4. Go to Project Settings > Database
5. Copy the connection string (Transaction pooler recommended)
6. Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`

#### Option C: Railway
1. Go to https://railway.app/dashboard
2. Create new project > Add PostgreSQL
3. Copy the `DATABASE_URL` from database variables

#### Option D: PlanetScale (MySQL)
1. Go to https://app.planetscale.com/
2. Create new database
3. Note: You'll need to modify Prisma schema for MySQL compatibility
4. Copy the connection string

### Step 2: Configure Connection Pooling

For production, enable connection pooling:

**Vercel Postgres**: Automatically configured

**Supabase**: Use the "Transaction" or "Session" pooler URL:
```
postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres
```

**Railway**: Add `?pgbouncer=true` to connection string

### Step 3: Save Connection String

Keep your `DATABASE_URL` secure. You'll add it to Vercel environment variables later.

Format:
```
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
```

---

## Clerk Authentication Setup

Both apps require separate Clerk applications for security isolation.

### Step 1: Create Clerk Applications

1. Go to https://dashboard.clerk.com/
2. Create **two separate applications**:
   - **Application 1**: "Invoice App - Client Portal"
   - **Application 2**: "Invoice App - Admin Dashboard"

### Step 2: Configure Client Portal Clerk App

1. Select "Invoice App - Client Portal"
2. Go to **API Keys**:
   - Copy `Publishable Key` (starts with `pk_live_`)
   - Copy `Secret Key` (starts with `sk_live_`)
3. Go to **Webhooks** > Add Endpoint:
   - URL: `https://portal.yourdomain.com/api/webhooks/clerk`
   - Subscribe to events: `user.created`, `user.updated`, `user.deleted`
   - Copy the `Signing Secret` (starts with `whsec_`)
4. Go to **Paths**:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - User profile URL: `/user-profile`
   - After sign-in: `/`

### Step 3: Configure Admin Dashboard Clerk App

1. Select "Invoice App - Admin Dashboard"
2. Go to **API Keys**:
   - Copy `Publishable Key` (starts with `pk_live_`)
   - Copy `Secret Key` (starts with `sk_live_`)
3. Go to **Webhooks** > Add Endpoint:
   - URL: `https://admin.yourdomain.com/api/webhooks/clerk`
   - Subscribe to events: `user.created`, `user.updated`, `user.deleted`
   - Copy the `Signing Secret` (starts with `whsec_`)
4. Go to **Organizations** (if using org features):
   - Enable organizations
   - Configure roles: Admin, Manager, Accountant
5. Go to **Paths**:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - User profile URL: `/user-profile`
   - After sign-in: `/`

### Step 4: Save Credentials

Keep these credentials secure for environment variable setup:

**Client Portal:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_XXXXX
CLERK_SECRET_KEY=sk_live_XXXXX
CLERK_WEBHOOK_SECRET=whsec_XXXXX
```

**Admin Dashboard:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YYYYY
CLERK_SECRET_KEY=sk_live_YYYYY
CLERK_WEBHOOK_SECRET=whsec_YYYYY
```

---

## Email Service Setup

### Step 1: Create Resend Account

1. Go to https://resend.com/signup
2. Verify your email address
3. Complete account setup

### Step 2: Verify Domain

1. Go to **Domains** > Add Domain
2. Enter your domain (e.g., `yourdomain.com`)
3. Add DNS records provided by Resend:
   - SPF record (TXT)
   - DKIM record (TXT)
   - DMARC record (TXT)
4. Click "Verify Domain"
5. Wait for verification (may take up to 24 hours)

### Step 3: Get API Key

1. Go to **API Keys** > Create API Key
2. Name: "Invoice App Production"
3. Permission: "Full Access" or "Sending Only"
4. Copy the API key (starts with `re_`)

### Step 4: Test Email Sending

Before deployment, test email functionality:

```bash
# In your local environment
export RESEND_API_KEY="re_your_api_key"
npm run test:email
```

### Step 5: Configure Email Addresses

Choose your email addresses:
- `FROM_EMAIL`: noreply@yourdomain.com
- `FROM_NAME`: YourCompany Name
- `REPLY_TO_EMAIL`: support@yourdomain.com

---

## Vercel Project Setup

### Client Portal Setup

#### Step 1: Create Vercel Project

1. Go to https://vercel.com/dashboard
2. Click "Add New..." > Project
3. Import your Git repository
4. **Configure Project:**
   - **Framework Preset**: Other
   - **Root Directory**: `src/apps/client-portal`
   - **Build Command**: Leave empty (using vercel.json)
   - **Output Directory**: Leave empty (using vercel.json)
   - **Install Command**: Leave empty (using vercel.json)

5. Click "Deploy" (it will fail initially - that's expected)

#### Step 2: Configure Project Settings

1. Go to Project Settings > General
2. **Node.js Version**: 18.x or higher
3. **Root Directory**: `src/apps/client-portal`
4. **Framework Preset**: Other

#### Step 3: Configure Build Settings

Vercel will automatically use the `vercel.json` configuration in the client-portal directory.

Verify the configuration matches:
```json
{
  "buildCommand": "cd ../.. && turbo run build --filter=@invoice-app/client-portal",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": null,
  "outputDirectory": ".next"
}
```

---

### Admin Dashboard Setup

#### Step 1: Create Vercel Project

1. Go to https://vercel.com/dashboard
2. Click "Add New..." > Project
3. Import your Git repository **again** (same repo)
4. **Configure Project:**
   - **Framework Preset**: Other
   - **Root Directory**: `src/apps/admin-dashboard`
   - **Build Command**: Leave empty (using vercel.json)
   - **Output Directory**: Leave empty (using vercel.json)
   - **Install Command**: Leave empty (using vercel.json)

5. Click "Deploy" (it will fail initially - that's expected)

#### Step 2: Configure Project Settings

1. Go to Project Settings > General
2. **Node.js Version**: 18.x or higher
3. **Root Directory**: `src/apps/admin-dashboard`
4. **Framework Preset**: Other

#### Step 3: Configure Build Settings

Vercel will automatically use the `vercel.json` configuration in the admin-dashboard directory.

Verify the configuration matches:
```json
{
  "buildCommand": "cd ../.. && turbo run build --filter=@invoice-app/admin-dashboard",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": null,
  "outputDirectory": ".next"
}
```

---

## Environment Variables Configuration

### Client Portal Environment Variables

1. Go to Vercel Dashboard > Your Client Portal Project
2. Navigate to Settings > Environment Variables
3. Add the following variables for **Production**:

| Variable Name | Value | Environments |
|--------------|-------|--------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_XXXXX` (from Client Portal Clerk app) | Production, Preview |
| `CLERK_SECRET_KEY` | `sk_live_XXXXX` (from Client Portal Clerk app) | Production, Preview |
| `CLERK_WEBHOOK_SECRET` | `whsec_XXXXX` (from Client Portal Clerk webhook) | Production, Preview |
| `DATABASE_URL` | Your database connection string | Production, Preview |
| `RESEND_API_KEY` | `re_XXXXX` (from Resend) | Production, Preview |
| `FROM_EMAIL` | `noreply@yourdomain.com` | Production, Preview |
| `FROM_NAME` | `YourCompany Client Portal` | Production, Preview |
| `REPLY_TO_EMAIL` | `support@yourdomain.com` | Production, Preview |
| `APP_URL` | `https://portal.yourdomain.com` | Production |
| `APP_URL` | `https://preview-url.vercel.app` | Preview |
| `NEXT_PUBLIC_APP_URL` | `https://portal.yourdomain.com` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://preview-url.vercel.app` | Preview |

### Admin Dashboard Environment Variables

1. Go to Vercel Dashboard > Your Admin Dashboard Project
2. Navigate to Settings > Environment Variables
3. Add the following variables for **Production**:

| Variable Name | Value | Environments |
|--------------|-------|--------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_YYYYY` (from Admin Dashboard Clerk app) | Production, Preview |
| `CLERK_SECRET_KEY` | `sk_live_YYYYY` (from Admin Dashboard Clerk app) | Production, Preview |
| `CLERK_WEBHOOK_SECRET` | `whsec_YYYYY` (from Admin Dashboard Clerk webhook) | Production, Preview |
| `DATABASE_URL` | Your database connection string (same as client) | Production, Preview |
| `RESEND_API_KEY` | `re_XXXXX` (from Resend) | Production, Preview |
| `FROM_EMAIL` | `admin@yourdomain.com` | Production, Preview |
| `FROM_NAME` | `YourCompany Admin` | Production, Preview |
| `REPLY_TO_EMAIL` | `admin@yourdomain.com` | Production, Preview |
| `APP_URL` | `https://admin.yourdomain.com` | Production |
| `APP_URL` | `https://preview-url.vercel.app` | Preview |
| `NEXT_PUBLIC_APP_URL` | `https://admin.yourdomain.com` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://preview-url.vercel.app` | Preview |
| `CLIENT_PORTAL_URL` | `https://portal.yourdomain.com` | Production, Preview |

### Important Notes

- **Sensitive variables**: Mark secret keys as "Sensitive" in Vercel to encrypt them
- **Preview deployments**: Set separate values for preview environments for testing
- **Build variables**: Some variables are only needed during build time (Clerk, Database)
- **Runtime variables**: Some variables are needed at runtime (all of the above)

---

## Domain Configuration

### Step 1: Add Domains in Vercel

#### Client Portal Domain

1. Go to Your Client Portal Project > Settings > Domains
2. Add domain: `portal.yourdomain.com`
3. Copy the DNS records shown (CNAME or A record)

#### Admin Dashboard Domain

1. Go to Your Admin Dashboard Project > Settings > Domains
2. Add domain: `admin.yourdomain.com`
3. Copy the DNS records shown (CNAME or A record)

### Step 2: Configure DNS

Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):

1. Add CNAME record for client portal:
   ```
   Type: CNAME
   Name: portal
   Value: cname.vercel-dns.com
   TTL: 3600
   ```

2. Add CNAME record for admin dashboard:
   ```
   Type: CNAME
   Name: admin
   Value: cname.vercel-dns.com
   TTL: 3600
   ```

3. Wait for DNS propagation (up to 48 hours, usually much faster)

### Step 3: Verify SSL Certificates

1. Vercel automatically provisions SSL certificates via Let's Encrypt
2. Check domain status in Vercel Dashboard
3. Wait for "Valid" status
4. Test HTTPS access

### Step 4: Update Environment Variables

After domains are active, update APP_URL variables in both projects to use the custom domains.

---

## Build Configuration

### Understanding the Build Process

The monorepo uses Turborepo for efficient builds:

1. **Install Phase**:
   - Installs all dependencies from root
   - Includes workspace packages

2. **Build Phase**:
   - Turborepo builds dependencies first (`@invoice-app/database`, `@invoice-app/auth`, `@invoice-app/email`)
   - Then builds the target app
   - Uses cache for faster subsequent builds

### Build Command Breakdown

**Client Portal:**
```bash
cd ../.. && turbo run build --filter=@invoice-app/client-portal
```
- `cd ../..`: Navigate to monorepo root
- `turbo run build`: Execute build task
- `--filter=@invoice-app/client-portal`: Build only this app and dependencies

**Admin Dashboard:**
```bash
cd ../.. && turbo run build --filter=@invoice-app/admin-dashboard
```

### Troubleshooting Build Issues

If builds fail:

1. **Check build logs** in Vercel Dashboard > Deployments > Failed Deployment
2. **Common issues:**
   - Missing environment variables (DATABASE_URL, CLERK keys)
   - TypeScript errors (set `ignoreBuildErrors: true` in next.config.ts)
   - ESLint errors (set `ignoreDuringBuilds: true` in next.config.ts)
   - Prisma client not generated (should run automatically)

3. **Test locally:**
   ```bash
   npm run build
   ```

4. **Clear Vercel cache:**
   - Go to Project Settings > Clear Cache
   - Redeploy

---

## Database Migration

### Before First Deployment

#### Step 1: Backup Existing Data (if any)

If you have existing data in development:

```bash
# Export data
npx prisma db seed

# Or create SQL dump (PostgreSQL)
pg_dump $DATABASE_URL > backup.sql
```

#### Step 2: Run Migrations

**Option A: Manual Migration (Recommended for first deploy)**

```bash
# Set production database URL
export DATABASE_URL="postgresql://user:password@host:port/database"

# Run migrations
npm run db:migrate:deploy

# Verify migration
npm run db:studio
```

**Option B: Automatic Migration (via Vercel)**

Add a build script that runs migrations:

1. Create `scripts/deploy.sh`:
   ```bash
   #!/bin/bash
   npx prisma migrate deploy
   npm run build
   ```

2. Update `vercel.json`:
   ```json
   {
     "buildCommand": "cd ../.. && bash scripts/deploy.sh"
   }
   ```

⚠️ **Warning**: Automatic migrations can be risky. Always review migrations before running in production.

#### Step 3: Seed Production Data (Optional)

If you need initial data:

```bash
npm run db:seed
```

### Ongoing Migrations

For future schema changes:

1. **Develop locally**:
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```

2. **Test migration**:
   ```bash
   # Test on staging database
   DATABASE_URL="staging_url" npx prisma migrate deploy
   ```

3. **Deploy to production**:
   ```bash
   DATABASE_URL="production_url" npx prisma migrate deploy
   ```

4. **Verify**:
   - Check Prisma Studio
   - Test API endpoints
   - Verify data integrity

---

## Post-Deployment Verification

### Step 1: Verify Deployments

Check both projects are deployed successfully:

1. Client Portal: https://portal.yourdomain.com
2. Admin Dashboard: https://admin.yourdomain.com

### Step 2: Test Authentication

#### Client Portal
1. Go to sign-up page
2. Create a test account
3. Verify email works
4. Test sign-in
5. Test sign-out

#### Admin Dashboard
1. Go to sign-up page
2. Create admin account
3. Verify email works
4. Test sign-in
5. Check organization features (if enabled)

### Step 3: Test Database Connectivity

1. **Create test data** in Admin Dashboard:
   - Create customer
   - Create invoice
   - Update invoice

2. **Verify data** in Client Portal:
   - Check customer appears
   - Check invoice is visible
   - Test filtering/search

3. **Check webhooks**:
   - Go to Clerk Dashboard > Webhooks
   - Verify webhook calls are successful (green checkmarks)

### Step 4: Test Email Functionality

1. **Test invitation email** (Admin Dashboard):
   - Create client invitation
   - Check email received
   - Verify acceptance link works

2. **Test notification email** (if applicable):
   - Trigger notification
   - Check email received

3. **Check Resend logs**:
   - Go to Resend Dashboard > Logs
   - Verify emails sent successfully

### Step 5: Test Core Features

#### Admin Dashboard
- [ ] Dashboard loads with metrics
- [ ] Create new invoice
- [ ] Edit invoice
- [ ] Delete invoice
- [ ] Create customer
- [ ] Update customer
- [ ] Search functionality
- [ ] Filtering works
- [ ] PDF generation
- [ ] User management

#### Client Portal
- [ ] Dashboard loads
- [ ] View invoices
- [ ] Filter invoices by status
- [ ] View invoice details
- [ ] Download PDF
- [ ] Profile management

### Step 6: Performance Checks

1. **Run Lighthouse audit**:
   - Performance: >90
   - Accessibility: >90
   - Best Practices: >90
   - SEO: >80

2. **Check Core Web Vitals**:
   - LCP (Largest Contentful Paint): <2.5s
   - FID (First Input Delay): <100ms
   - CLS (Cumulative Layout Shift): <0.1

3. **Monitor Vercel Analytics**:
   - Go to Project > Analytics
   - Check page load times
   - Check function execution times

### Step 7: Security Verification

- [ ] HTTPS enabled (SSL certificate valid)
- [ ] Security headers present (check vercel.json config)
- [ ] API routes require authentication
- [ ] Environment variables not exposed in client
- [ ] CORS configured correctly
- [ ] Rate limiting works (if implemented)

### Step 8: Error Monitoring

Set up error tracking (optional but recommended):

1. **Vercel Logs**:
   - Go to Project > Logs
   - Check for errors

2. **Sentry Integration** (optional):
   ```bash
   npm install @sentry/nextjs
   ```

---

## Monitoring and Maintenance

### Daily Monitoring

1. **Vercel Dashboard**:
   - Check deployment status
   - Monitor error logs
   - Review analytics

2. **Clerk Dashboard**:
   - Monitor active users
   - Check webhook delivery
   - Review authentication logs

3. **Database**:
   - Monitor connection pool usage
   - Check query performance
   - Review storage usage

### Weekly Tasks

- [ ] Review Vercel Analytics
- [ ] Check error logs
- [ ] Review user feedback
- [ ] Test critical features
- [ ] Review security logs
- [ ] Check SSL certificate expiry

### Monthly Tasks

- [ ] Update dependencies
- [ ] Review and rotate secrets
- [ ] Database backup verification
- [ ] Performance optimization review
- [ ] Security audit
- [ ] Cost review

### Recommended Monitoring Tools

1. **Vercel Analytics** (built-in):
   - Real-time analytics
   - Web Vitals monitoring

2. **Sentry** (errors):
   - Error tracking
   - Performance monitoring

3. **LogRocket** (session replay):
   - User session recording
   - Debug user issues

4. **UptimeRobot** (uptime):
   - Monitor application availability
   - Alert on downtime

---

## Troubleshooting

### Build Failures

#### Issue: "Cannot find module '@invoice-app/database'"
**Solution:**
1. Check `turbo.json` includes database package in build dependencies
2. Verify `package.json` workspaces configuration
3. Clear Vercel cache and redeploy

#### Issue: "Prisma Client not generated"
**Solution:**
1. Ensure `prisma generate` runs in database package build script
2. Add `postinstall` script in database package:
   ```json
   "postinstall": "prisma generate"
   ```

#### Issue: "TypeScript errors in build"
**Solution:**
1. Temporarily disable in `next.config.ts`:
   ```typescript
   typescript: {
     ignoreBuildErrors: true
   }
   ```
2. Fix errors post-deployment

### Runtime Errors

#### Issue: "Database connection failed"
**Solutions:**
1. Verify `DATABASE_URL` is set correctly
2. Check database is accessible from Vercel (firewall rules)
3. Verify SSL mode is configured: `?sslmode=require`
4. Test connection locally with production URL

#### Issue: "Clerk authentication not working"
**Solutions:**
1. Verify all Clerk environment variables are set
2. Check Clerk webhook is configured with correct URL
3. Verify domain is added in Clerk allowed domains
4. Check browser console for CORS errors

#### Issue: "Emails not sending"
**Solutions:**
1. Verify `RESEND_API_KEY` is correct
2. Check domain is verified in Resend
3. Verify `FROM_EMAIL` matches verified domain
4. Check Resend logs for errors
5. Ensure `DEV_EMAIL_TO` is not set in production

### Performance Issues

#### Issue: "Slow page loads"
**Solutions:**
1. Enable Vercel Edge Caching
2. Optimize images (use Next.js Image component)
3. Implement lazy loading
4. Review database queries (add indexes)
5. Enable Vercel Edge Functions for API routes

#### Issue: "Database connection timeouts"
**Solutions:**
1. Enable connection pooling
2. Increase connection pool size in database provider
3. Implement query optimization
4. Consider read replicas for read-heavy operations

### Webhook Issues

#### Issue: "Clerk webhooks failing"
**Solutions:**
1. Verify webhook URL is publicly accessible
2. Check `CLERK_WEBHOOK_SECRET` matches Clerk dashboard
3. Review webhook logs in Clerk dashboard
4. Test webhook endpoint with Postman
5. Check API route is not blocking webhook requests

---

## Rollback Procedure

If deployment causes issues:

### Quick Rollback

1. Go to Vercel Dashboard > Deployments
2. Find last working deployment
3. Click "..." menu > Promote to Production
4. Confirm rollback

### Manual Rollback

If you need to rollback code:

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push origin main --force
```

### Database Rollback

If migration caused issues:

1. **Stop both applications** (pause in Vercel)

2. **Restore database backup**:
   ```bash
   # PostgreSQL
   psql $DATABASE_URL < backup.sql
   ```

3. **Rollback migration**:
   ```bash
   npx prisma migrate resolve --rolled-back <migration-name>
   ```

4. **Verify data integrity**

5. **Resume applications**

---

## Security Best Practices

### Production Security Checklist

- [ ] All secrets stored in Vercel environment variables (not in code)
- [ ] Environment variables marked as "Sensitive"
- [ ] HTTPS enforced (SSL certificates valid)
- [ ] Security headers configured (X-Frame-Options, CSP, etc.)
- [ ] Database connection uses SSL
- [ ] API routes require authentication
- [ ] CORS configured restrictively
- [ ] Rate limiting implemented on API routes
- [ ] Input validation on all forms
- [ ] SQL injection prevention (using Prisma ORM)
- [ ] XSS prevention (React escapes by default)
- [ ] 2FA enabled on all admin accounts (Vercel, Clerk, Database, Domain)

### Secret Rotation Schedule

Rotate these secrets regularly:

- **Monthly**: Database passwords
- **Quarterly**: API keys (Clerk, Resend)
- **Annually**: SSL certificates (automatic with Vercel)
- **Immediately**: Any compromised secrets

---

## Cost Optimization

### Vercel Costs

- **Free tier**: 100GB bandwidth/month
- **Pro tier**: $20/month per team member
- Monitor usage in Vercel Dashboard > Usage

### Database Costs

- **Vercel Postgres**: $0.12/GB stored + $0.12/GB transferred
- **Supabase**: Free tier (500MB), then $25/month
- **Railway**: $5/month per service
- **PlanetScale**: Free tier (5GB), then usage-based

### Email Costs

- **Resend**:
  - Free tier: 100 emails/day
  - Paid: $20/month for 50K emails

### Optimization Tips

1. **Enable Vercel caching** for static assets
2. **Optimize images** (use Next.js Image optimization)
3. **Database connection pooling** (reduce connection overhead)
4. **Implement caching** for frequent queries
5. **Monitor analytics** to identify bottlenecks

---

## Support and Resources

### Documentation Links

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Resend Documentation](https://resend.com/docs)
- [Turborepo Documentation](https://turbo.build/repo/docs)

### Community Resources

- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Next.js GitHub Discussions](https://github.com/vercel/next.js/discussions)
- [Clerk Discord](https://clerk.com/discord)

### Getting Help

1. **Check logs** first (Vercel Dashboard > Logs)
2. **Search documentation** for error messages
3. **Check GitHub Issues** for known problems
4. **Ask in community forums**
5. **Contact support** (Vercel, Clerk, etc.)

---

## Conclusion

Following this guide, you should have both applications successfully deployed to Vercel. Remember to:

- Monitor deployments regularly
- Keep dependencies updated
- Rotate secrets periodically
- Backup database regularly
- Test thoroughly after each deployment

For questions or issues not covered in this guide, refer to the troubleshooting section or contact support.

---

**Last Updated**: 2025-01-11
**Version**: 1.0.0
