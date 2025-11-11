# Deploy Invoice App to Vercel - Complete Guide

## Why Vercel?
- ✅ **FREE** for hobby projects
- ✅ Built by Next.js creators (perfect compatibility)
- ✅ Supports all your features (Clerk, API routes, Prisma)
- ✅ Deploy in 5 minutes
- ✅ Automatic HTTPS & previews

## Prerequisites
- GitHub/GitLab account (or deploy directly via CLI)
- Vercel account (free - create at vercel.com)
- Your Clerk keys (already have them!)

---

## Method 1: Deploy via GitHub (Recommended - Automatic Deployments)

### Step 1: Push Your Code to GitHub

```bash
# Initialize git if not already done
cd C:\Projects\ingenious\invoice-app\invoicingapp\invoice-app
git init
git add .
git commit -m "Initial commit - Invoice app"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR-USERNAME/invoice-app.git
git branch -M main
git push -u origin main
```

### Step 2: Connect to Vercel

1. Go to https://vercel.com/signup
2. Sign up with GitHub
3. Click "Add New Project"
4. Import your `invoice-app` repository
5. Configure project:

   **Framework Preset:** Next.js (auto-detected)

   **Root Directory:** `./` (leave as default)

   **Build Command:** `npm run build` (auto-detected)

   **Install Command:** `npm install` (auto-detected)

6. **Add Environment Variables:**

   Click "Environment Variables" and add:

   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   pk_test_cHJlbWl1bS15ZXRpLTcyLmNsZXJrLmFjY291bnRzLmRldiQ

   CLERK_SECRET_KEY
   sk_test_RegSO3YOO2usuL1WztkXCbJDyfkGT3BYbggH8uNA4B

   DATABASE_URL
   (see database options below)
   ```

7. Click "Deploy"

### Step 3: Wait for Build

- First build takes ~2-3 minutes
- You'll get a live URL: `https://your-project.vercel.app`
- Every push to `main` auto-deploys
- Pull requests get preview URLs

---

## Method 2: Deploy via CLI (Fastest - No GitHub Needed)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

Follow the prompts (opens browser to authenticate)

### Step 3: Deploy

```bash
cd C:\Projects\ingenious\invoice-app\invoicingapp\invoice-app

# First deployment (will ask questions)
vercel

# Answer prompts:
# ? Set up and deploy "...invoice-app"? [Y/n] y
# ? Which scope? (Your username)
# ? Link to existing project? [y/N] n
# ? What's your project's name? invoice-app
# ? In which directory is your code located? ./
```

### Step 4: Add Environment Variables

```bash
# Add Clerk public key
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

# Paste when prompted:
pk_test_cHJlbWl1bS15ZXRpLTcyLmNsZXJrLmFjY291bnRzLmRldiQ

# Select: Production, Preview, Development (space to select, enter to confirm)

# Add Clerk secret key
vercel env add CLERK_SECRET_KEY

# Paste:
sk_test_RegSO3YOO2usuL1WztkXCbJDyfkGT3BYbggH8uNA4B

# Add database URL (see database section below)
vercel env add DATABASE_URL
```

### Step 5: Deploy to Production

```bash
vercel --prod
```

Your app will be live at: `https://your-project.vercel.app`

### Future Deployments

```bash
# Just run:
vercel --prod
```

---

## Database Options (Required - SQLite Won't Work)

Your current SQLite database needs to be migrated to a cloud database. Here are the best options:

### **Option A: Vercel Postgres (Recommended - Integrated)**

**Pricing:** Free tier - 60 compute hours/month, 256 MB storage

1. **Enable Vercel Postgres:**
   - Go to your project on vercel.com
   - Click "Storage" tab
   - Click "Create Database"
   - Select "Postgres"
   - Create database

2. **Automatic Environment Variables:**
   - Vercel auto-adds `POSTGRES_URL` to your project
   - No manual configuration needed!

3. **Update Prisma Schema:**

   Edit `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

4. **Create and Run Migration:**
   ```bash
   # Generate new migration for PostgreSQL
   npx prisma migrate dev --name init_postgres

   # Or if you have existing migrations:
   npx prisma migrate deploy
   ```

5. **Seed Database (Optional):**
   ```bash
   npm run seed
   ```

---

### **Option B: Neon (PostgreSQL - Generous Free Tier)**

**Pricing:** Free - 10 GB storage, unlimited projects

1. **Create Account:**
   - Go to https://neon.tech
   - Sign up (free)
   - Create new project

2. **Get Connection String:**
   - Copy the connection string (starts with `postgresql://`)
   - Example: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`

3. **Add to Vercel:**
   ```bash
   vercel env add DATABASE_URL
   # Paste your Neon connection string
   ```

4. **Update Prisma & Migrate** (same as Option A above)

---

### **Option C: Supabase (PostgreSQL + More Features)**

**Pricing:** Free - 500 MB database, 2 GB bandwidth

1. **Create Project:**
   - Go to https://supabase.com
   - Create new project
   - Wait for provisioning (~2 min)

2. **Get Connection String:**
   - Go to Project Settings > Database
   - Copy "Connection string" (URI mode)
   - Replace `[YOUR-PASSWORD]` with your database password

3. **Add to Vercel & Migrate** (same as above)

---

## Complete Deployment Checklist

### Before Deployment:
- [ ] Code pushed to GitHub (Method 1) or ready locally (Method 2)
- [ ] Clerk keys ready (you have these!)
- [ ] Choose database provider (Vercel Postgres recommended)

### Deployment Steps:
- [ ] Create Vercel account
- [ ] Import/deploy project
- [ ] Add environment variables (Clerk keys)
- [ ] Set up database (Vercel Postgres)
- [ ] Update Prisma schema to PostgreSQL
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] (Optional) Seed database: `npm run seed`
- [ ] Test your app at vercel.app URL

### Post-Deployment:
- [ ] Update Clerk dashboard with production URL
- [ ] Test authentication
- [ ] Test creating/editing invoices
- [ ] Test all API routes

---

## Quick Commands Reference

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Add environment variable
vercel env add VARIABLE_NAME

# View deployment logs
vercel logs

# Open project in browser
vercel open

# Remove project
vercel remove
```

---

## Update Clerk Settings

After deployment, update your Clerk dashboard:

1. Go to https://dashboard.clerk.com
2. Select your application
3. Go to "Paths"
4. Add your Vercel URL:
   - Production: `https://your-project.vercel.app`
   - Development: `http://localhost:3001` (keep this)

---

## Troubleshooting

### Build Fails

**Error: Missing environment variables**
```bash
# Add missing variables
vercel env add VARIABLE_NAME
vercel --prod
```

**Error: Prisma Client not generated**
```bash
# Make sure package.json has postinstall script:
# "postinstall": "prisma generate"
```

### Database Connection Issues

**Error: Can't reach database**
- Check connection string is correct
- Ensure database allows connections from Vercel IPs (most do by default)
- For Vercel Postgres, ensure it's in same region as deployment

### Clerk Authentication Issues

**Error: Invalid publishable key**
- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set correctly
- Check it starts with `pk_test_` or `pk_live_`
- Make sure Vercel URL is added to Clerk dashboard

---

## Estimated Timeline

- **Setup Vercel account:** 2 minutes
- **First deployment:** 3-5 minutes
- **Database setup:** 5-10 minutes
- **Migration & testing:** 5 minutes

**Total: ~20 minutes to go live!**

---

## Cost Breakdown

| Service | Free Tier | Your Usage (Estimated) |
|---------|-----------|------------------------|
| **Vercel Hosting** | 100 GB bandwidth | ~1-5 GB (well within) ✅ |
| **Vercel Postgres** | 60 compute hours | ~10-20 hours ✅ |
| **Clerk Auth** | 10,000 MAU | Small team ✅ |
| **Total Cost** | **$0/month** | **$0/month** ✅ |

For a small invoice app with a few users, you'll comfortably stay on the free tier!

---

## Next Steps After Deployment

1. **Custom Domain (Optional):**
   ```bash
   vercel domains add yourdomain.com
   ```

2. **Automatic Deployments:**
   - Every push to `main` auto-deploys
   - Pull requests get preview URLs

3. **Monitor Performance:**
   - View analytics in Vercel dashboard
   - Check deployment logs
   - Monitor database usage

4. **Scale When Needed:**
   - Upgrade to Pro ($20/month) if you exceed free tier
   - Add more database storage as needed

---

## Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Vercel Community:** https://github.com/vercel/vercel/discussions
- **Prisma + Vercel:** https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel
- **Clerk Docs:** https://clerk.com/docs

---

## Ready to Deploy?

### Fastest Path (5 Minutes):

```bash
# 1. Install CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
cd C:\Projects\ingenious\invoice-app\invoicingapp\invoice-app
vercel

# 4. Add environment variables when prompted
# Then visit your live app!
```

**Your app will be live at:** `https://your-project.vercel.app`
