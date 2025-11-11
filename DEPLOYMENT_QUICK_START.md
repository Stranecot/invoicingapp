# Vercel Deployment Quick Start Guide

This is a condensed version of the deployment process. For detailed instructions, see [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md).

---

## Overview

You have 2 Next.js apps to deploy:
1. **Client Portal** (port 3001) → `portal.yourdomain.com`
2. **Admin Dashboard** (port 3002) → `admin.yourdomain.com`

Both apps share the same database but have separate Clerk authentication instances.

---

## Prerequisites Setup (1-2 hours)

### 1. Database Setup (15 minutes)
Choose one provider and get your `DATABASE_URL`:

**Option A: Vercel Postgres** (Recommended)
```
1. Vercel Dashboard > Storage > Create Database > Postgres
2. Copy DATABASE_URL
```

**Option B: Supabase** (Good free tier)
```
1. supabase.com > New Project
2. Settings > Database > Connection String (Transaction pooler)
```

### 2. Clerk Setup (30 minutes)
Create **2 separate Clerk applications**:

**Application 1: Client Portal**
```
1. dashboard.clerk.com > Create Application
2. Name: "Invoice App - Client Portal"
3. Copy: Publishable Key, Secret Key
4. Webhooks > Add Endpoint:
   - URL: https://portal.yourdomain.com/api/webhooks/clerk
   - Events: user.created, user.updated, user.deleted
   - Copy: Webhook Secret
```

**Application 2: Admin Dashboard**
```
1. dashboard.clerk.com > Create Application
2. Name: "Invoice App - Admin Dashboard"
3. Copy: Publishable Key, Secret Key
4. Webhooks > Add Endpoint:
   - URL: https://admin.yourdomain.com/api/webhooks/clerk
   - Events: user.created, user.updated, user.deleted
   - Copy: Webhook Secret
```

### 3. Email Setup (15 minutes)
```
1. resend.com > Sign Up
2. Domains > Add Domain > yourdomain.com
3. Add DNS records (SPF, DKIM, DMARC) to your domain registrar
4. API Keys > Create API Key > Copy key
```

---

## Vercel Deployment (30 minutes per app)

### Deploy Client Portal

#### Step 1: Create Project
```
1. vercel.com/dashboard > Add New > Project
2. Import your Git repository
3. Configure:
   - Framework: Other
   - Root Directory: src/apps/client-portal
   - Build/Output/Install: Leave empty (uses vercel.json)
4. Click Deploy (will fail - that's OK)
```

#### Step 2: Add Environment Variables
Go to Project Settings > Environment Variables and add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_XXX` (Client Portal) | Production, Preview |
| `CLERK_SECRET_KEY` | `sk_live_XXX` (Client Portal) | Production, Preview |
| `CLERK_WEBHOOK_SECRET` | `whsec_XXX` (Client Portal) | Production, Preview |
| `DATABASE_URL` | Your database URL | Production, Preview |
| `RESEND_API_KEY` | `re_XXX` | Production, Preview |
| `FROM_EMAIL` | `noreply@yourdomain.com` | Production, Preview |
| `FROM_NAME` | `YourCompany Client` | Production, Preview |
| `REPLY_TO_EMAIL` | `support@yourdomain.com` | Production, Preview |
| `APP_URL` | `https://portal.yourdomain.com` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://portal.yourdomain.com` | Production |

#### Step 3: Redeploy
```
Deployments > Latest > Redeploy
```

---

### Deploy Admin Dashboard

#### Step 1: Create Project
```
1. vercel.com/dashboard > Add New > Project
2. Import your Git repository AGAIN (same repo)
3. Configure:
   - Framework: Other
   - Root Directory: src/apps/admin-dashboard
   - Build/Output/Install: Leave empty (uses vercel.json)
4. Click Deploy (will fail - that's OK)
```

#### Step 2: Add Environment Variables
Go to Project Settings > Environment Variables and add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_YYY` (Admin Dashboard) | Production, Preview |
| `CLERK_SECRET_KEY` | `sk_live_YYY` (Admin Dashboard) | Production, Preview |
| `CLERK_WEBHOOK_SECRET` | `whsec_YYY` (Admin Dashboard) | Production, Preview |
| `DATABASE_URL` | Your database URL (same as client) | Production, Preview |
| `RESEND_API_KEY` | `re_XXX` (same as client) | Production, Preview |
| `FROM_EMAIL` | `admin@yourdomain.com` | Production, Preview |
| `FROM_NAME` | `YourCompany Admin` | Production, Preview |
| `REPLY_TO_EMAIL` | `admin@yourdomain.com` | Production, Preview |
| `APP_URL` | `https://admin.yourdomain.com` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://admin.yourdomain.com` | Production |
| `CLIENT_PORTAL_URL` | `https://portal.yourdomain.com` | Production, Preview |

#### Step 3: Redeploy
```
Deployments > Latest > Redeploy
```

---

## Database Migration (10 minutes)

Run migrations before using the apps:

```bash
# Set production database URL
export DATABASE_URL="your_production_database_url"

# Run migrations
cd src/packages/database
npm run db:migrate:deploy

# Optional: Seed initial data
npm run db:seed
```

---

## Domain Configuration (15 minutes)

### Add Domains in Vercel

**Client Portal:**
```
1. Project Settings > Domains > Add
2. Enter: portal.yourdomain.com
3. Copy the CNAME record shown
```

**Admin Dashboard:**
```
1. Project Settings > Domains > Add
2. Enter: admin.yourdomain.com
3. Copy the CNAME record shown
```

### Update DNS Records

Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):

```
Add CNAME Record 1:
Type: CNAME
Name: portal
Value: cname.vercel-dns.com
TTL: 3600

Add CNAME Record 2:
Type: CNAME
Name: admin
Value: cname.vercel-dns.com
TTL: 3600
```

Wait for DNS propagation (5 minutes to 48 hours, usually <1 hour).

---

## Verification (15 minutes)

### Test Client Portal
```
1. Visit https://portal.yourdomain.com
2. Sign up with test account
3. Verify email received
4. Sign in successfully
5. Check dashboard loads
```

### Test Admin Dashboard
```
1. Visit https://admin.yourdomain.com
2. Sign up with admin account
3. Verify email received
4. Sign in successfully
5. Create test invoice
6. Verify it appears in client portal
```

### Test Webhooks
```
1. Clerk Dashboard > Webhooks
2. Check both webhooks show recent successful calls
3. Green checkmarks = working correctly
```

---

## Troubleshooting

### Build Fails
```
Problem: "Cannot find module '@invoice-app/database'"
Solution:
  1. Project Settings > Clear Cache
  2. Redeploy
```

### Database Connection Fails
```
Problem: "Can't reach database server"
Solution:
  1. Verify DATABASE_URL is correct
  2. Check database allows connections from 0.0.0.0/0
  3. Ensure SSL is enabled: ?sslmode=require
```

### Clerk Auth Not Working
```
Problem: "Authentication failed"
Solution:
  1. Verify all 3 Clerk env vars are set correctly
  2. Check Clerk webhook is configured
  3. Verify domain is in Clerk allowed domains
```

### Emails Not Sending
```
Problem: "Email failed to send"
Solution:
  1. Verify RESEND_API_KEY is correct
  2. Check domain is verified in Resend
  3. Ensure FROM_EMAIL matches verified domain
  4. Check Resend Dashboard > Logs for errors
```

---

## Post-Deployment Updates

### Environment Variable Changes
```
1. Project Settings > Environment Variables
2. Edit variable
3. Save
4. Deployments > Redeploy (required for changes to take effect)
```

### Code Updates
```
1. Push code to Git repository
2. Vercel auto-deploys main branch
3. Monitor deployment in Vercel Dashboard
```

### Rollback
```
1. Deployments > Find last working deployment
2. Click "..." > Promote to Production
```

---

## Important Notes

1. **Separate Clerk Apps**: Client Portal and Admin Dashboard MUST use different Clerk applications for security

2. **Shared Database**: Both apps use the SAME database URL

3. **Environment Variables**: Mark sensitive values (secret keys) as "Sensitive" in Vercel

4. **DNS Propagation**: Domain changes can take up to 48 hours (usually much faster)

5. **SSL Certificates**: Automatic via Vercel (Let's Encrypt), no manual setup needed

6. **Costs**:
   - Vercel: Free tier sufficient for small apps
   - Database: Varies by provider ($0-25/month)
   - Clerk: Free tier (10,000 MAUs)
   - Resend: Free tier (100 emails/day)

---

## Files Created

All configuration files are in place:

- `src/apps/client-portal/vercel.json` - Vercel build config
- `src/apps/client-portal/.env.production.example` - Environment variables template
- `src/apps/admin-dashboard/vercel.json` - Vercel build config
- `src/apps/admin-dashboard/.env.production.example` - Environment variables template
- `VERCEL_DEPLOYMENT.md` - Comprehensive deployment guide
- `PRE_DEPLOYMENT_CHECKLIST.md` - Pre-deployment checklist
- `DEPLOYMENT_QUICK_START.md` - This file

---

## Next Steps

1. Complete [PRE_DEPLOYMENT_CHECKLIST.md](./PRE_DEPLOYMENT_CHECKLIST.md)
2. Follow this quick start guide
3. Refer to [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed troubleshooting
4. Set up monitoring and alerts
5. Document production URLs and credentials securely

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Clerk Docs**: https://clerk.com/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Resend Docs**: https://resend.com/docs

---

**Deployment Time Estimate**: 2-3 hours total
**Difficulty**: Intermediate
**Last Updated**: 2025-01-11
