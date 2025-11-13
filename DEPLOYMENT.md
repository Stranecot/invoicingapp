# Vercel Deployment Guide

This monorepo contains two Next.js applications that share a single PostgreSQL database:
- **Client Portal** (`@invoice-app/client-portal`)
- **Admin Dashboard** (`@invoice-app/admin-dashboard`)

## Prerequisites

1. **Vercel Account** with access to deploy projects
2. **PostgreSQL Database** (recommended: Vercel Postgres or Supabase)
3. **Resend Account** for transactional emails
4. **Domain Names** (optional but recommended):
   - Client Portal: `app.yourdomain.com`
   - Admin Dashboard: `admin.yourdomain.com`

---

## Database Setup

### Option 1: Vercel Postgres (Recommended)

1. Go to Vercel Dashboard → Storage → Create Database → Postgres
2. Copy the `DATABASE_URL` connection string (starts with `postgresql://`)
3. This single database will be shared by both apps

### Option 2: Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → Database → Connection String → URI
3. Copy the connection string (starts with `postgresql://`)

### Important: Database Migrations

After setting up your database, you need to run migrations:

```bash
# Navigate to the database package
cd src/packages/database

# Set your production DATABASE_URL
export DATABASE_URL="your-postgres-connection-string"

# Run migrations
npx prisma migrate deploy

# Optional: Seed with initial data
npm run seed
```

---

## Deployment Steps

### Step 1: Create Two Vercel Projects

You'll create **two separate Vercel projects** from the same Git repository:

#### Project 1: Client Portal

1. Go to Vercel Dashboard → Add New → Project
2. Import your Git repository
3. **Configure Build Settings:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `src/apps/client-portal`
   - **Build Command:** `cd ../.. && turbo run build --filter=@invoice-app/client-portal`
   - **Install Command:** `npm install --legacy-peer-deps`
   - **Output Directory:** `.next`

4. **Project Name:** `invoice-client-portal` (or your preferred name)

#### Project 2: Admin Dashboard

1. Go to Vercel Dashboard → Add New → Project
2. Import the **same Git repository** again
3. **Configure Build Settings:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `src/apps/admin-dashboard`
   - **Build Command:** `cd ../.. && turbo run build --filter=@invoice-app/admin-dashboard`
   - **Install Command:** `npm install --legacy-peer-deps`
   - **Output Directory:** `.next`

4. **Project Name:** `invoice-admin-dashboard` (or your preferred name)

---

### Step 2: Configure Environment Variables

Both projects use the **same database** but different app URLs.

#### Client Portal Environment Variables

Go to your Client Portal project → Settings → Environment Variables → Add:

```bash
# Database (SHARED with Admin Dashboard)
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT Authentication
JWT_SECRET=generate-a-secure-random-string-min-32-chars
JWT_EXPIRES_IN=7d

# Email Service (Resend)
RESEND_API_KEY=re_your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Invoice App
REPLY_TO_EMAIL=support@yourdomain.com

# App URLs
APP_URL=https://app.yourdomain.com
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com

# Cross-app Reference
CLIENT_PORTAL_URL=https://app.yourdomain.com
```

**Important:** Add these variables to **all three environments**:
- ✅ Production
- ✅ Preview
- ✅ Development

#### Admin Dashboard Environment Variables

Go to your Admin Dashboard project → Settings → Environment Variables → Add:

```bash
# Database (SAME as Client Portal)
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT Authentication (SAME secret as Client Portal for shared auth)
JWT_SECRET=same-secret-as-client-portal
JWT_EXPIRES_IN=7d

# Email Service (Resend - can be same API key)
RESEND_API_KEY=re_your_resend_api_key
FROM_EMAIL=admin@yourdomain.com
FROM_NAME=Invoice App Admin
REPLY_TO_EMAIL=admin@yourdomain.com

# App URLs
APP_URL=https://admin.yourdomain.com
NEXT_PUBLIC_APP_URL=https://admin.yourdomain.com

# Cross-app Reference
CLIENT_PORTAL_URL=https://app.yourdomain.com
```

**Important:** Add these variables to **all three environments**:
- ✅ Production
- ✅ Preview
- ✅ Development

---

### Step 3: Generate JWT Secret

You need a secure random string for `JWT_SECRET`. Generate it using:

```bash
# Using OpenSSL (Mac/Linux/WSL)
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**CRITICAL:** Use the **same JWT_SECRET** for both apps so they can share authentication sessions.

---

### Step 4: Deploy

1. **Push your code** to your Git repository (GitHub/GitLab/Bitbucket)
2. Vercel will automatically deploy both projects
3. Wait for deployments to complete

---

### Step 5: Set Up Custom Domains (Optional)

#### Client Portal Domain

1. Go to Client Portal project → Settings → Domains
2. Add your domain: `app.yourdomain.com`
3. Follow Vercel's DNS instructions
4. Update `APP_URL` and `NEXT_PUBLIC_APP_URL` environment variables to use the new domain

#### Admin Dashboard Domain

1. Go to Admin Dashboard project → Settings → Domains
2. Add your domain: `admin.yourdomain.com`
3. Follow Vercel's DNS instructions
4. Update `APP_URL` and `NEXT_PUBLIC_APP_URL` environment variables to use the new domain

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Git Repository                        │
│                  (Single Monorepo)                       │
└─────────────────────────────────────────────────────────┘
                           │
                           │
          ┌────────────────┴────────────────┐
          │                                 │
          ▼                                 ▼
┌──────────────────────┐        ┌──────────────────────┐
│   Vercel Project 1   │        │   Vercel Project 2   │
│   Client Portal      │        │   Admin Dashboard    │
│ app.yourdomain.com   │        │ admin.yourdomain.com │
└──────────────────────┘        └──────────────────────┘
          │                                 │
          │                                 │
          └────────────────┬────────────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │  PostgreSQL Database │
                │   (Shared Instance)  │
                └──────────────────────┘
```

---

## Important Notes

### Database Connection Pooling

Since both apps share the same database, you may hit connection limits. Consider:

1. **Using Vercel Postgres** - Built-in connection pooling
2. **PgBouncer** - If using external Postgres
3. **Prisma Data Proxy** - For connection pooling

Update your `DATABASE_URL` with connection pooling:
```bash
# Example with PgBouncer
DATABASE_URL=postgresql://user:password@host:6543/database?pgbouncer=true

# Example with Prisma Accelerate
DATABASE_URL=prisma://accelerate.prisma-data.net/?api_key=your-api-key
```

### Build Performance

The monorepo structure with Turbo builds both apps efficiently:
- Turbo caches build outputs
- Only rebuilds what changed
- Shares common packages (`@invoice-app/database`, `@invoice-app/auth`)

### Environment Variables Strategy

Since the `vercel.json` files reference environment variables like `@database-url-client`, you have two options:

#### Option A: Remove vercel.json References (Recommended)

Update both `vercel.json` files to remove the `env` sections:

**Client Portal** (`src/apps/client-portal/vercel.json`):
```json
{
  "buildCommand": "cd ../.. && turbo run build --filter=@invoice-app/client-portal",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": null,
  "outputDirectory": ".next"
}
```

**Admin Dashboard** (`src/apps/admin-dashboard/vercel.json`):
```json
{
  "buildCommand": "cd ../.. && turbo run build --filter=@invoice-app/admin-dashboard",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": null,
  "outputDirectory": ".next"
}
```

Then set environment variables directly in Vercel UI.

#### Option B: Use Vercel Environment Variable References

If you want to keep the `@variable-name` syntax:
1. Create environment variables in Vercel with exact names (e.g., `database-url-client`)
2. The `@` prefix tells Vercel to use stored secrets

---

## Post-Deployment Checklist

- [ ] Both apps deployed successfully
- [ ] Database migrations ran successfully (`prisma migrate deploy`)
- [ ] Environment variables set for all environments (Production, Preview, Development)
- [ ] JWT_SECRET is the same in both apps
- [ ] DATABASE_URL is the same in both apps
- [ ] Custom domains configured (if applicable)
- [ ] SSL certificates active
- [ ] Test user login on both Client Portal and Admin Dashboard
- [ ] Test invitation flow (Admin invites → Client accepts)
- [ ] Check Prisma Studio works: `npx prisma studio` (with production DATABASE_URL)

---

## Troubleshooting

### Build Failures

**Error:** `Cannot find module '@invoice-app/database'`
- **Fix:** Ensure `npm install --legacy-peer-deps` is used as install command
- Turbo needs to build shared packages first

**Error:** `Prisma Client not generated`
- **Fix:** Add `postinstall` script to root `package.json`:
  ```json
  "scripts": {
    "postinstall": "cd src/packages/database && npx prisma generate"
  }
  ```

### Database Connection Issues

**Error:** `Can't reach database server`
- **Fix:** Check `DATABASE_URL` format (must be `postgresql://` not `file:`)
- Verify database allows connections from Vercel IPs

**Error:** `Too many connections`
- **Fix:** Enable connection pooling (see Database Connection Pooling section)

### Authentication Issues

**Error:** `Invalid token` across apps
- **Fix:** Ensure `JWT_SECRET` is identical in both apps

---

## Local Development with Production Database

To test against production database locally:

```bash
# Create .env.local in each app
# src/apps/client-portal/.env.local
DATABASE_URL=your-production-database-url
JWT_SECRET=your-production-jwt-secret

# src/apps/admin-dashboard/.env.local
DATABASE_URL=your-production-database-url
JWT_SECRET=your-production-jwt-secret
```

---

## Continuous Deployment

Both projects auto-deploy when you push to your Git repository:

- **Push to `main`** → Deploys to Production
- **Push to `develop`** → Deploys to Preview
- **Open PR** → Creates Preview deployment

Configure branch settings in each Vercel project → Settings → Git.

---

## Monitoring

1. **Vercel Analytics** - Enable for both projects
2. **Vercel Logs** - View runtime logs for debugging
3. **Database Monitoring** - Use your provider's dashboard
4. **Sentry** (optional) - For error tracking

---

## Cost Optimization

- **Vercel Pro:** ~$20/month per team (both projects under one team)
- **Vercel Postgres:** Starts at $20/month (single shared database)
- **Resend:** Free tier: 3,000 emails/month

**Total:** ~$40-60/month for production setup

---

## Security Checklist

- [ ] JWT_SECRET is strong and secure (32+ characters)
- [ ] DATABASE_URL uses SSL (`?sslmode=require`)
- [ ] Environment variables never committed to Git
- [ ] CORS configured properly
- [ ] Rate limiting enabled on API routes
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (Prisma handles this)

---

## Support & Resources

- **Vercel Docs:** https://vercel.com/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Turbo Docs:** https://turbo.build/repo/docs
- **Resend Docs:** https://resend.com/docs

---

**Last Updated:** 2025-01-13
