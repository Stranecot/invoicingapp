# Quick Start: Vercel Deployment

## 🎯 Overview

Deploy two Next.js apps from this monorepo to Vercel:
- **Client Portal** → `https://app.yourdomain.com`
- **Admin Dashboard** → `https://admin.yourdomain.com`

Both apps share a single PostgreSQL database.

---

## ⚡ Quick Setup (5 steps)

### 1. Run the Setup Script

```powershell
cd C:\Projects\ingenious\invoice-app\invoicingapp
.\scripts\vercel-setup.ps1
```

This will:
- ✅ Generate a secure JWT secret
- ✅ Save environment variables to `vercel-env-vars.txt`
- ✅ Optionally link your repository to Vercel

### 2. Set Up PostgreSQL Database

**Option A: Vercel Postgres (Recommended)**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → Storage → Create Database
2. Select PostgreSQL
3. Copy the `DATABASE_URL` connection string

**Option B: Supabase**
1. Create project at [supabase.com](https://supabase.com)
2. Go to Settings → Database → Connection String
3. Copy the URI connection string

### 3. Run Database Migrations

```powershell
cd src\packages\database

# Set your production database URL
$env:DATABASE_URL = "postgresql://user:password@host:5432/database"

# Run migrations
npx prisma migrate deploy

# Optional: Seed with initial data
npm run seed
```

### 4. Create Two Vercel Projects

#### Project 1: Client Portal

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Import your Git repository
3. Configure:
   - **Project Name:** `invoice-client-portal`
   - **Root Directory:** `src/apps/client-portal`
   - **Framework:** Next.js
   - **Build Command:** `cd ../.. && turbo run build --filter=@invoice-app/client-portal`
   - **Install Command:** `npm install --legacy-peer-deps`
   - **Output Directory:** `.next`

#### Project 2: Admin Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Import the **same repository** again
3. Configure:
   - **Project Name:** `invoice-admin-dashboard`
   - **Root Directory:** `src/apps/admin-dashboard`
   - **Framework:** Next.js
   - **Build Command:** `cd ../.. && turbo run build --filter=@invoice-app/admin-dashboard`
   - **Install Command:** `npm install --legacy-peer-deps`
   - **Output Directory:** `.next`

### 5. Add Environment Variables

Copy from `vercel-env-vars.txt` (created by the setup script).

**For Client Portal project:**
- Go to Settings → Environment Variables
- Add all variables from "SHARED VARIABLES" + "CLIENT PORTAL SPECIFIC"
- ⚠️ Add to **Production**, **Preview**, and **Development** environments

**For Admin Dashboard project:**
- Go to Settings → Environment Variables
- Add all variables from "SHARED VARIABLES" + "ADMIN DASHBOARD SPECIFIC"
- ⚠️ Add to **Production**, **Preview**, and **Development** environments

**Critical:** Both projects must use the **same** `JWT_SECRET` and `DATABASE_URL`!

---

## ✅ Deployment Checklist

- [ ] PostgreSQL database created
- [ ] Database migrations run (`prisma migrate deploy`)
- [ ] JWT_SECRET generated (from setup script)
- [ ] Client Portal project created in Vercel
- [ ] Admin Dashboard project created in Vercel
- [ ] Environment variables added to Client Portal (all 3 environments)
- [ ] Environment variables added to Admin Dashboard (all 3 environments)
- [ ] Both projects deployed successfully
- [ ] Test login on Client Portal
- [ ] Test login on Admin Dashboard

---

## 🌐 Custom Domains (Optional)

### Client Portal
1. Go to Client Portal project → Settings → Domains
2. Add `app.yourdomain.com`
3. Follow DNS instructions
4. Update environment variables:
   - `APP_URL=https://app.yourdomain.com`
   - `NEXT_PUBLIC_APP_URL=https://app.yourdomain.com`

### Admin Dashboard
1. Go to Admin Dashboard project → Settings → Domains
2. Add `admin.yourdomain.com`
3. Follow DNS instructions
4. Update environment variables:
   - `APP_URL=https://admin.yourdomain.com`
   - `NEXT_PUBLIC_APP_URL=https://admin.yourdomain.com`

---

## 🔧 Required Environment Variables

### Shared (Both Apps)

| Variable | Example | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://...` | PostgreSQL connection string |
| `JWT_SECRET` | `base64-encoded-string` | Must be same in both apps |
| `JWT_EXPIRES_IN` | `7d` | Token expiration |
| `RESEND_API_KEY` | `re_...` | Email service API key |

### Client Portal Only

| Variable | Example | Description |
|----------|---------|-------------|
| `APP_URL` | `https://app.yourdomain.com` | Client portal URL |
| `NEXT_PUBLIC_APP_URL` | `https://app.yourdomain.com` | Public client portal URL |
| `FROM_EMAIL` | `noreply@yourdomain.com` | Sender email |
| `FROM_NAME` | `Invoice App` | Sender name |
| `REPLY_TO_EMAIL` | `support@yourdomain.com` | Reply-to email |
| `CLIENT_PORTAL_URL` | `https://app.yourdomain.com` | Reference URL |

### Admin Dashboard Only

| Variable | Example | Description |
|----------|---------|-------------|
| `APP_URL` | `https://admin.yourdomain.com` | Admin dashboard URL |
| `NEXT_PUBLIC_APP_URL` | `https://admin.yourdomain.com` | Public admin URL |
| `FROM_EMAIL` | `admin@yourdomain.com` | Admin sender email |
| `FROM_NAME` | `Invoice App Admin` | Admin sender name |
| `REPLY_TO_EMAIL` | `admin@yourdomain.com` | Admin reply-to |
| `CLIENT_PORTAL_URL` | `https://app.yourdomain.com` | Client portal reference |

---

## 🚨 Common Issues

### Build Fails: "Cannot find module '@invoice-app/database'"

**Solution:** Ensure `npm install --legacy-peer-deps` is set as install command.

### Build Fails: "Prisma Client not generated"

**Solution:** Add postinstall script to root `package.json`:

```json
{
  "scripts": {
    "postinstall": "cd src/packages/database && npx prisma generate"
  }
}
```

### Database Connection Fails

**Solution:**
- Verify `DATABASE_URL` format: `postgresql://` (not `file:`)
- Ensure SSL mode: add `?sslmode=require` to connection string
- Check database allows connections from Vercel IPs

### Auth Token Invalid Across Apps

**Solution:** Ensure `JWT_SECRET` is **identical** in both Client Portal and Admin Dashboard.

### Too Many Database Connections

**Solution:** Enable connection pooling:
```
DATABASE_URL=postgresql://user:password@host:6543/database?pgbouncer=true
```

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────┐
│         Git Repository              │
│  (invoice-app monorepo)             │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
┌─────────────┐ ┌─────────────┐
│  Client     │ │   Admin     │
│  Portal     │ │  Dashboard  │
│  (Vercel)   │ │  (Vercel)   │
└──────┬──────┘ └──────┬──────┘
       │               │
       └───────┬───────┘
               │
               ▼
      ┌────────────────┐
      │   PostgreSQL   │
      │   (Shared DB)  │
      └────────────────┘
```

---

## 💰 Estimated Costs

- **Vercel Pro:** $20/month (covers both projects)
- **Vercel Postgres:** $20/month (shared database)
- **Resend Free:** 3,000 emails/month (free)

**Total:** ~$40/month

---

## 📚 Additional Resources

- **Full Guide:** See `DEPLOYMENT.md`
- **Vercel Docs:** https://vercel.com/docs
- **Prisma Docs:** https://prisma.io/docs
- **Resend Docs:** https://resend.com/docs

---

## 🆘 Need Help?

1. Check `DEPLOYMENT.md` for detailed troubleshooting
2. Review Vercel deployment logs
3. Check database connection with Prisma Studio: `npx prisma studio`

---

**Last Updated:** 2025-01-13
