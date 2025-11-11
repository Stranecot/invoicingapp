# Pre-Deployment Checklist

This checklist ensures your applications are ready for production deployment to Vercel.

---

## Table of Contents
- [Code Quality](#code-quality)
- [Build Verification](#build-verification)
- [Database Preparation](#database-preparation)
- [Third-Party Services](#third-party-services)
- [Security Configuration](#security-configuration)
- [Environment Variables](#environment-variables)
- [Domain and DNS](#domain-and-dns)
- [Testing](#testing)
- [Documentation](#documentation)
- [Backup and Recovery](#backup-and-recovery)

---

## Code Quality

### General Code Health
- [ ] All features implemented and tested locally
- [ ] All critical bugs fixed
- [ ] Code reviewed (if team environment)
- [ ] Git repository clean (no uncommitted changes)
- [ ] Latest code pushed to remote repository
- [ ] Development branch merged to main/production branch

### TypeScript
- [ ] No critical TypeScript errors
- [ ] Type definitions complete for custom code
- [ ] `next.config.ts` configured to handle build errors if needed:
  ```typescript
  typescript: {
    ignoreBuildErrors: true  // Only if unavoidable
  }
  ```

### ESLint
- [ ] No critical ESLint errors
- [ ] Code follows consistent style
- [ ] `next.config.ts` configured to handle lint errors if needed:
  ```typescript
  eslint: {
    ignoreDuringBuilds: true  // Only if unavoidable
  }
  ```

### Dependencies
- [ ] All dependencies installed (`npm install`)
- [ ] No security vulnerabilities (`npm audit`)
- [ ] Dependencies up to date (or documented why not)
- [ ] Package-lock.json committed

---

## Build Verification

### Local Build Test
- [ ] **Root build succeeds**: `npm run build`
- [ ] **Client Portal builds**:
  ```bash
  cd src/apps/client-portal && npm run build
  ```
- [ ] **Admin Dashboard builds**:
  ```bash
  cd src/apps/admin-dashboard && npm run build
  ```
- [ ] **No build errors** in console output
- [ ] **Build output size** is reasonable (<5MB initial JS bundle)

### Turborepo Configuration
- [ ] `turbo.json` properly configured
- [ ] Build dependencies correct (`^build`)
- [ ] Output directories defined
- [ ] Environment variables listed

### Vercel Configuration
- [ ] `src/apps/client-portal/vercel.json` exists
- [ ] `src/apps/admin-dashboard/vercel.json` exists
- [ ] Build commands correct in both files
- [ ] Output directories correct (`.next`)
- [ ] Install commands specified

---

## Database Preparation

### Schema and Migrations
- [ ] Prisma schema finalized (`src/packages/database/prisma/schema.prisma`)
- [ ] All migrations created and tested
- [ ] Migration files committed to repository
- [ ] No pending schema changes

### Database Provider Setup
- [ ] Production database instance provisioned
- [ ] Database provider chosen:
  - [ ] Vercel Postgres, OR
  - [ ] Supabase, OR
  - [ ] Railway, OR
  - [ ] PlanetScale
- [ ] Connection string obtained and saved securely
- [ ] Connection pooling enabled
- [ ] SSL/TLS configured

### Data Migration
- [ ] Migration strategy defined
- [ ] Seed data prepared (if needed)
- [ ] Test data migration on staging database
- [ ] Backup existing data (if applicable)
- [ ] Rollback plan documented

### Database Testing
- [ ] Connect to production database locally (test connection)
- [ ] Run migrations on staging/test database
- [ ] Verify migrations complete successfully
- [ ] Test Prisma Client generation
- [ ] Verify all queries work with production database

---

## Third-Party Services

### Clerk Authentication

#### Client Portal Clerk App
- [ ] Clerk application created: "Invoice App - Client Portal"
- [ ] Publishable key obtained (`pk_live_...`)
- [ ] Secret key obtained (`sk_live_...`)
- [ ] Webhook configured at `/api/webhooks/clerk`
- [ ] Webhook secret obtained (`whsec_...`)
- [ ] Events subscribed: `user.created`, `user.updated`, `user.deleted`
- [ ] Sign-in/sign-up paths configured
- [ ] Allowed domains added
- [ ] Test authentication flow works

#### Admin Dashboard Clerk App
- [ ] Clerk application created: "Invoice App - Admin Dashboard"
- [ ] Publishable key obtained (`pk_live_...`)
- [ ] Secret key obtained (`sk_live_...`)
- [ ] Webhook configured at `/api/webhooks/clerk`
- [ ] Webhook secret obtained (`whsec_...`)
- [ ] Events subscribed: `user.created`, `user.updated`, `user.deleted`
- [ ] Organizations enabled (if using)
- [ ] Roles configured: Admin, Manager, Accountant
- [ ] Sign-in/sign-up paths configured
- [ ] Allowed domains added
- [ ] Test authentication flow works

### Email Service (Resend)
- [ ] Resend account created
- [ ] Domain verified in Resend
- [ ] DNS records added (SPF, DKIM, DMARC)
- [ ] Domain verification successful
- [ ] API key obtained (`re_...`)
- [ ] From email address configured
- [ ] Test email sent successfully
- [ ] Email templates reviewed
- [ ] Unsubscribe links configured (if needed)

---

## Security Configuration

### Secrets Management
- [ ] **No secrets in code repository**
- [ ] **No `.env` files committed** (only `.env.example` files)
- [ ] All secrets stored securely (password manager or Vercel environment variables)
- [ ] Production secrets different from development secrets

### Environment Variables Security
- [ ] All sensitive values use Vercel "Sensitive" flag
- [ ] No API keys or passwords in client-side code
- [ ] `NEXT_PUBLIC_*` variables only contain non-sensitive data
- [ ] Webhook secrets configured

### Application Security
- [ ] API routes require authentication
- [ ] Rate limiting configured (if applicable)
- [ ] CORS policies defined
- [ ] Input validation on all forms
- [ ] SQL injection prevention (Prisma ORM)
- [ ] XSS prevention (React default escaping)
- [ ] CSRF protection (Next.js default)

### Security Headers
- [ ] Security headers configured in `vercel.json`:
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `X-Frame-Options: DENY`
  - [ ] `X-XSS-Protection: 1; mode=block`
  - [ ] `Referrer-Policy: strict-origin-when-cross-origin`

### Access Control
- [ ] 2FA enabled on Vercel account
- [ ] 2FA enabled on Clerk account
- [ ] 2FA enabled on database provider
- [ ] 2FA enabled on domain registrar
- [ ] 2FA enabled on Resend account
- [ ] Team access permissions reviewed
- [ ] Least privilege principle applied

---

## Environment Variables

### Client Portal Variables Ready
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] `CLERK_SECRET_KEY`
- [ ] `CLERK_WEBHOOK_SECRET`
- [ ] `DATABASE_URL`
- [ ] `RESEND_API_KEY`
- [ ] `FROM_EMAIL`
- [ ] `FROM_NAME`
- [ ] `REPLY_TO_EMAIL`
- [ ] `APP_URL` (production and preview values)
- [ ] `NEXT_PUBLIC_APP_URL` (production and preview values)

### Admin Dashboard Variables Ready
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] `CLERK_SECRET_KEY`
- [ ] `CLERK_WEBHOOK_SECRET`
- [ ] `DATABASE_URL`
- [ ] `RESEND_API_KEY`
- [ ] `FROM_EMAIL`
- [ ] `FROM_NAME`
- [ ] `REPLY_TO_EMAIL`
- [ ] `APP_URL` (production and preview values)
- [ ] `NEXT_PUBLIC_APP_URL` (production and preview values)
- [ ] `CLIENT_PORTAL_URL`

### Variable Documentation
- [ ] `.env.production.example` created for client-portal
- [ ] `.env.production.example` created for admin-dashboard
- [ ] All variables documented with descriptions
- [ ] Example values provided
- [ ] Required vs optional variables marked

---

## Domain and DNS

### Domain Registration
- [ ] Domain registered (e.g., `yourdomain.com`)
- [ ] Domain not expiring soon (check expiration date)
- [ ] Auto-renewal enabled
- [ ] Domain privacy protection enabled
- [ ] Registrar login credentials secured

### DNS Configuration
- [ ] Access to DNS management panel
- [ ] Existing DNS records documented (if any)
- [ ] CNAME records prepared:
  - [ ] `portal` subdomain for Client Portal
  - [ ] `admin` subdomain for Admin Dashboard
- [ ] DNS propagation time considered (up to 48 hours)

### Email DNS Records (Resend)
- [ ] SPF record added
- [ ] DKIM record added
- [ ] DMARC record added
- [ ] DNS records verified in Resend dashboard

### SSL Certificates
- [ ] Understand Vercel provides automatic SSL (Let's Encrypt)
- [ ] No manual SSL configuration needed
- [ ] Certificate auto-renewal confirmed

---

## Testing

### Local Testing
- [ ] All features work in development mode
- [ ] All API endpoints respond correctly
- [ ] Database operations work (CRUD)
- [ ] Authentication flow complete
- [ ] Email sending works
- [ ] PDF generation works
- [ ] Forms validate correctly
- [ ] Error handling works

### Production-like Testing
- [ ] Test with production database (staging)
- [ ] Test with production Clerk apps (staging)
- [ ] Test with production email service (staging)
- [ ] Test on different browsers:
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge
- [ ] Test on different devices:
  - [ ] Desktop
  - [ ] Tablet
  - [ ] Mobile (iOS)
  - [ ] Mobile (Android)

### Performance Testing
- [ ] Page load times acceptable (<3 seconds)
- [ ] API response times fast (<500ms)
- [ ] Database queries optimized
- [ ] Images optimized
- [ ] Lighthouse score >80 on all metrics

### Security Testing
- [ ] API routes require authentication
- [ ] Unauthorized access blocked
- [ ] HTTPS enforced
- [ ] No secrets exposed in client code
- [ ] CORS configured correctly
- [ ] Input validation works

---

## Documentation

### Code Documentation
- [ ] README updated with production deployment info
- [ ] API endpoints documented
- [ ] Database schema documented
- [ ] Environment variables documented

### Deployment Documentation
- [ ] `VERCEL_DEPLOYMENT.md` reviewed
- [ ] Custom deployment notes added (if any)
- [ ] Rollback procedure understood
- [ ] Troubleshooting steps documented

### Team Documentation
- [ ] Team members briefed on deployment
- [ ] Access credentials shared securely
- [ ] On-call rotation defined (if applicable)
- [ ] Incident response plan ready

---

## Backup and Recovery

### Database Backups
- [ ] Backup strategy defined
- [ ] Automated backups configured
- [ ] Backup restoration tested
- [ ] Backup retention policy defined
- [ ] Off-site backup location configured

### Code Backups
- [ ] Code in version control (Git)
- [ ] Remote repository backup (GitHub/GitLab)
- [ ] Multiple team members have access
- [ ] Repository not dependent on single account

### Disaster Recovery Plan
- [ ] Recovery Time Objective (RTO) defined
- [ ] Recovery Point Objective (RPO) defined
- [ ] Rollback procedure documented
- [ ] Emergency contacts list created
- [ ] Incident response plan ready

---

## Vercel Account Setup

### Account Configuration
- [ ] Vercel account created
- [ ] Payment method added (if using paid tier)
- [ ] Team members invited (if applicable)
- [ ] Billing alerts configured
- [ ] Usage monitoring enabled

### Project Creation
- [ ] Client Portal project ready to create
- [ ] Admin Dashboard project ready to create
- [ ] Git repository connected
- [ ] Branch deployment strategy defined

---

## Post-Deployment Monitoring

### Monitoring Tools
- [ ] Vercel Analytics enabled
- [ ] Error tracking configured (optional: Sentry)
- [ ] Uptime monitoring configured (optional: UptimeRobot)
- [ ] Log aggregation configured (optional: LogRocket)

### Alerting
- [ ] Email alerts configured for failures
- [ ] Slack/Discord webhooks configured (optional)
- [ ] On-call schedule defined
- [ ] Escalation path defined

### Metrics to Monitor
- [ ] Deployment success rate
- [ ] Build times
- [ ] Page load times
- [ ] API response times
- [ ] Error rates
- [ ] User authentication success rate
- [ ] Email delivery rate
- [ ] Database connection pool usage

---

## Final Checks

### Pre-Deployment Review
- [ ] All sections of this checklist completed
- [ ] Team sign-off obtained (if applicable)
- [ ] Deployment window scheduled
- [ ] Stakeholders notified
- [ ] Rollback plan ready

### Deployment Day
- [ ] Monitor deployment progress
- [ ] Verify both apps deployed successfully
- [ ] Run post-deployment verification tests
- [ ] Monitor error logs for first hour
- [ ] Notify team of successful deployment

### Post-Deployment
- [ ] Deployment announcement sent
- [ ] Documentation updated with production URLs
- [ ] Training provided to users (if applicable)
- [ ] Feedback collection process started

---

## Sign-Off

**Checklist Completed By**: ________________
**Date**: ________________
**Signature**: ________________

**Reviewed By**: ________________
**Date**: ________________
**Signature**: ________________

**Approved for Deployment**: ☐ Yes  ☐ No

**Notes**:
```
[Add any additional notes, concerns, or special considerations here]
```

---

## Quick Reference

### Critical Environment Variables

Both apps need:
- DATABASE_URL
- Clerk keys (separate for each app)
- Resend API key
- APP_URL / NEXT_PUBLIC_APP_URL

### Critical Services

- [ ] Database accessible
- [ ] Clerk webhooks configured
- [ ] Resend domain verified
- [ ] DNS records propagated

### Emergency Contacts

| Service | Contact | Phone/Email |
|---------|---------|-------------|
| Vercel Support | https://vercel.com/support | support@vercel.com |
| Clerk Support | https://clerk.com/support | support@clerk.com |
| Database Provider | [Your provider] | [Contact info] |
| Domain Registrar | [Your registrar] | [Contact info] |

---

**Last Updated**: 2025-01-11
**Version**: 1.0.0
